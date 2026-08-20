import '@testing-library/jest-dom/vitest';

// El cliente de Supabase exige estas env vars al importarse (ver
// lib/supabaseClient.ts). En tests nunca pegamos a la red real —
// cada test que toca un service mockea el módulo entero — pero el
// import igual necesita estos valores presentes para no explotar.
import.meta.env.VITE_SUPABASE_URL ??= 'http://localhost:54321';
import.meta.env.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key';
