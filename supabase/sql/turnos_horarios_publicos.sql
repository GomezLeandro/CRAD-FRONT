-- El formulario público de reserva necesita saber qué horarios ya están
-- tomados para una fecha, para pintarlos y no dejarlos elegir. Pero la
-- tabla turnos tiene SELECT admin-only por RLS (no queremos exponer
-- problema/dirección/contacto de otros clientes a cualquier visitante).
--
-- Esta función expone SOLO la lista de horarios ocupados de una fecha,
-- sin ningún otro dato del turno. SECURITY DEFINER para saltar el RLS
-- de turnos únicamente dentro de esta consulta acotada.

create or replace function public.horarios_ocupados(p_fecha date)
returns setof text
language sql
security definer
set search_path = public
stable
as $$
  select horario
  from turnos
  where fecha = p_fecha
    and estado <> 'rechazado';
$$;

grant execute on function public.horarios_ocupados(date) to anon, authenticated;
