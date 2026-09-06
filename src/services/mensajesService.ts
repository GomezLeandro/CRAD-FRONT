import { supabase } from '../lib/supabaseClient';
import { nuevoMensajeSchema } from '../lib/validation';
import type { Mensaje, NuevoMensajeInput, ServiceResult } from '../types/domain';

interface MensajeRow {
  id: string;
  nombre: string;
  contacto: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
}

function mapRow(row: MensajeRow): Mensaje {
  return {
    id: row.id,
    nombre: row.nombre,
    contacto: row.contacto,
    mensaje: row.mensaje,
    leido: row.leido,
    createdAt: row.created_at,
  };
}

const TABLE = 'mensajes';

/**
 * Envío público del formulario de contacto general.
 *
 * OJO: no encadenar `.select()` acá. La política de SELECT de esta tabla
 * es admin-only, y un INSERT ... RETURNING queda sujeto a esa misma
 * política — sin fila visible para devolver, Postgres rechaza el INSERT
 * entero con "new row violates row-level security policy", aunque el
 * WITH CHECK del insert sea válido. Quien manda el mensaje no necesita
 * leerlo de vuelta, así que devolvemos `null`.
 */
export async function crearMensaje(
  input: NuevoMensajeInput
): Promise<ServiceResult<null>> {
  const parsed = nuevoMensajeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }
  const { website: _honeypot, ...clean } = parsed.data;

  const { error } = await supabase.from(TABLE).insert(clean);

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: null };
}

/** Bandeja de entrada — requiere sesión admin/superadmin (RLS). */
export async function listarMensajes(): Promise<ServiceResult<Mensaje[]>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .returns<MensajeRow[]>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: data.map(mapRow) };
}

export async function marcarMensajeLeido(
  id: string,
  leido: boolean
): Promise<ServiceResult<Mensaje>> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ leido })
    .eq('id', id)
    .select()
    .single<MensajeRow>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: mapRow(data) };
}
