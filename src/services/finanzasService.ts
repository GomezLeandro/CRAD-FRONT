import { supabase } from '../lib/supabaseClient';
import { obtenerComisionPct } from './configuracionService';
import type { ServiceResult } from '../types/domain';

/**
 * Agregados para el dashboard de Finanzas. El agregado se hace en el
 * cliente sobre filas ya acotadas por rango de fecha en la consulta y por
 * RLS (un admin común solo ve facturas/gastos del mes en curso) — mismo
 * criterio que ya usa `obtenerIngresosPorMes` en facturasService. Para un
 * volumen alto convendría mover esto a una vista de Postgres.
 */

export type PeriodoFinanzas = 'mes' | '3m' | 'anio';

export interface ResumenFinanciero {
  facturacion: number;
  gastos: number;
  gananciaNeta: number;
  comision: number;
  comisionPct: number;
}

export interface ClienteResumen {
  contacto: string;
  trabajos: number;
  primeraFecha: string;
  esNuevo: boolean;
}

export interface ResumenClientes {
  nuevos: number;
  recurrenciaPct: number;
  top: ClienteResumen[];
}

export interface ServicioRanking {
  rubro: string;
  trabajos: number;
}

export interface PuntoMensual {
  mes: string; // 'YYYY-MM'
  facturacion: number;
  gastos: number;
  gananciaNeta: number;
  comision: number;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizarContacto(contacto: string): string {
  return contacto.trim().toLowerCase().replace(/\s+/g, '');
}

/** Rango [desde, hasta] del período seleccionado, hasta hoy. */
export function rangoPeriodo(periodo: PeriodoFinanzas, hoy = new Date()): { desde: Date; hasta: Date } {
  if (periodo === 'mes') {
    return { desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1), hasta: hoy };
  }
  if (periodo === '3m') {
    return { desde: new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1), hasta: hoy };
  }
  return { desde: new Date(hoy.getFullYear(), 0, 1), hasta: hoy };
}

/** Rango equivalente inmediatamente anterior, para calcular la variación. */
function rangoComparativo(periodo: PeriodoFinanzas, hoy = new Date()): { desde: Date; hasta: Date } {
  if (periodo === 'mes') {
    return {
      desde: new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1),
      hasta: new Date(hoy.getFullYear(), hoy.getMonth(), 0),
    };
  }
  if (periodo === '3m') {
    return {
      desde: new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1),
      hasta: new Date(hoy.getFullYear(), hoy.getMonth() - 2, 0),
    };
  }
  return {
    desde: new Date(hoy.getFullYear() - 1, 0, 1),
    hasta: new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate()),
  };
}

async function sumarFacturasYGastos(
  desde: Date,
  hasta: Date
): Promise<ServiceResult<{ facturacion: number; gastos: number }>> {
  const [facturasRes, gastosRes] = await Promise.all([
    supabase
      .from('facturas')
      .select('monto')
      .gte('fecha_emision', toISODate(desde))
      .lte('fecha_emision', toISODate(hasta))
      .returns<{ monto: number }[]>(),
    supabase
      .from('gastos')
      .select('monto')
      .gte('fecha', toISODate(desde))
      .lte('fecha', toISODate(hasta))
      .returns<{ monto: number }[]>(),
  ]);

  if (facturasRes.error) {
    return { ok: false, error: { code: 'UNKNOWN', message: facturasRes.error.message } };
  }
  if (gastosRes.error) {
    return { ok: false, error: { code: 'UNKNOWN', message: gastosRes.error.message } };
  }

  return {
    ok: true,
    data: {
      facturacion: facturasRes.data.reduce((acc, f) => acc + Number(f.monto), 0),
      gastos: gastosRes.data.reduce((acc, g) => acc + Number(g.monto), 0),
    },
  };
}

export interface ResumenFinancieroConComparativo {
  actual: ResumenFinanciero;
  anterior: ResumenFinanciero | null;
}

export async function obtenerResumenFinanciero(
  periodo: PeriodoFinanzas
): Promise<ServiceResult<ResumenFinancieroConComparativo>> {
  const comisionRes = await obtenerComisionPct();
  if (!comisionRes.ok) return comisionRes;
  const comisionPct = comisionRes.data;

  const { desde, hasta } = rangoPeriodo(periodo);
  const actualRes = await sumarFacturasYGastos(desde, hasta);
  if (!actualRes.ok) return actualRes;

  const gananciaActual = actualRes.data.facturacion - actualRes.data.gastos;
  const actual: ResumenFinanciero = {
    facturacion: actualRes.data.facturacion,
    gastos: actualRes.data.gastos,
    gananciaNeta: gananciaActual,
    comision: gananciaActual * (comisionPct / 100),
    comisionPct,
  };

  // "Este mes" a mitad de mes no tiene un comparativo justo (mes cerrado
  // completo vs. unos pocos días) — se omite en vez de mostrar una
  // variación falsa, mismo criterio que se usó en el mockup aprobado.
  if (periodo === 'mes') {
    return { ok: true, data: { actual, anterior: null } };
  }

  const cmp = rangoComparativo(periodo);
  const anteriorRes = await sumarFacturasYGastos(cmp.desde, cmp.hasta);
  if (!anteriorRes.ok) return anteriorRes;

  const gananciaAnterior = anteriorRes.data.facturacion - anteriorRes.data.gastos;
  const anterior: ResumenFinanciero = {
    facturacion: anteriorRes.data.facturacion,
    gastos: anteriorRes.data.gastos,
    gananciaNeta: gananciaAnterior,
    comision: gananciaAnterior * (comisionPct / 100),
    comisionPct,
  };

  return { ok: true, data: { actual, anterior } };
}

/** Serie mensual (para el gráfico), un punto por cada mes calendario del período. */
export async function obtenerSerieMensual(
  periodo: PeriodoFinanzas
): Promise<ServiceResult<PuntoMensual[]>> {
  const comisionRes = await obtenerComisionPct();
  if (!comisionRes.ok) return comisionRes;
  const comisionPct = comisionRes.data;

  const { desde, hasta } = rangoPeriodo(periodo);

  const [facturasRes, gastosRes] = await Promise.all([
    supabase
      .from('facturas')
      .select('monto, fecha_emision')
      .gte('fecha_emision', toISODate(desde))
      .lte('fecha_emision', toISODate(hasta))
      .returns<{ monto: number; fecha_emision: string }[]>(),
    supabase
      .from('gastos')
      .select('monto, fecha')
      .gte('fecha', toISODate(desde))
      .lte('fecha', toISODate(hasta))
      .returns<{ monto: number; fecha: string }[]>(),
  ]);

  if (facturasRes.error) {
    return { ok: false, error: { code: 'UNKNOWN', message: facturasRes.error.message } };
  }
  if (gastosRes.error) {
    return { ok: false, error: { code: 'UNKNOWN', message: gastosRes.error.message } };
  }

  const porMes = new Map<string, { facturacion: number; gastos: number }>();
  const asegurarMes = (mes: string) => {
    if (!porMes.has(mes)) porMes.set(mes, { facturacion: 0, gastos: 0 });
    return porMes.get(mes)!;
  };

  // Aseguramos que todos los meses del rango aparezcan aunque no tengan
  // movimientos, para que el gráfico no salte fechas.
  const cursor = new Date(desde.getFullYear(), desde.getMonth(), 1);
  while (cursor <= hasta) {
    asegurarMes(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const f of facturasRes.data) {
    asegurarMes(f.fecha_emision.slice(0, 7)).facturacion += Number(f.monto);
  }
  for (const g of gastosRes.data) {
    asegurarMes(g.fecha.slice(0, 7)).gastos += Number(g.monto);
  }

  const serie = Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, { facturacion, gastos }]) => {
      const gananciaNeta = facturacion - gastos;
      return { mes, facturacion, gastos, gananciaNeta, comision: gananciaNeta * (comisionPct / 100) };
    });

  return { ok: true, data: serie };
}

/** Clientes nuevos vs. recurrentes del período, según el contacto cargado en cada turno. */
export async function obtenerResumenClientes(
  periodo: PeriodoFinanzas
): Promise<ServiceResult<ResumenClientes>> {
  const { desde, hasta } = rangoPeriodo(periodo);

  // Se trae todo el historial (no solo el período) porque para saber si un
  // contacto es "nuevo" hay que conocer la fecha de su primer turno, sea
  // cual sea. Turnos no está acotado por mes en RLS (ver finanzas_permisos.sql).
  const { data, error } = await supabase
    .from('turnos')
    .select('contacto, fecha')
    .order('fecha', { ascending: true })
    .returns<{ contacto: string; fecha: string }[]>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }

  const desdeIso = toISODate(desde);
  const hastaIso = toISODate(hasta);

  interface Agregado {
    contactoOriginal: string;
    primeraFecha: string;
    trabajos: number;
    activoEnPeriodo: boolean;
  }
  const porContacto = new Map<string, Agregado>();

  for (const t of data) {
    const clave = normalizarContacto(t.contacto);
    if (!clave) continue;
    const existente = porContacto.get(clave);
    const enPeriodo = t.fecha >= desdeIso && t.fecha <= hastaIso;
    if (existente) {
      existente.trabajos += 1;
      if (enPeriodo) existente.activoEnPeriodo = true;
    } else {
      porContacto.set(clave, {
        contactoOriginal: t.contacto,
        primeraFecha: t.fecha,
        trabajos: 1,
        activoEnPeriodo: enPeriodo,
      });
    }
  }

  const activosEnPeriodo = Array.from(porContacto.values()).filter((c) => c.activoEnPeriodo);
  const nuevos = activosEnPeriodo.filter((c) => c.primeraFecha >= desdeIso).length;
  const recurrentes = activosEnPeriodo.length - nuevos;
  const recurrenciaPct =
    activosEnPeriodo.length > 0 ? Math.round((recurrentes / activosEnPeriodo.length) * 100) : 0;

  const top = activosEnPeriodo
    .sort((a, b) => b.primeraFecha.localeCompare(a.primeraFecha))
    .slice(0, 6)
    .map((c) => ({
      contacto: c.contactoOriginal,
      trabajos: c.trabajos,
      primeraFecha: c.primeraFecha,
      esNuevo: c.primeraFecha >= desdeIso,
    }));

  return { ok: true, data: { nuevos, recurrenciaPct, top } };
}

/** Ranking de rubros por cantidad de turnos en el período. */
export async function obtenerServicioMasSolicitado(
  periodo: PeriodoFinanzas
): Promise<ServiceResult<ServicioRanking[]>> {
  const { desde, hasta } = rangoPeriodo(periodo);

  const { data, error } = await supabase
    .from('turnos')
    .select('rubro')
    .gte('fecha', toISODate(desde))
    .lte('fecha', toISODate(hasta))
    .returns<{ rubro: string }[]>();

  if (error) {
    return { ok: false, error: { code: 'UNKNOWN', message: error.message } };
  }

  const conteo = new Map<string, number>();
  for (const t of data) {
    conteo.set(t.rubro, (conteo.get(t.rubro) ?? 0) + 1);
  }

  const ranking = Array.from(conteo.entries())
    .map(([rubro, trabajos]) => ({ rubro, trabajos }))
    .sort((a, b) => b.trabajos - a.trabajos);

  return { ok: true, data: ranking };
}
