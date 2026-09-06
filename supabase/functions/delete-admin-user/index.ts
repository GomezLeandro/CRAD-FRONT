// supabase/functions/delete-admin-user/index.ts
//
// Edge Function — corre en el servidor de Supabase, nunca en el navegador.
// Borra un usuario del panel (auth.users). El trigger de FK en `profiles`
// tiene ON DELETE CASCADE, así que su fila de perfil se borra sola.
// Igual que invite-admin y reset-password-admin, requiere la service_role
// key (auth.admin.deleteUser), por eso no puede vivir en el cliente.
//
// Invocación desde el panel:
//   await supabase.functions.invoke('delete-admin-user', { body: { userId } })

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    return respond({ error: 'Solo un superadmin puede borrar usuarios' }, 403);
  }

  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return respond({ error: 'Body inválido' }, 400);
  }

  const userId = (body.userId ?? '').trim();
  if (!userId) {
    return respond({ error: 'Falta el usuario a borrar' }, 400);
  }
  if (userId === user.id) {
    return respond({ error: 'No podés borrar tu propia cuenta' }, 400);
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    return respond({ error: 'No se pudo borrar el usuario' }, 400);
  }

  return respond({ ok: true }, 200);
});
