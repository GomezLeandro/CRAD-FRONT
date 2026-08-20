import { supabase } from '../lib/supabaseClient';
import type { ServiceResult, Servicio } from '../types/domain';

interface ServicioRow {
  id: string;
  rubro_key: string;
  nombre: string;
  descripcion: string;
  orden: number;
  activo: boolean;
}

function mapRow(row: ServicioRow): Servicio {
  return {
    id: row.id,
    rubroKey: row.rubro_key,
    nombre: row.nombre,
    descripcion: row.descripcion,
    orden: row.orden,
    activo: row.activo,
  };
}

const TABLE = 'servicios';

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

export async function actualizarServicio(
  id: string,
  input: Partial<ServicioInput>
): Promise<ServiceResult<Servicio>> {
  const patch: Record<string, unknown> = {};
  if (input.nombre !== undefined) patch.nombre = input.nombre;
  if (input.descripcion !== undefined) patch.descripcion = input.descripcion;
  if (input.rubroKey !== undefined) patch.rubro_key = input.rubroKey;
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
