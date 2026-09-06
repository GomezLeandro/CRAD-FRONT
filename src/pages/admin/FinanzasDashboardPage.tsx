import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  obtenerResumenFinanciero,
  obtenerSerieMensual,
  obtenerResumenClientes,
  obtenerServicioMasSolicitado,
  type PeriodoFinanzas,
  type ResumenFinancieroConComparativo,
  type ResumenClientes,
  type ServicioRanking,
  type PuntoMensual,
} from '../../services/finanzasService';
import { listarAgendaSemana } from '../../services/turnosService';
import type { Turno } from '../../types/domain';
import { renderFinanceChart, type FinanceChartRefs } from './financeChart';
import styles from './FinanzasDashboardPage.module.css';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function construirDiasAgenda(): { fecha: string; nombre: string; fechaCorta: string; esHoy: boolean }[] {
  const hoy = new Date();
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dias.push({
      fecha: `${y}-${m}-${day}`,
      nombre: DIAS_SEMANA[d.getDay()],
      fechaCorta: `${day}/${m}`,
      esHoy: i === 0,
    });
  }
  return dias;
}

const PERIODOS: { key: PeriodoFinanzas; label: string }[] = [
  { key: 'mes', label: 'Este mes' },
  { key: '3m', label: 'Últimos 3 meses' },
  { key: 'anio', label: 'Año' },
];

function fmtMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function pctDelta(actual: number, previo: number): number | null {
  if (previo === 0) return actual === 0 ? 0 : null;
  return ((actual - previo) / Math.abs(previo)) * 100;
}

interface DeltaChip {
  cls: 'up' | 'down' | 'neutral';
  text: string;
  note: string;
}

function deltaChip(actual: number, anterior: number | null, upIsGood: boolean, periodo: PeriodoFinanzas): DeltaChip {
  if (anterior === null) {
    return {
      cls: 'neutral',
      text: '—',
      note:
        periodo === 'mes'
          ? 'Mes en curso — el comparativo estará disponible al cierre'
          : 'Sin período anterior para comparar',
    };
  }
  const pct = pctDelta(actual, anterior);
  if (pct === null) {
    return { cls: 'neutral', text: '—', note: 'Sin datos del período anterior' };
  }
  const bueno = upIsGood ? pct >= 0 : pct <= 0;
  const signo = pct >= 0 ? '+' : '';
  return {
    cls: bueno ? 'up' : 'down',
    text: `${pct >= 0 ? '▲' : '▼'} ${signo}${pct.toFixed(1).replace('.', ',')}%`,
    note: 'vs. período anterior',
  };
}

export function FinanzasDashboardPage() {
  const { profile } = useAuth();
  const esSuperadmin = profile?.role === 'superadmin';

  const [periodoElegido, setPeriodoElegido] = useState<PeriodoFinanzas>('mes');
  const periodo = esSuperadmin ? periodoElegido : 'mes';

  const [resumen, setResumen] = useState<ResumenFinancieroConComparativo | null>(null);
  const [serie, setSerie] = useState<PuntoMensual[]>([]);
  const [clientes, setClientes] = useState<ResumenClientes | null>(null);
  const [servicios, setServicios] = useState<ServicioRanking[]>([]);
  const [agenda, setAgenda] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verTabla, setVerTabla] = useState(false);
  const [chartTitle, setChartTitle] = useState('');

  const svgWrapRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    listarAgendaSemana().then((r) => {
      if (r.ok) setAgenda(r.data);
    });
  }, []);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError('');

    Promise.all([
      obtenerResumenFinanciero(periodo),
      obtenerSerieMensual(periodo),
      obtenerResumenClientes(periodo),
      obtenerServicioMasSolicitado(periodo),
    ]).then(([r1, r2, r3, r4]) => {
      if (cancelado) return;
      if (!r1.ok) {
        setError(r1.error.message);
        setLoading(false);
        return;
      }
      if (!r2.ok) {
        setError(r2.error.message);
        setLoading(false);
        return;
      }
      if (!r3.ok) {
        setError(r3.error.message);
        setLoading(false);
        return;
      }
      if (!r4.ok) {
        setError(r4.error.message);
        setLoading(false);
        return;
      }
      setResumen(r1.data);
      setSerie(r2.data);
      setClientes(r3.data);
      setServicios(r4.data);
      setLoading(false);
    });

    return () => {
      cancelado = true;
    };
  }, [periodo]);

  useEffect(() => {
    if (loading || serie.length === 0) return;
    if (!svgWrapRef.current || !legendRef.current || !tooltipRef.current || !chartWrapRef.current || !tableRef.current) return;
    const refs: FinanceChartRefs = {
      svgWrap: svgWrapRef.current,
      legend: legendRef.current,
      tooltip: tooltipRef.current,
      chartWrap: chartWrapRef.current,
      table: tableRef.current,
    };
    setVerTabla(false);
    const titulo = renderFinanceChart(refs, serie, periodo);
    setChartTitle(titulo);
  }, [serie, periodo, loading]);

  if (loading) {
    return <p className={styles.empty}>Cargando finanzas…</p>;
  }
  if (error || !resumen || !clientes) {
    return <p className="error">{error || 'No se pudo cargar el dashboard.'}</p>;
  }

  const { actual, anterior } = resumen;
  const maxServicio = servicios.length > 0 ? servicios[0].trabajos : 0;

  const heroDelta = deltaChip(actual.comision, anterior?.comision ?? null, true, periodo);
  const kpis = [
    {
      label: 'Facturación',
      value: fmtMoney(actual.facturacion),
      delta: deltaChip(actual.facturacion, anterior?.facturacion ?? null, true, periodo),
    },
    {
      label: 'Gastos',
      value: fmtMoney(actual.gastos),
      delta: deltaChip(actual.gastos, anterior?.gastos ?? null, false, periodo),
    },
    {
      label: 'Ganancia neta',
      value: fmtMoney(actual.gananciaNeta),
      delta: deltaChip(actual.gananciaNeta, anterior?.gananciaNeta ?? null, true, periodo),
    },
    {
      label: 'Clientes nuevos',
      value: String(clientes.nuevos),
      delta: { cls: 'neutral' as const, text: '—', note: 'en el período seleccionado' },
    },
    {
      label: '% Recurrencia',
      value: `${clientes.recurrenciaPct}%`,
      delta: { cls: 'neutral' as const, text: '—', note: 'de los clientes activos en el período' },
    },
  ];

  return (
    <div>
      <div className={styles.head}>
        <h1 className={styles.title}>Panel principal</h1>
        {!esSuperadmin && <span className={styles.pill}>Mes en curso</span>}
      </div>
      <p className={styles.subtitle}>
        {esSuperadmin
          ? 'Facturación, gastos y comisión societaria de CRAD.'
          : 'Vista del mes en curso. El historial completo lo ve el superadmin.'}
      </p>

      {esSuperadmin && (
        <div className={styles.filters}>
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              className={`${styles.filterBtn} ${periodoElegido === p.key ? styles.filterBtnActive : ''}`}
              onClick={() => setPeriodoElegido(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className={styles.hero}>
        <div>
          <p className={styles.heroLabel}>Tu comisión ({actual.comisionPct}%)</p>
          <p className={styles.heroValue}>{fmtMoney(actual.comision)}</p>
          <p className={styles.heroNote}>Sobre la ganancia neta del período · {fmtMoney(actual.gananciaNeta)}</p>
        </div>
        <div className={styles.heroDelta}>
          <span>{heroDelta.text}</span>
          <span>{heroDelta.note}</span>
        </div>
      </div>

      <div className={styles.kpis}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.card}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiValue}>{k.value}</p>
            <p className={`${styles.delta} ${k.delta.cls === 'up' ? styles.deltaUp : k.delta.cls === 'down' ? styles.deltaDown : ''}`}>
              <span>{k.delta.text}</span>
              <span className={styles.deltaNote}>{k.delta.note}</span>
            </p>
          </div>
        ))}
      </div>

      <div className={styles.agendaCard}>
        <p className={styles.panelTitle}>Turnos de la semana</p>
        <p className={styles.panelSub}>Confirmados de hoy a los próximos 7 días</p>
        <div className={styles.agenda}>
          {construirDiasAgenda().map((dia) => {
            const turnosDelDia = agenda.filter((t) => t.fecha === dia.fecha);
            return (
              <div key={dia.fecha} className={`${styles.agendaDay} ${dia.esHoy ? styles.agendaDayToday : ''}`}>
                <div className={styles.agendaDayHead}>
                  <span className={styles.agendaDayName}>{dia.nombre}</span>
                  <span className={styles.agendaDayDate}>{dia.fechaCorta}</span>
                </div>
                {turnosDelDia.length === 0 ? (
                  <p className={styles.agendaEmpty}>Sin turnos</p>
                ) : (
                  turnosDelDia.map((t) => (
                    <div key={t.id} className={styles.agendaItem}>
                      <span className={styles.agendaTime}>{t.horario}</span>{' '}
                      <p className={styles.agendaRubro}>
                        {t.urgente && <span className={styles.agendaUrgente}>● </span>}
                        {t.rubro}
                      </p>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.bodyGrid}>
        <div className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.chartHead}>
            <div>
              <p className={styles.panelTitle}>{chartTitle}</p>
              <p className={styles.panelSub}>
                {periodo === 'mes' ? 'Del 1 al día de hoy' : periodo === '3m' ? 'Últimos 3 meses' : 'Enero a la fecha'}
              </p>
            </div>
            <button className={styles.tableToggle} onClick={() => setVerTabla((v) => !v)}>
              {verTabla ? 'Ver gráfico' : 'Ver tabla'}
            </button>
          </div>

          <div className={styles.legend} ref={legendRef} />

          <div className={styles.chartWrap} ref={chartWrapRef} style={{ display: verTabla ? 'none' : 'block' }}>
            <div className={styles.chartSvgWrap} ref={svgWrapRef} />
            <div className={styles.tooltip} ref={tooltipRef} />
          </div>

          <div className={styles.tableScroll} style={{ display: verTabla ? 'block' : 'none' }}>
            <table className={styles.chartTable} ref={tableRef} />
          </div>
        </div>

        <div>
          <div className={`${styles.card} ${styles.panelCard}`}>
            <p className={styles.panelTitle}>Clientes</p>
            <p className={styles.panelSub}>
              {clientes.nuevos} nuevos · {clientes.recurrenciaPct}% recurrencia
            </p>
            {clientes.top.length === 0 ? (
              <p className={styles.empty}>Sin turnos en este período.</p>
            ) : (
              clientes.top.map((c) => (
                <div key={c.contacto} className={styles.listRow}>
                  <div>
                    <p className={styles.listName}>{c.contacto}</p>
                    <p className={styles.listSub}>
                      {c.trabajos} {c.trabajos === 1 ? 'trabajo' : 'trabajos'}
                    </p>
                  </div>
                  <span className={`${styles.chip} ${c.esNuevo ? styles.chipNuevo : styles.chipRecurrente}`}>
                    {c.esNuevo ? 'Nuevo' : 'Recurrente'}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className={`${styles.card} ${styles.panelCard}`}>
            <p className={styles.panelTitle}>Servicio más solicitado</p>
            <p className={styles.panelSub}>Por cantidad de turnos en el período</p>
            {servicios.length === 0 ? (
              <p className={styles.empty}>Sin turnos en este período.</p>
            ) : (
              servicios.slice(0, 6).map((s, i) => (
                <div key={s.rubro} className={styles.rankRow}>
                  <span className={styles.rankPos}>{i + 1}</span>
                  <div className={styles.rankBody}>
                    <div className={styles.rankTop}>
                      <span className={styles.rankName}>
                        {s.rubro}
                        {i === 0 && <span className={styles.rankBadge}>Más solicitado</span>}
                      </span>
                      <span className={styles.rankCount}>{s.trabajos}</span>
                    </div>
                    <div className={styles.rankTrack}>
                      <div
                        className={styles.rankFill}
                        style={{ width: maxServicio > 0 ? `${(s.trabajos / maxServicio) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
