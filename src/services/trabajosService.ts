import { supabase } from '../lib/supabaseClient';
import type { ServiceResult, Trabajo } from '../types/domain';

interface TrabajoRow {
  id: string;
  titulo: string;
  ubicacion: string;
  descripcion: string;
  imagen_url: string | null;
  orden: number;
  activo: boolean;
}

function mapRow(row: TrabajoRow): Trabajo {
  return {
    id: row.id,
    titulo: row.titulo,
    ubicacion: row.ubicacion,
    descripcion: row.descripcion,
    imagenUrl: row.imagen_url,
    orden: row.orden,
    activo: row.activo,
  };
}

const TABLE = 'trabajos';

/** Público: solo trae los activos, para la sección Trabajos del sitio. */
export async function listarTrabajosPublicos(): Promise<ServiceResult<Trabajo[]>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })
    .returns<TrabajoRow[]>();

  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: data.map(mapRow) };
}

/** Superadmin: trae todo (activos e inactivos) para el panel de edición. */
export async function listarTrabajosAdmin(): Promise<ServiceResult<Trabajo[]>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('orden', { ascending: true })
    .returns<TrabajoRow[]>();

  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: data.map(mapRow) };
}

export type TrabajoInput = Omit<Trabajo, 'id'>;

export async function crearTrabajo(
  input: TrabajoInput
): Promise<ServiceResult<Trabajo>> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      titulo: input.titulo,
      ubicacion: input.ubicacion,
      descripcion: input.descripcion,
      imagen_url: input.imagenUrl,
      orden: input.orden,
      activo: input.activo,
    })
    .select()
    .single<TrabajoRow>();

  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: mapRow(data) };
}

export async function actualizarTrabajo(
  id: string,
  input: Partial<TrabajoInput>
): Promise<ServiceResult<Trabajo>> {
  const patch: Record<string, unknown> = {};
  if (input.titulo !== undefined) patch.titulo = input.titulo;
  if (input.ubicacion !== undefined) patch.ubicacion = input.ubicacion;
  if (input.descripcion !== undefined) patch.descripcion = input.descripcion;
  if (input.imagenUrl !== undefined) patch.imagen_url = input.imagenUrl;
  if (input.orden !== undefined) patch.orden = input.orden;
  if (input.activo !== undefined) patch.activo = input.activo;

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .single<TrabajoRow>();

  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: mapRow(data) };
}

export async function eliminarTrabajo(id: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: null };
}
