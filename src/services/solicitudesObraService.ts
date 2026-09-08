import { supabase } from '../lib/supabaseClient';
import { nuevaSolicitudObraSchema } from '../lib/validation';
import type {
  NuevaSolicitudObraInput,
  ServiceResult,
  SolicitudObra,
} from '../types/domain';

interface SolicitudObraRow {
  id: string;
  tipo_proyecto: string;
  superficie: number | null;
  zona: string;
  descripcion: string;
  archivo_url: string | null;
  nombre: string;
  contacto: string;
  leido: boolean;
  created_at: string;
}

function mapRow(row: SolicitudObraRow): SolicitudObra {
  return {
    id: row.id,
    tipoProyecto: row.tipo_proyecto,
    superficie: row.superficie,
    zona: row.zona,
    descripcion: row.descripcion,
    archivoUrl: row.archivo_url,
    nombre: row.nombre,
    contacto: row.contacto,
    leido: row.leido,
    createdAt: row.created_at,
  };
}

const TABLE = 'solicitudes_obra';
const ADJUNTOS_BUCKET = 'obra-adjuntos';

/** Sube el plano/referencia adjunto (si lo hay) y devuelve su URL pública. */
export async function subirAdjuntoObra(file: File): Promise<ServiceResult<string>> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(ADJUNTOS_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { ok: false, error: { code: 'UNKNOWN', message: uploadError.message } };
  }

  const { data } = supabase.storage.from(ADJUNTOS_BUCKET).getPublicUrl(path);
  return { ok: true, data: data.publicUrl };
}

/**
 * Envío público del formulario "Contanos tu proyecto" de la sección Obra.
 *
 * OJO: no encadenar `.select()` acá. La política de SELECT de esta tabla
 * es admin-only, y un INSERT ... RETURNING queda sujeto a esa misma
 * política — sin fila visible para devolver, Postgres rechaza el INSERT
 * entero. Quien manda la solicitud no necesita leerla de vuelta.
 */
export async function crearSolicitudObra(
  input: NuevaSolicitudObraInput
): Promise<ServiceResult<null>> {
  const parsed = nuevaSolicitudObraSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }
  const { website: _honeypot, ...clean } = parsed.data;

  const { error } = await supabase.from(TABLE).insert({
    tipo_proyecto: clean.tipoProyecto,
    superficie: clean.superficie ?? null,
    zona: clean.zona,
    descripcion: clean.descripcion,
    archivo_url: clean.archivoUrl ?? null,
    nombre: clean.nombre,
    contacto: clean.contacto,
    leido: false,
  });

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: null };
}

/** Bandeja de entrada — requiere sesión admin/superadmin (RLS). */
export async function listarSolicitudesObra(): Promise<ServiceResult<SolicitudObra[]>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .returns<SolicitudObraRow[]>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: data.map(mapRow) };
}

export async function marcarSolicitudObraLeida(
  id: string,
  leido: boolean
): Promise<ServiceResult<SolicitudObra>> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ leido })
    .eq('id', id)
    .select()
    .single<SolicitudObraRow>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: mapRow(data) };
}

/** Para el badge del panel admin. */
export async function contarSolicitudesObraNoLeidas(): Promise<ServiceResult<number>> {
  const { count, error } = await supabase
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('leido', false);

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: count ?? 0 };
}
