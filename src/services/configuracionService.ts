import { supabase } from '../lib/supabaseClient';
import type { ServiceResult } from '../types/domain';

/**
 * Configuración editable del panel (hoy, solo el % de comisión societaria).
 * Cualquier admin puede leerla (la necesita el dashboard de Finanzas);
 * solo superadmin puede cambiarla (RLS).
 */

const TABLE = 'configuracion';
const DEFAULT_COMISION_PCT = 25;

export async function obtenerComisionPct(): Promise<ServiceResult<number>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('valor')
    .eq('clave', 'comision_pct')
    .maybeSingle<{ valor: string }>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  const pct = data ? Number(data.valor) : DEFAULT_COMISION_PCT;
  return { ok: true, data: Number.isFinite(pct) ? pct : DEFAULT_COMISION_PCT };
}

export async function actualizarComisionPct(pct: number): Promise<ServiceResult<number>> {
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'El porcentaje debe estar entre 0 y 100.' },
    };
  }

  const { error } = await supabase
    .from(TABLE)
    .update({ valor: String(pct), updated_at: new Date().toISOString() })
    .eq('clave', 'comision_pct');

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Solo un superadmin puede cambiar la comisión.' },
      };
    }
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: pct };
}
