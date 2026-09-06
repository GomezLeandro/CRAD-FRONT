import { describe, it, expect, vi, beforeEach } from 'vitest';

const returnsMock = vi.fn();
const gastosReturnsMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const orderMock = vi.fn(() => ({ returns: returnsMock }));
const inMock = vi.fn(() => ({ returns: gastosReturnsMock }));
const selectMock = vi.fn(() => ({ order: orderMock, in: inMock }));
const fromMock = vi.fn((..._args: unknown[]) => ({ select: selectMock }));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

const { obtenerIngresosPorMes } = await import('../facturasService');

function fila(fechaEmision: string, monto: number) {
  return {
    id: crypto.randomUUID(),
    turno_id: null,
    cliente_nombre: 'Cliente',
    concepto: 'Trabajo',
    monto,
    estado: 'pagada',
    fecha_emision: fechaEmision,
    fecha_pago: null,
    created_by: 'admin-1',
    created_at: fechaEmision,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('obtenerIngresosPorMes', () => {
  it('agrupa y suma los montos por mes, ordenado cronológicamente', async () => {
    returnsMock.mockResolvedValue({
      data: [
        fila('2026-07-15', 10000),
        fila('2026-08-02', 5000),
        fila('2026-07-01', 20000),
        fila('2026-08-20', 15000),
      ],
      error: null,
    });

    const result = await obtenerIngresosPorMes();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([
        { mes: '2026-07', total: 30000 },
        { mes: '2026-08', total: 20000 },
      ]);
    }
  });

  it('devuelve lista vacía si no hay facturas', async () => {
    returnsMock.mockResolvedValue({ data: [], error: null });

    const result = await obtenerIngresosPorMes();

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it('propaga el error si falla la consulta', async () => {
    returnsMock.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const result = await obtenerIngresosPorMes();

    expect(result.ok).toBe(false);
  });
});
