import { supabase } from '../lib/supabaseClient';
import { nuevoTurnoSchema } from '../lib/validation';
import type {
  NuevoTurnoInput,
  ServiceResult,
  Turno,
  TurnoEstado,
} from '../types/domain';

/**
 * Capa de acceso a datos para "turnos". Ningún componente debe importar
 * `supabase` directamente: todo pasa por acá. Esto permite:
 *  - centralizar la validación y el manejo de errores,
 *  - testear los componentes con un mock de este módulo (sin red real),
 *  - cambiar de backend el día de mañana tocando un solo archivo.
 */

interface TurnoRow {
  id: string;
  rubro: string;
  problema: string;
  direccion: string;
  contacto: string;
  fecha: string;
  horario: string;
  urgente: boolean;
  estado: TurnoEstado;
  created_at: string;
  updated_at: string;
  confirmado_por: string | null;
}

function mapRow(row: TurnoRow): Turno {
  return {
    id: row.id,
    rubro: row.rubro,
    problema: row.problema,
    direccion: row.direccion,
    contacto: row.contacto,
    fecha: row.fecha,
    horario: row.horario,
    urgente: row.urgente,
    estado: row.estado,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmadoPor: row.confirmado_por,
  };
}

const TABLE = 'turnos';

/**
 * Crea un turno en estado "pendiente". Es una operación PÚBLICA (no
 * requiere sesión) — la RLS de Postgres solo permite INSERT con
 * estado='pendiente', nunca otro valor (ver policies.sql).
 *
 * OJO: no encadenar `.select()` acá. La política de SELECT de esta tabla
 * es admin-only, y un INSERT ... RETURNING queda sujeto a esa misma
 * política — sin fila visible para devolver, Postgres rechaza el INSERT
 * entero con "new row violates row-level security policy", aunque el
 * WITH CHECK del insert sea válido. Como quien reserva un turno no
 * necesita leer su propia fila de vuelta, devolvemos `null`.
 */
export async function crearTurno(
  input: NuevoTurnoInput
): Promise<ServiceResult<null>> {
  // El honeypot nunca se manda a la base; si vino lleno, ya lo filtra
  // el schema (max(0)) y devolvemos error genérico sin dar pistas al bot.
  const parsed = nuevoTurnoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  const { website: _honeypot, ...clean } = parsed.data;

  const { error } = await supabase.from(TABLE).insert({
    rubro: clean.rubro,
    problema: clean.problema,
    direccion: clean.direccion,
    contacto: clean.contacto,
    fecha: clean.fecha,
    horario: clean.horario,
    urgente: clean.urgente,
    estado: 'pendiente',
  });

  if (error) {
    // 23505 = unique_violation en Postgres → alguien ya tomó ese horario.
    if (error.code === '23505') {
      return {
        ok: false,
        error: {
          code: 'SLOT_TAKEN',
          message: 'Ese horario ya fue reservado. Elegí otro turno disponible.',
        },
      };
    }
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }

  return { ok: true, data: null };
}

/**
 * Lista turnos para el panel admin. Requiere sesión — si el usuario no
 * está autenticado o no tiene rol admin/superadmin, RLS devuelve 0 filas
 * (no un error), así que este service no necesita saber nada de roles.
 */
export async function listarTurnos(
  filtroEstado?: TurnoEstado
): Promise<ServiceResult<Turno[]>> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('fecha', { ascending: true })
    .order('horario', { ascending: true });

  if (filtroEstado) {
    query = query.eq('estado', filtroEstado);
  }

  const { data, error } = await query.returns<TurnoRow[]>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }

  return { ok: true, data: data.map(mapRow) };
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Turnos confirmados de hoy a los próximos `dias` días, para la agenda del dashboard. */
export async function listarAgendaSemana(dias = 7): Promise<ServiceResult<Turno[]>> {
  const hoy = new Date();
  const hasta = new Date(hoy);
  hasta.setDate(hasta.getDate() + dias - 1);

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('estado', 'confirmado')
    .gte('fecha', toISODate(hoy))
    .lte('fecha', toISODate(hasta))
    .order('fecha', { ascending: true })
    .order('horario', { ascending: true })
    .returns<TurnoRow[]>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: data.map(mapRow) };
}

/**
 * Confirma o rechaza un turno. Solo admin/superadmin pueden ejecutar
 * este UPDATE (enforced por RLS). `confirmado_por` lo completa un
 * trigger de Postgres con auth.uid(), no lo mandamos desde el cliente
 * para que no se pueda falsificar quién confirmó.
 */
export async function actualizarEstadoTurno(
  id: string,
  estado: Extract<TurnoEstado, 'confirmado' | 'rechazado' | 'completado'>
): Promise<ServiceResult<Turno>> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ estado })
    .eq('id', id)
    .select()
    .single<TurnoRow>();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'No tenés permiso para hacer esto.' },
      };
    }
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }

  return { ok: true, data: mapRow(data) };
}
