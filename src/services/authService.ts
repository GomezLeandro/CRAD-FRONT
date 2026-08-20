import { supabase } from '../lib/supabaseClient';
import { loginSchema } from '../lib/validation';
import type { Profile, ServiceResult, UserRole } from '../types/domain';

interface ProfileRow {
  id: string;
  nombre: string;
  role: UserRole;
  created_at: string;
}

function mapRow(row: ProfileRow): Profile {
  return { id: row.id, nombre: row.nombre, role: row.role, createdAt: row.created_at };
}

/**
 * Login con email/password. Supabase Auth se encarga de:
 *  - hashear y verificar la contraseña (nunca la vemos en texto plano
 *    del lado del servidor),
 *  - rate-limiting de intentos fallidos,
 *  - emitir el JWT de sesión (httpOnly no aplica acá porque es un SDK
 *    de cliente puro; el token vive en localStorage — ver SECURITY.md
 *    para el trade-off y la mitigación con expiración corta).
 */
export async function login(
  email: string,
  password: string
): Promise<ServiceResult<Profile>> {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (authError || !authData.user) {
    // Mensaje deliberadamente genérico: no revelamos si el email existe
    // o no (evita user enumeration — OWASP A07).
    return {
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Email o contraseña incorrectos.' },
    };
  }

  return obtenerPerfilActual();
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/** Perfil (con rol) del usuario logueado, o null si no hay sesión. */
export async function obtenerPerfilActual(): Promise<ServiceResult<Profile>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: 'UNAUTHORIZED', message: 'No hay sesión activa.' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<ProfileRow>();

  if (error || !data) {
    return {
      ok: false,
      error: { code: 'NOT_FOUND', message: 'No se encontró el perfil del usuario.' },
    };
  }

  return { ok: true, data: mapRow(data) };
}

export function onAuthStateChange(callback: () => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => callback());
  return () => subscription.unsubscribe();
}

/**
 * Gestión de usuarios — solo superadmin puede ejecutar esto (RLS).
 *
 * IMPORTANTE: crear una cuenta NUEVA (email+password) requiere la
 * `service_role key` de Supabase, que NUNCA debe vivir en el frontend
 * (bypassea RLS por completo). Por eso esta capa solo lista perfiles
 * existentes y cambia su rol — el alta de un usuario nuevo se hace
 * con una Supabase Edge Function server-side (ver
 * /supabase/functions/invite-admin como referencia) o a mano desde
 * el dashboard de Supabase.
 */
export async function listarPerfiles(): Promise<ServiceResult<Profile[]>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
    .returns<ProfileRow[]>();

  if (error) return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  return { ok: true, data: data.map(mapRow) };
}

export async function actualizarRolPerfil(
  id: string,
  role: UserRole
): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single<ProfileRow>();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Solo un superadmin puede cambiar roles.' },
      };
    }
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: mapRow(data) };
}
