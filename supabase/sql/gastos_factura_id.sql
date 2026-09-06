-- Permite discriminar el costo de materiales directamente al cargar una
-- factura: ese monto se guarda como un gasto normal (categoría "Materiales")
-- pero queda vinculado a la factura que lo originó, para poder mostrarlo
-- desglosado en la factura sin duplicar el número a mano.
alter table gastos
  add column if not exists factura_id uuid references facturas(id) on delete set null;

create index if not exists gastos_factura_id_idx on gastos (factura_id);
