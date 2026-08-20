import { createClient } from '@supabase/supabase-js';

/**
 * Único lugar del proyecto que instancia el cliente de Supabase.
 *
 * IMPORTANTE (seguridad):
 * - `VITE_SUPABASE_ANON_KEY` es la clave pública ("anon"), diseñada para
 *   vivir en el frontend. NO es un secreto — el control de acceso real
 *   lo hace Postgres vía Row Level Security (ver /supabase/policies.sql).
 * - La `service_role key` (con permisos totales, bypassea RLS) NUNCA debe
 *   usarse acá ni en ningún código que corra en el navegador.
 * - Nada fuera de /src/services debería importar este archivo.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Copiá .env.example a .env.local y completá los valores de tu proyecto Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistimos la sesión solo para el panel admin. El sitio público
    // no requiere sesión para nada.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
