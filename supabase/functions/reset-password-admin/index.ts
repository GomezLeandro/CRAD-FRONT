// supabase/functions/reset-password-admin/index.ts
//
// Edge Function — corre en el servidor de Supabase, nunca en el navegador.
// "Blanquear contraseña": el superadmin fuerza la contraseña de otro
// usuario a una genérica conocida, para el caso típico de "me olvidé la
// contraseña". Igual que invite-admin, esto requiere la service_role key
// (auth.admin.updateUserById), así que no puede vivir en el cliente.
//
// Invocación desde el panel:
//   await supabase.functions.invoke('reset-password-admin', { body: { userId } })

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Contraseña genérica conocida: el usuario entra con esta y la cambia
// desde "Mi perfil". Vive acá (servidor), nunca se manda desde el cliente.
const CONTRASENA_GENERICA = 'Crad2026$';

function respond(body: unknown, status: number): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return respond({ error: 'Método no permitido' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return respond({ error: 'No autenticado' }, 401);

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return respond({ error: 'No autenticado' }, 401);

  const { data: profile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'superadmin') {
    return respond({ error: 'Solo un superadmin puede blanquear contraseñas' }, 403);
  }

  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return respond({ error: 'Body inválido' }, 400);
  }

  const userId = (body.userId ?? '').trim();
  if (!userId) {
    return respond({ error: 'Falta el usuario a blanquear' }, 400);
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: CONTRASENA_GENERICA,
  });

  if (error) {
    return respond({ error: 'No se pudo blanquear la contraseña' }, 400);
  }

  return respond({ ok: true }, 200);
});
