import { supabase } from '../lib/supabaseClient';
import type { ServiceResult, Servicio } from '../types/domain';

interface ServicioRow {
  id: string;
  rubro_key: string;
  nombre: string;
  descripcion: string;
  icono_url: string | null;
  orden: number;
  activo: boolean;
}

function mapRow(row: ServicioRow): Servicio {
  return {
    id: row.id,
    rubroKey: row.rubro_key,
    nombre: row.nombre,
    descripcion: row.descripcion,
    iconoUrl: row.icono_url,
    orden: row.orden,
    activo: row.activo,
  };
}

const TABLE = 'servicios';
const ICONOS_BUCKET = 'servicios-iconos';

export async function listarServiciosPublicos(): Promise<ServiceResult<Servicio[]>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })
    .returns<ServicioRow[]>();

  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: data.map(mapRow) };
}

export async function listarServiciosAdmin(): Promise<ServiceResult<Servicio[]>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('orden', { ascending: true })
    .returns<ServicioRow[]>();

  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: data.map(mapRow) };
}

export type ServicioInput = Omit<Servicio, 'id'>;

export async function crearServicio(input: ServicioInput): Promise<ServiceResult<Servicio>> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      rubro_key: input.rubroKey,
      nombre: input.nombre,
      descripcion: input.descripcion,
      icono_url: input.iconoUrl,
      orden: input.orden,
      activo: input.activo,
    })
    .select()
    .single<ServicioRow>();

  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: mapRow(data) };
}

/**
 * Sube el archivo de ícono al bucket público de Storage y devuelve su URL.
 * El bucket ("servicios-iconos") y sus políticas se crean desde el dashboard
 * de Supabase, no desde acá (la anon key no tiene permisos para crear buckets).
 */
export async function subirIconoServicio(file: File): Promise<ServiceResult<string>> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(ICONOS_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { ok: false, error: { code: 'UNKNOWN', message: uploadError.message } };
  }

  const { data } = supabase.storage.from(ICONOS_BUCKET).getPublicUrl(path);
  return { ok: true, data: data.publicUrl };
}

export async function eliminarServicio(id: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: null };
}

export async function actualizarServicio(
  id: string,
  input: Partial<ServicioInput>
): Promise<ServiceResult<Servicio>> {
  const patch: Record<string, unknown> = {};
  if (input.nombre !== undefined) patch.nombre = input.nombre;
  if (input.descripcion !== undefined) patch.descripcion = input.descripcion;
  if (input.rubroKey !== undefined) patch.rubro_key = input.rubroKey;
  if (input.iconoUrl !== undefined) patch.icono_url = input.iconoUrl;
  if (input.orden !== undefined) patch.orden = input.orden;
  if (input.activo !== undefined) patch.activo = input.activo;

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .single<ServicioRow>();

  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: mapRow(data) };
}
