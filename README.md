# CRAD — Frontend

Vite + React + TypeScript. Sitio público de CRAD Construcciones y
Reparaciones + panel de administración con roles `admin` / `superadmin`.

Este repo es **solo el frontend** — se despliega como sitio estático
(Netlify, Vercel, Cloudflare Pages, etc). El proyecto de Supabase (schema,
políticas de RLS, Edge Functions) vive en el repo separado
[`crad-backend`](../crad-backend) — hay que tenerlo aplicado sobre un
proyecto de Supabase antes de que esta app funcione de verdad.

## Arquitectura en una frase

**Los componentes nunca hablan con la base directamente.** Todo pasa por
`src/services/*`, que son los únicos archivos que importan
`src/lib/supabaseClient.ts`. El control de acceso real vive en Postgres
(Row Level Security, en el repo `crad-backend`) — ver `SECURITY.md` acá
para el detalle completo de las mitigaciones de este lado.

```
src/
  types/domain.ts       Tipos de dominio (camelCase) — lo único que
                         importan componentes y services entre sí
  lib/
    supabaseClient.ts    único punto que instancia el SDK de Supabase
    validation.ts        schemas de Zod (defensa en profundidad)
  services/               capa de acceso a datos (mapea snake_case → domain)
  hooks/useAuth.ts        sesión + rol del usuario admin
  components/
    layout/               Nav, Footer, WhatsApp flotante, banner urgencias
    home/                 secciones del sitio público
    booking/               modal de reserva de turno
    admin/                 AdminLayout, ProtectedRoute
    ui/                    Modal genérico
  pages/
    HomePage.tsx
    admin/                 Login, Dashboard, Turnos, Mensajes, Facturas,
                           y las 3 pantallas exclusivas de superadmin
```

## 1. Backend primero

Antes de arrancar acá, seguí el README de
[`crad-backend`](../crad-backend) — necesitás un proyecto de Supabase con
las migraciones y políticas ya aplicadas, y al menos un usuario
`superadmin` creado.

## 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de
**Settings → API** del proyecto de Supabase (repo `crad-backend`). La
`anon key` es pública por diseño — ver el comentario en `.env.example` si
tenés dudas.

## 3. Instalar y correr

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev              # servidor de desarrollo
npm run build             # typecheck + build de producción
npm run test              # suite de tests (vitest)
npm run test:watch        # tests en modo watch
npm run test:coverage     # tests con reporte de cobertura
npm run lint               # lint general (oxlint)
npm run lint:security      # lint de seguridad (eslint-plugin-security)
```

## Testing

Cobertura actual: capa de `services` (incluyendo el caso crítico de
horario duplicado — aunque esa constraint vive en el repo `crad-backend`,
el service que la consume se testea acá), `validation.ts`, y los
componentes con lógica no trivial (`BookingModal`, `Servicios`,
`ProtectedRoute`, `TurnosPage`). Todos los tests mockean el `service`
correspondiente — ninguno pega contra una base real ni contra el repo
backend.

```bash
npm run test
```

## Despliegue

El build (`npm run build`) genera un sitio estático en `dist/` — se puede
desplegar en Netlify, Vercel, Cloudflare Pages o cualquier hosting
estático. Los headers de seguridad ya están armados para Netlify
(`public/_headers`) y Vercel (`vercel.json`); para otro hosting, trasladar
esos mismos headers a su mecanismo equivalente (ver `SECURITY.md`,
sección A05).

No te olvides de configurar `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
como variables de entorno en el panel del hosting elegido — `.env.local`
no viaja al build de producción salvo que lo declares ahí.

## Seguridad

Ver `SECURITY.md` para el mapeo completo contra el OWASP Top 10 y las
decisiones de diseño detrás de cada mitigación.
