import { supabase } from '../lib/supabaseClient';
import { nuevoGastoSchema } from '../lib/validation';
import type { Gasto, NuevoGastoInput, ServiceResult } from '../types/domain';

interface GastoRow {
  id: string;
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
  created_by: string;
  created_at: string;
  factura_id: string | null;
}

function mapRow(row: GastoRow): Gasto {
  return {
    id: row.id,
    concepto: row.concepto,
    categoria: row.categoria,
    monto: Number(row.monto),
    fecha: row.fecha,
    createdBy: row.created_by,
    createdAt: row.created_at,
    facturaId: row.factura_id,
  };
}

const TABLE = 'gastos';

/**
 * Admin/superadmin (RLS): un admin común solo puede cargar/ver/editar
 * gastos del mes en curso; superadmin ve todo el historial. Borrar es
 * exclusivo de superadmin.
 */
export async function crearGasto(input: NuevoGastoInput): Promise<ServiceResult<Gasto>> {
  const parsed = nuevoGastoSchema.safeParse(input);
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
      concepto: parsed.data.concepto,
      categoria: parsed.data.categoria,
      monto: parsed.data.monto,
      fecha: parsed.data.fecha,
      created_by: user.id,
    })
    .select()
    .single<GastoRow>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: mapRow(data) };
}

/**
 * Registra el gasto de materiales que se carga junto con una factura.
 * No pasa por `nuevoGastoSchema` (el monto ya viene validado por
 * `nuevaFacturaSchema`) — es una llamada interna de `facturasService`,
 * nunca se expone en un formulario propio.
 */
export async function crearGastoDeFactura(
  facturaId: string,
  clienteNombre: string,
  monto: number,
  fecha: string,
  createdBy: string
): Promise<ServiceResult<Gasto>> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      concepto: `Materiales — factura de ${clienteNombre}`,
      categoria: 'Materiales',
      monto,
      fecha,
      created_by: createdBy,
      factura_id: facturaId,
    })
    .select()
    .single<GastoRow>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: mapRow(data) };
}

/** Devuelve los gastos visibles para el usuario actual (RLS los acota por mes si no es superadmin). */
export async function listarGastos(): Promise<ServiceResult<Gasto[]>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('fecha', { ascending: false })
    .returns<GastoRow[]>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: data.map(mapRow) };
}

export async function eliminarGasto(id: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    if (error.code === 'PGRST116') {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Solo un superadmin puede borrar gastos.' },
      };
    }
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: null };
}
