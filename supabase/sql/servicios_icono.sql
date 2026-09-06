-- 1. Columna nueva para guardar la URL del ícono subido por el admin.
alter table servicios
  add column if not exists icono_url text;

-- 2. Bucket público de Storage donde se suben los archivos de ícono.
--    (el nombre debe coincidir con ICONOS_BUCKET en src/services/serviciosService.ts)
insert into storage.buckets (id, name, public)
values ('servicios-iconos', 'servicios-iconos', true)
on conflict (id) do nothing;

-- 3. Políticas del bucket: cualquiera puede leer (para que el sitio público
--    muestre los íconos); solo usuarios logueados (admins) pueden subir/editar/borrar.
create policy "Lectura pública de íconos de servicios"
  on storage.objects for select
  using (bucket_id = 'servicios-iconos');

create policy "Admins suben íconos de servicios"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'servicios-iconos');

create policy "Admins actualizan íconos de servicios"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'servicios-iconos');

create policy "Admins borran íconos de servicios"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'servicios-iconos');
