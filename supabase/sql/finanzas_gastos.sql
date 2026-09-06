-- Tabla de gastos de la empresa, para calcular la ganancia neta real
-- (facturación - gastos). Solo superadmin puede ver/cargar/editar/borrar,
-- igual que trabajos y servicios.
create table gastos (
  id uuid primary key default gen_random_uuid(),
  concepto text not null check (char_length(concepto) >= 2 and char_length(concepto) <= 300),
  categoria text not null check (char_length(categoria) >= 2 and char_length(categoria) <= 60),
  monto numeric not null check (monto > 0),
  fecha date not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table gastos enable row level security;

create policy gastos_select_superadmin
  on gastos for select
  using (is_superadmin());

create policy gastos_insert_superadmin
  on gastos for insert
  with check (is_superadmin() and created_by = auth.uid());

create policy gastos_update_superadmin
  on gastos for update
  using (is_superadmin())
  with check (is_superadmin());

create policy gastos_delete_superadmin
  on gastos for delete
  using (is_superadmin());

-- Configuración editable del panel (por ahora, solo el % de comisión
-- societaria) para no hardcodear el 25% en el código del frontend.
create table configuracion (
  clave text primary key,
  valor text not null,
  updated_at timestamptz not null default now()
);

alter table configuracion enable row level security;

create policy configuracion_select_superadmin
  on configuracion for select
  using (is_superadmin());

create policy configuracion_insert_superadmin
  on configuracion for insert
  with check (is_superadmin());

create policy configuracion_update_superadmin
  on configuracion for update
  using (is_superadmin())
  with check (is_superadmin());

insert into configuracion (clave, valor) values ('comision_pct', '25');
