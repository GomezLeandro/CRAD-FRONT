-- Perfil de usuario: foto opcional + poder editar el propio nombre/avatar.
-- La contraseña y el email los maneja Supabase Auth directamente (no
-- viven en esta tabla), así que no hace falta tocar nada para eso.

alter table profiles
  add column if not exists avatar_url text;

-- Bucket público de Storage para las fotos de perfil (mismo patrón que
-- servicios-iconos: cualquiera puede leer, solo un usuario logueado sube).
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy "Lectura pública de avatares"
  on storage.objects for select
  using (bucket_id = 'avatares');

create policy "Usuarios suben su avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatares');

create policy "Usuarios actualizan avatares"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatares');

create policy "Usuarios borran avatares"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatares');

-- Hasta ahora SOLO un superadmin podía hacer UPDATE en profiles (ni
-- siquiera sobre su propia fila). Esta política nueva deja que cualquier
-- usuario edite su propia fila (para nombre/avatar_url desde "Mi perfil").
create policy profiles_update_self
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Con profiles_update_self, un admin común ya puede hacer UPDATE sobre su
-- propia fila — y por lo tanto, en teoría, mandar role='superadmin' en ese
-- mismo UPDATE. RLS es a nivel de fila, no de columna, así que la única
-- forma de bloquear ESO puntualmente es con un trigger: si el que edita
-- no es superadmin, cualquier intento de cambiar `role` se revierte en
-- silencio al valor que ya tenía.
create or replace function prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not is_superadmin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on profiles;
create trigger profiles_guard_role
  before update on profiles
  for each row
  execute function prevent_self_role_escalation();
