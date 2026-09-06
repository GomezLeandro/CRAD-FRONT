import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import {
  actualizarEmailSchema,
  actualizarNombrePerfilSchema,
  invitarUsuarioSchema,
  loginSchema,
  recoverPasswordSchema,
  updatePasswordSchema,
} from '../lib/validation';
import type { Profile, ServiceResult, UserRole } from '../types/domain';

interface ProfileRow {
  id: string;
  nombre: string;
  role: UserRole;
  created_at: string;
  avatar_url: string | null;
}

function mapRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    nombre: row.nombre,
    role: row.role,
    createdAt: row.created_at,
    avatarUrl: row.avatar_url,
  };
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

/**
 * Pide el email de recuperación de contraseña a Supabase Auth.
 *
 * La respuesta es siempre genérica (ok: true) exista o no el email:
 * igual que en `login`, evitamos user enumeration (OWASP A07).
 */
export async function solicitarRecuperacionPassword(
  email: string
): Promise<ServiceResult<null>> {
  const parsed = recoverPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${window.location.origin}/admin/reset-password`,
  });

  return { ok: true, data: null };
}

/**
 * Cambia el email del usuario logueado. Supabase Auth manda un email de
 * confirmación a la dirección nueva — el cambio no se aplica hasta que
 * se confirma ese link.
 */
export async function actualizarEmail(email: string): Promise<ServiceResult<null>> {
  const parsed = actualizarEmailSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: null };
}

/** Establece una nueva contraseña. Requiere la sesión de recuperación que Supabase arma desde el link del email. */
export async function actualizarPassword(password: string): Promise<ServiceResult<null>> {
  const parsed = updatePasswordSchema.safeParse({ password });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: null };
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

const AVATARES_BUCKET = 'avatares';

/** Sube la foto de perfil al bucket público y devuelve su URL. No la guarda todavía en `profiles`. */
export async function subirAvatar(file: File): Promise<ServiceResult<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: 'UNAUTHORIZED', message: 'No hay sesión activa.' } };
  }

  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATARES_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { ok: false, error: { code: 'UNKNOWN', message: uploadError.message } };
  }

  const { data } = supabase.storage.from(AVATARES_BUCKET).getPublicUrl(path);
  return { ok: true, data: data.publicUrl };
}

/** Guarda la URL del avatar en el propio perfil (RLS: cada usuario solo puede editar su fila). */
export async function actualizarAvatar(avatarUrl: string): Promise<ServiceResult<Profile>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: 'UNAUTHORIZED', message: 'No hay sesión activa.' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)
    .select()
    .single<ProfileRow>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: mapRow(data) };
}

/** Cambia el nombre del propio perfil. */
export async function actualizarNombrePropio(nombre: string): Promise<ServiceResult<Profile>> {
  const parsed = actualizarNombrePerfilSchema.safeParse({ nombre });
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
    .from('profiles')
    .update({ nombre: parsed.data.nombre })
    .eq('id', user.id)
    .select()
    .single<ProfileRow>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: mapRow(data) };
}

/**
 * "Blanquear contraseña": un superadmin fuerza la contraseña de otro
 * usuario a la genérica (Crad2026$) para que pueda volver a entrar y
 * cambiarla desde su perfil. Corre en la Edge Function `reset-password-admin`
 * porque requiere la service_role key (igual que invitarUsuario).
 */
export async function resetearPasswordGenerica(userId: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.functions.invoke('reset-password-admin', {
    body: { userId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      return {
        ok: false,
        error: { code: 'UNKNOWN', message: body?.error ?? error.message },
      };
    }
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: null };
}

/** Email actual de la sesión (vive en auth.users, no en `profiles`). */
export async function obtenerEmailActual(): Promise<ServiceResult<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, error: { code: 'UNAUTHORIZED', message: 'No hay sesión activa.' } };
  }
  return { ok: true, data: user.email };
}

/**
 * Borra un usuario del panel (y su perfil, por ON DELETE CASCADE). Corre
 * en la Edge Function `delete-admin-user` porque requiere la service_role
 * key (igual que invitarUsuario / resetearPasswordGenerica).
 */
export async function eliminarUsuario(userId: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.functions.invoke('delete-admin-user', {
    body: { userId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      return {
        ok: false,
        error: { code: 'UNKNOWN', message: body?.error ?? error.message },
      };
    }
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: null };
}

export function onAuthStateChange(callback: () => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => callback());
  return () => subscription.unsubscribe();
}

/**
 * Gestión de usuarios — solo superadmin puede ejecutar esto (RLS y,
 * para invitarUsuario, la propia Edge Function del lado del servidor).
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

/**
 * Invita a una persona nueva por email (elige su propia contraseña al
 * aceptar). Corre en la Edge Function `invite-admin`, del lado del
 * servidor: crear un usuario requiere la service_role key, que nunca
 * puede vivir en el navegador (bypassea RLS por completo).
 */
export async function invitarUsuario(
  nombre: string,
  email: string,
  role: UserRole
): Promise<ServiceResult<null>> {
  const parsed = invitarUsuarioSchema.safeParse({ nombre, email, role });
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  const { error } = await supabase.functions.invoke('invite-admin', {
    body: parsed.data,
  });

  if (error) {
    // La función manda { error: "mensaje" } en el body de la respuesta;
    // sin esto, supabase-js solo da un mensaje genérico ("non-2xx status").
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      return {
        ok: false,
        error: { code: 'UNKNOWN', message: body?.error ?? error.message },
      };
    }
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }
  return { ok: true, data: null };
}
