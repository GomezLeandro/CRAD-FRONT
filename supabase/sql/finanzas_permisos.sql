-- Restringe la vista financiera del rol "admin" (no superadmin) al mes en
-- curso, en la base de datos (no solo en la interfaz). El superadmin sigue
-- viendo todo el historial. Se usa la zona horaria de Argentina para que el
-- corte de mes sea el real del negocio, no el UTC del servidor.

-- ---- facturas ----

drop policy if exists facturas_select_admin on facturas;
create policy facturas_select_admin
  on facturas for select
  using (
    is_superadmin()
    or (
      is_admin()
      and fecha_emision >= date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires'))::date
      and fecha_emision < (date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires')) + interval '1 month')::date
    )
  );

drop policy if exists facturas_update_admin on facturas;
create policy facturas_update_admin
  on facturas for update
  using (
    is_superadmin()
    or (
      is_admin()
      and fecha_emision >= date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires'))::date
      and fecha_emision < (date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires')) + interval '1 month')::date
    )
  )
  with check (is_admin());

-- ---- gastos ----
-- (reemplaza las políticas superadmin-only creadas en finanzas_gastos.sql:
-- ahora cualquier admin puede cargar/ver/editar gastos, pero solo del mes
-- en curso si no es superadmin; borrar sigue siendo solo superadmin)

drop policy if exists gastos_select_superadmin on gastos;
create policy gastos_select_admin
  on gastos for select
  using (
    is_superadmin()
    or (
      is_admin()
      and fecha >= date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires'))::date
      and fecha < (date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires')) + interval '1 month')::date
    )
  );

drop policy if exists gastos_insert_superadmin on gastos;
create policy gastos_insert_admin
  on gastos for insert
  with check (is_admin() and created_by = auth.uid());

drop policy if exists gastos_update_superadmin on gastos;
create policy gastos_update_admin
  on gastos for update
  using (
    is_superadmin()
    or (
      is_admin()
      and fecha >= date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires'))::date
      and fecha < (date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires')) + interval '1 month')::date
    )
  )
  with check (is_admin());

-- gastos_delete_superadmin ya existe y sigue igual (solo superadmin borra).

-- ---- configuracion ----
-- el % de comisión lo puede LEER cualquier admin (lo necesita el dashboard
-- para calcular "tu comisión" del mes), pero solo superadmin lo cambia.

drop policy if exists configuracion_select_superadmin on configuracion;
create policy configuracion_select_admin
  on configuracion for select
  using (is_admin());
