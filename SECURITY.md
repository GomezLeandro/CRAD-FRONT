# Seguridad — CRAD App

Mapeo del [OWASP Top 10 (2021)](https://owasp.org/Top10/) contra las mitigaciones
concretas de este proyecto. La regla general: **el frontend nunca es la barrera
de seguridad real** — todo lo que importa está enforced en Postgres (RLS,
constraints, triggers). React solo da una buena experiencia de uso alrededor.

## A01:2021 — Broken Access Control

- Row Level Security activado en **todas** las tablas (`supabase/policies.sql`),
  con "deny by default": si no hay una policy explícita, la operación se
  rechaza sin importar qué haga el JS del navegador.
- Roles (`admin` / `superadmin`) viven en la tabla `profiles`, verificados por
  las funciones `is_admin()` / `is_superadmin()` (SECURITY DEFINER, así evitan
  el problema de referencia circular al leer su propio rol).
- **Nadie puede auto-promoverse**: sí existe `profiles_update_self` (cada
  usuario puede editar su propia fila, para nombre/avatar), pero un trigger
  dedicado (`profiles_guard_role`) revierte cualquier cambio a la columna
  `role` que no venga de un superadmin — verificado en vivo.
- **El alta de un usuario nuevo no le da ningún permiso por defecto**: el
  trigger `handle_new_user` crea el perfil con `role='sin_acceso'` (no
  matchea ni `is_admin()` ni `is_superadmin()`). El rol real (`admin` /
  `superadmin`) lo asigna siempre, de forma explícita, la Edge Function
  `invite-admin` después de crear el usuario — nunca depende de un default.
  Esto es defensa en profundidad: hoy el registro público está deshabilitado
  en Supabase Auth (verificado en vivo), pero si ese interruptor externo se
  reactivara alguna vez por error, un self-signup ya no quedaría con acceso
  automático al panel.
- `ProtectedRoute` (frontend) es solo UX — oculta pantallas que el usuario no
  podría usar igual porque la base se lo va a rechazar.
- Crear usuarios nuevos requiere la `service_role key`, que **nunca** está en
  el frontend — vive solo en la Edge Function `supabase/functions/invite-admin`,
  que además valida que quien invoca sea superadmin antes de usarla.
- **Storage a la par de las tablas, no solo las tablas**: las policies de
  `storage.objects` para fotos de trabajos e íconos de servicios exigen
  `is_superadmin()` (antes solo exigían estar logueado, un admin común podía
  tocar el archivo aunque no pudiera tocar la fila). Las de `avatares` exigen
  además que la carpeta del archivo (`<user_id>/...`) coincida con
  `auth.uid()`, para que nadie pise el avatar de otro. Ver
  `supabase/sql/pentest_fixes_2026-09.sql`.

## A02:2021 — Cryptographic Failures

- No se maneja ningún dato de tarjeta/pago en esta app.
- TLS gestionado por Supabase/el hosting — no hay servidores propios que
  configurar.
- `VITE_SUPABASE_ANON_KEY` es pública por diseño (queda en el bundle de JS);
  documentado explícitamente en `.env.example` para que nadie la confunda con
  un secreto real.

## A03:2021 — Injection

- El cliente de Supabase parametriza todas las queries — no hay concatenación
  de strings SQL en ningún lado del proyecto.
- Todo input de usuario pasa por un schema de Zod (`src/lib/validation.ts`)
  antes de llegar a un `service`.
- Constraints `CHECK` en Postgres como segunda barrera (longitud de campos,
  formato de estado, monto positivo, etc.) — no dependen de que el cliente
  se comporte bien.

## A04:2021 — Insecure Design

- **Doble reserva de turno**: resuelto con un índice único parcial en
  `(fecha, horario)` — no es una validación de aplicación que se pueda
  saltear con una race condition, es una garantía de la base.
- **Anti-bot**: honeypot (`website`) en los formularios públicos de turno,
  contacto y obra — invisible para una persona, casi siempre completado por
  bots de autocompletado. Límite conocido: el honeypot solo frena bots que
  completan el formulario real; un ataque scripteado que le pegue directo a
  la API de Supabase lo saltea. No hay CAPTCHA ni rate-limit por IP todavía
  — pendiente si se vuelve un problema real de spam.
- **Buckets públicos con subida sin sesión** (`obra-adjuntos`) tienen
  `file_size_limit` (8 MB) y `allowed_mime_types` (solo imagen/PDF) puestos
  en el propio bucket de Supabase, no solo validados en el formulario — un
  script que le pegue directo a la Storage API no puede saltearse el límite
  ni subir HTML/SVG con script.
- Mensajes de error de login deliberadamente genéricos ("Email o contraseña
  incorrectos") para no filtrar si un email existe (user enumeration).

## A05:2021 — Security Misconfiguration

- `vercel.json` (el hosting real es Vercel) con CSP, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy` — verificado que
  se sirven de verdad contra el sitio en producción, no solo que el archivo
  existe.
- Nota sobre la CSP: `style-src` incluye `'unsafe-inline'` porque algunos
  componentes usan estilos inline para valores dinámicos (ej. la altura de
  las barras del gráfico de facturación). `script-src` es estricto
  (`'self'`, sin inline ni eval) — el vector de XSS más peligroso queda
  cerrado. Si se quiere endurecer `style-src` más adelante, la solución es
  mover esos estilos dinámicos a variables CSS con `style={{ '--h': ... }}`
  + CSS estático, o generar un nonce por request (requiere SSR).
- `.env.example` sin secretos reales; `.env` y `.env.local` en `.gitignore`.
- Dependencias auditadas (`npm audit`) — ver nota sobre `react-router` abajo.

## A06:2021 — Vulnerable and Outdated Components

- `npm audit` corre limpio salvo una advisory de `react-router`
  (RSC Mode CSRF Bypass, GHSA-qwww-vcr4-c8h2) que **solo aplica al modo RSC /
  Server Actions**. Esta app es una SPA pura sin SSR ni RSC — no usamos
  `unstable_serverComponents`, `<Form>` con actions de servidor, ni ningún
  loader que corra en un runtime de servidor. Se evaluaron versiones
  anteriores (7.11.0 y previas) y tienen advisories propias, algunas más
  numerosas — la versión actual es la opción con menor superficie de riesgo
  real para este caso de uso. Se recomienda re-evaluar en cada actualización.

## A07:2021 — Identification and Authentication Failures

- Autenticación delegada 100% a Supabase Auth: hashing de contraseñas,
  rate-limiting de intentos, emisión/rotación de JWT.
- Passwords: mínimo 8 caracteres validado en cliente (`loginSchema`); la
  política real de complejidad se configura en el dashboard de Supabase.
- Sesión vía `@supabase/supabase-js` (token en `localStorage`, no
  `httpOnly` — limitación conocida de un SDK 100% cliente). Mitigación:
  expiración de token corta configurada en Supabase + `autoRefreshToken`.
  Si se necesita protección extra contra XSS-roba-token, la alternativa es
  mover el login a un backend propio con cookies `httpOnly` — fuera del
  alcance de esta primera versión.

## A08:2021 — Software and Data Integrity Failures

- `package-lock.json` commiteado — builds reproducibles.
- No hay actualización de dependencias ni ejecución de código sin revisión
  (no eval, no `new Function`, chequeado por `eslint-plugin-security`).

## A09:2021 — Security Logging and Monitoring Failures

- Fuera del alcance de esta versión: se recomienda conectar un servicio
  externo (ej. Sentry) para logging de errores de frontend, y revisar los
  logs de Postgres/Auth desde el dashboard de Supabase para intentos de
  login fallidos.

## A10:2021 — Server-Side Request Forgery (SSRF)

- No aplica: la app no hace fetch a URLs provistas por el usuario desde
  ningún contexto de servidor.

---

## Checklist de dependencias

```bash
npm audit          # vulnerabilidades conocidas
npm run lint:security   # eslint-plugin-security sobre src/
npm run test        # suite de tests (incluye validación de inputs)
```

## Reportar un problema de seguridad

Si encontrás una vulnerabilidad, no abras un issue público — contactá
directamente al equipo de desarrollo.
