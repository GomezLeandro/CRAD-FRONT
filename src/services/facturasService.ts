import { supabase } from '../lib/supabaseClient';
import { nuevaFacturaSchema } from '../lib/validation';
import { crearGastoDeFactura } from './gastosService';
import type {
  Factura,
  FacturaEstado,
  NuevaFacturaInput,
  ServiceResult,
} from '../types/domain';

interface FacturaRow {
  id: string;
  turno_id: string | null;
  cliente_nombre: string;
  concepto: string;
  monto: number;
  estado: FacturaEstado;
  fecha_emision: string;
  fecha_pago: string | null;
  created_by: string;
  created_at: string;
}

function mapRow(row: FacturaRow, gastoMateriales = 0): Factura {
  return {
    id: row.id,
    turnoId: row.turno_id,
    clienteNombre: row.cliente_nombre,
    concepto: row.concepto,
    monto: Number(row.monto),
    estado: row.estado,
    fechaEmision: row.fecha_emision,
    fechaPago: row.fecha_pago,
    createdBy: row.created_by,
    createdAt: row.created_at,
    gastoMateriales,
  };
}

/** Suma, por factura, los gastos de materiales que se cargaron junto con ella. */
async function obtenerGastosMaterialesPorFactura(
  facturaIds: string[]
): Promise<ServiceResult<Map<string, number>>> {
  if (facturaIds.length === 0) return { ok: true, data: new Map() };

  const { data, error } = await supabase
    .from('gastos')
    .select('factura_id, monto')
    .in('factura_id', facturaIds)
    .returns<{ factura_id: string | null; monto: number }[]>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }

  const totales = new Map<string, number>();
  for (const g of data) {
    if (!g.factura_id) continue;
    totales.set(g.factura_id, (totales.get(g.factura_id) ?? 0) + Number(g.monto));
  }
  return { ok: true, data: totales };
}

const TABLE = 'facturas';

/** Solo admin/superadmin (RLS). */
export async function crearFactura(
  input: NuevaFacturaInput
): Promise<ServiceResult<Factura>> {
  const parsed = nuevaFacturaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: 'UNAUTHORIZED', message: 'No hay sesión activa.' } };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      turno_id: parsed.data.turnoId ?? null,
      cliente_nombre: parsed.data.clienteNombre,
      concepto: parsed.data.concepto,
      monto: parsed.data.monto,
      fecha_emision: parsed.data.fechaEmision,
      estado: 'pendiente',
      created_by: user.id,
    })
    .select()
    .single<FacturaRow>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }

  const gastoMateriales = parsed.data.gastoMateriales ?? 0;
  if (gastoMateriales > 0) {
    const gastoResult = await crearGastoDeFactura(
      data.id,
      parsed.data.clienteNombre,
      gastoMateriales,
      parsed.data.fechaEmision,
      user.id
    );
    // La factura ya se creó; si el gasto vinculado falla no la invalidamos,
    // pero avisamos para que se cargue a mano desde Gastos si hace falta.
    if (!gastoResult.ok) {
      console.error('No se pudo registrar el gasto de materiales:', gastoResult.error.message);
    }
  }

  return { ok: true, data: mapRow(data, gastoMateriales) };
}

export async function listarFacturas(): Promise<ServiceResult<Factura[]>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('fecha_emision', { ascending: false })
    .returns<FacturaRow[]>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }

  const totalesRes = await obtenerGastosMaterialesPorFactura(data.map((f) => f.id));
  const totales = totalesRes.ok ? totalesRes.data : new Map<string, number>();

  return { ok: true, data: data.map((row) => mapRow(row, totales.get(row.id) ?? 0)) };
}

export async function marcarFacturaPagada(
  id: string,
  fechaPago: string
): Promise<ServiceResult<Factura>> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ estado: 'pagada', fecha_pago: fechaPago })
    .eq('id', id)
    .select()
    .single<FacturaRow>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: mapRow(data) };
}

export interface IngresoMensual {
  mes: string; // 'YYYY-MM'
  total: number;
}

/**
 * Agrega el total facturado por mes para el dashboard de crecimiento.
 * El agregado se hace en el cliente sobre los datos ya filtrados por
 * RLS — para un volumen alto convendría una vista materializada o una
 * función de Postgres, pero para el tamaño actual esto alcanza y sigue
 * pasando por este mismo service (los componentes no tocan Supabase).
 */
export async function obtenerIngresosPorMes(): Promise<
  ServiceResult<IngresoMensual[]>
> {
  const result = await listarFacturas();
  if (!result.ok) return result;

  const totales = new Map<string, number>();
  for (const f of result.data) {
    const mes = f.fechaEmision.slice(0, 7); // 'YYYY-MM'
    totales.set(mes, (totales.get(mes) ?? 0) + f.monto);
  }

  const ordenado = Array.from(totales.entries())
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  return { ok: true, data: ordenado };
}
