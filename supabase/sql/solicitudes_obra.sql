-- Bandeja de "Contanos tu proyecto" (sección Obra del sitio público).
-- Mismo patrón que mensajes/turnos: INSERT público, SELECT/UPDATE
-- admin-only vía RLS. Se separa de "mensajes" porque tiene campos
-- propios (tipo de proyecto, superficie, zona) y soporta un adjunto
-- (planos/referencias) que mensajes no contempla.

create table if not exists solicitudes_obra (
  id uuid primary key default gen_random_uuid(),
  tipo_proyecto text not null,
  superficie numeric,
  zona text not null,
  descripcion text not null,
  archivo_url text,
  nombre text not null,
  contacto text not null,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

alter table solicitudes_obra enable row level security;

drop policy if exists solicitudes_obra_insert_publico on solicitudes_obra;
create policy solicitudes_obra_insert_publico
  on solicitudes_obra for insert
  with check (leido = false);

drop policy if exists solicitudes_obra_select_admin on solicitudes_obra;
create policy solicitudes_obra_select_admin
  on solicitudes_obra for select
  using (is_admin());

drop policy if exists solicitudes_obra_update_admin on solicitudes_obra;
create policy solicitudes_obra_update_admin
  on solicitudes_obra for update
  using (is_admin())
  with check (is_admin());

-- ---- storage: adjuntos (planos/referencias) ----
-- Público porque lo sube quien completa el formulario, sin sesión.
-- Bucket público para que el admin pueda abrir el archivo con la URL
-- guardada en archivo_url sin necesitar URLs firmadas.

insert into storage.buckets (id, name, public)
values ('obra-adjuntos', 'obra-adjuntos', true)
on conflict (id) do nothing;

drop policy if exists "Público sube adjuntos de obra" on storage.objects;
create policy "Público sube adjuntos de obra"
  on storage.objects for insert
  to public
  with check (bucket_id = 'obra-adjuntos');

drop policy if exists "Lectura pública de adjuntos de obra" on storage.objects;
create policy "Lectura pública de adjuntos de obra"
  on storage.objects for select
  to public
  using (bucket_id = 'obra-adjuntos');
