-- Bucket público de Storage para las fotos del portfolio de Trabajos.
-- La columna imagen_url ya existe en la tabla; solo faltaba dónde subir
-- el archivo (mismo patrón que servicios-iconos).
insert into storage.buckets (id, name, public)
values ('trabajos-fotos', 'trabajos-fotos', true)
on conflict (id) do nothing;

create policy "Lectura pública de fotos de trabajos"
  on storage.objects for select
  using (bucket_id = 'trabajos-fotos');

create policy "Admins suben fotos de trabajos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'trabajos-fotos');

create policy "Admins actualizan fotos de trabajos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'trabajos-fotos');

create policy "Admins borran fotos de trabajos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'trabajos-fotos');
