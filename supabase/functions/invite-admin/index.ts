// supabase/functions/invite-admin/index.ts
//
// Edge Function — se despliega con `supabase functions deploy invite-admin`
// y corre en el servidor de Supabase, NUNCA en el navegador.
//
// Por qué esto no puede vivir en el frontend: crear un usuario nuevo
// requiere la `service_role key`, que tiene permisos totales y bypassea
// RLS. Si esa key viajara al navegador, cualquiera podría leer el bundle
// de JS y usarla para hacer lo que quiera en la base — el peor escenario
// posible de OWASP A01 (Broken Access Control). Por eso esta función:
//   1. Verifica que quien llama sea un superadmin autenticado (con un
//      cliente que respeta RLS, no con la service_role key).
//   2. Recién ahí usa la service_role key, del lado del servidor.
//
// Invocación desde el panel:
//   await supabase.functions.invoke('invite-admin', { body: { email, nombre, role } })

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
  // El navegador manda un preflight OPTIONS antes del POST real porque
  // supabase.functions.invoke() manda Content-Type: application/json.
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return respond({ error: 'Método no permitido' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return respond({ error: 'No autenticado' }, 401);
  }

  // Cliente "de usuario" — respeta RLS, se usa solo para verificar quién llama.
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
    return respond({ error: 'Solo un superadmin puede crear usuarios' }, 403);
  }

  let body: { email?: string; nombre?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return respond({ error: 'Body inválido' }, 400);
  }

  const nombre = (body.nombre ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const role = body.role === 'superadmin' ? 'superadmin' : 'admin';

  if (nombre.length < 2 || nombre.length > 100) {
    return respond({ error: 'El nombre debe tener entre 2 y 100 caracteres' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond({ error: 'Email inválido' }, 400);
  }

  // Recién acá se usa la service_role key, y solo del lado del servidor.
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { nombre },
    // Sin esto, Supabase arma el link con el "Site URL" configurado en el
    // dashboard (Authentication > URL Configuration) — si ese sigue en
    // localhost (default de desarrollo), el link del mail rompe en
    // producción. Acá lo fijamos explícito a la página real que ya sabe
    // recibir el link de invitación/recuperación.
    redirectTo: 'https://www.grupocrad.com.ar/admin/reset-password',
  });

  if (error || !data.user) {
    const message = error?.message.includes('already been registered')
      ? 'Ese email ya tiene una cuenta'
      : (error?.message ?? 'No se pudo invitar al usuario');
    return respond({ error: message }, 400);
  }

  // El trigger on_auth_user_created ya le asigna role='admin' por defecto;
  // si se pidió 'superadmin', lo actualizamos acá.
  if (role === 'superadmin') {
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role: 'superadmin' })
      .eq('id', data.user.id);
    if (updateError) {
      return respond(
        { error: 'Se invitó al usuario, pero no se pudo asignarle el rol superadmin' },
        500
      );
    }
  }

  return respond({ id: data.user.id, email, nombre, role }, 200);
});
