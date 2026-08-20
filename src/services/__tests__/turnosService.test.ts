import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NuevoTurnoInput } from '../../types/domain';

// Mockeamos el módulo del cliente de Supabase ANTES de importar el
// service, para que nunca se dispare una llamada de red real.
const singleMock = vi.fn();
const selectMock = vi.fn(() => ({ single: singleMock }));
const insertMock = vi.fn((_payload: Record<string, unknown>) => ({ select: selectMock }));
const eqMock = vi.fn();
const updateMock = vi.fn();
const orderMock = vi.fn();
const fromMock = vi.fn();

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

// Importamos DESPUÉS del mock (requisito de vi.mock con hoisting).
const { crearTurno, listarTurnos, actualizarEstadoTurno } = await import(
  '../turnosService'
);

const inputValido: NuevoTurnoInput = {
  rubro: 'Plomería',
  problema: 'Se tapó la pileta de la cocina y pierde agua por abajo.',
  direccion: 'Av. San Martín 1234, San Martín',
  contacto: '+54 9 11 2237-0857',
  fecha: '2026-08-10',
  horario: '11:30',
  urgente: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  fromMock.mockReturnValue({ insert: insertMock, select: selectMock, update: updateMock });
  updateMock.mockReturnValue({ eq: eqMock });
  eqMock.mockReturnValue({ select: selectMock });
});

describe('crearTurno', () => {
  it('rechaza el input antes de tocar la red si es inválido', async () => {
    const result = await crearTurno({ ...inputValido, problema: 'corto' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rechaza si el honeypot viene lleno (bot)', async () => {
    const result = await crearTurno({ ...inputValido, website: 'http://spam.com' });

    expect(result.ok).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('crea el turno en estado pendiente cuando el input es válido', async () => {
    singleMock.mockResolvedValue({
      data: {
        id: 'turno-1',
        rubro: 'Plomería',
        problema: inputValido.problema,
        direccion: inputValido.direccion,
        contacto: inputValido.contacto,
        fecha: inputValido.fecha,
        horario: inputValido.horario,
        urgente: false,
        estado: 'pendiente',
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
        confirmado_por: null,
      },
      error: null,
    });

    const result = await crearTurno(inputValido);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.estado).toBe('pendiente');
      expect(result.data.id).toBe('turno-1');
    }
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'pendiente', rubro: 'Plomería' })
    );
    // El honeypot nunca debe llegar al insert.
    const insertPayload = insertMock.mock.calls[0][0];
    expect(insertPayload).not.toHaveProperty('website');
  });

  it('devuelve SLOT_TAKEN si Postgres rechaza por horario duplicado (23505)', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const result = await crearTurno(inputValido);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('SLOT_TAKEN');
  });

  it('devuelve UNKNOWN para cualquier otro error de base', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '500', message: 'algo raro pasó' },
    });

    const result = await crearTurno(inputValido);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNKNOWN');
  });
});

describe('listarTurnos', () => {
  it('mapea las filas de snake_case a camelCase', async () => {
    orderMock.mockReturnValue({
      order: orderMock,
      returns: () =>
        Promise.resolve({
          data: [
            {
              id: 't1',
              rubro: 'Gas',
              problema: 'Pierde gas en la cocina',
              direccion: 'Calle Falsa 123',
              contacto: 'tel',
              fecha: '2026-08-10',
              horario: '09:00',
              urgente: true,
              estado: 'pendiente',
              created_at: '2026-08-01T00:00:00Z',
              updated_at: '2026-08-01T00:00:00Z',
              confirmado_por: null,
            },
          ],
          error: null,
        }),
    });
    fromMock.mockReturnValue({ select: () => ({ order: orderMock }) });

    const result = await listarTurnos();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].confirmadoPor).toBeNull();
      expect(result.data[0].createdAt).toBe('2026-08-01T00:00:00Z');
    }
  });
});

describe('actualizarEstadoTurno', () => {
  it('devuelve UNAUTHORIZED cuando RLS bloquea la operación (PGRST116)', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'no rows returned' },
    });

    const result = await actualizarEstadoTurno('turno-1', 'confirmado');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it('confirma el turno cuando la operación es exitosa', async () => {
    singleMock.mockResolvedValue({
      data: {
        id: 'turno-1',
        rubro: 'Plomería',
        problema: inputValido.problema,
        direccion: inputValido.direccion,
        contacto: inputValido.contacto,
        fecha: inputValido.fecha,
        horario: inputValido.horario,
        urgente: false,
        estado: 'confirmado',
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-02T00:00:00Z',
        confirmado_por: 'admin-1',
      },
      error: null,
    });

    const result = await actualizarEstadoTurno('turno-1', 'confirmado');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.estado).toBe('confirmado');
  });
});
