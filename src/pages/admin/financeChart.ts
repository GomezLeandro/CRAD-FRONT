import type { PuntoMensual, PeriodoFinanzas } from '../../services/finanzasService';

/**
 * Dibuja el gráfico de Finanzas a mano con SVG (sin librería de gráficos).
 * Mismo mock que ya aprobó el usuario: donut para un solo mes, barras para
 * un rango corto, línea con semáforo por tramo para el año completo.
 * Queda en un módulo aparte porque es DOM imperativo (construye el SVG a
 * partir de refs), no JSX declarativo — mezclarlo en el componente lo
 * haría ilegible.
 */

export interface FinanceChartRefs {
  svgWrap: HTMLDivElement;
  legend: HTMLDivElement;
  tooltip: HTMLDivElement;
  chartWrap: HTMLDivElement;
  table: HTMLTableElement;
}

const MESES_LABEL = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const svgns = 'http://www.w3.org/2000/svg';

function el(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(svgns, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
}

function fmtMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function fmtMoneyCompact(n: number): string {
  if (n >= 1_000_000) {
    const millones = n / 1_000_000;
    return '$' + millones.toFixed(n % 1_000_000 === 0 ? 0 : 1).replace('.', ',') + 'M';
  }
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return fmtMoney(n);
}

function esMesActual(mes: string): boolean {
  const hoy = new Date();
  const actual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  return mes === actual;
}

function labelCorto(mes: string): string {
  const [, m] = mes.split('-').map(Number);
  return MESES_LABEL[m - 1] + (esMesActual(mes) ? '*' : '');
}

function labelLargo(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  return `${MESES_LABEL[m - 1]} ${y}` + (esMesActual(mes) ? ' (parcial)' : '');
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
  const n = v / pow;
  const step = n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10;
  return step * pow;
}

interface Trend {
  cls: 'good' | 'warn' | 'bad' | 'neutral';
  pct: number | null;
}

function trend(rows: PuntoMensual[], i: number): Trend {
  if (i === 0) return { cls: 'neutral', pct: null };
  const prev = rows[i - 1];
  const cur = rows[i];
  if (prev.gananciaNeta === 0) return { cls: 'neutral', pct: null };
  const pct = ((cur.gananciaNeta - prev.gananciaNeta) / Math.abs(prev.gananciaNeta)) * 100;
  if (pct >= 3) return { cls: 'good', pct };
  if (pct <= -3) return { cls: 'bad', pct };
  return { cls: 'warn', pct };
}

function trendArrow(pct: number | null): string {
  if (pct === null) return '—';
  if (pct >= 3) return '▲';
  if (pct <= -3) return '▼';
  return '▬';
}

function trendColorVar(cls: Trend['cls']): string {
  return cls === 'good' ? 'var(--good)' : cls === 'warn' ? 'var(--warn)' : cls === 'bad' ? 'var(--critical)' : 'var(--steel)';
}

function variacionTexto(t: Trend): string {
  if (t.pct === null) return '—';
  const signo = t.pct >= 0 ? '+' : '';
  return `${trendArrow(t.pct)} ${signo}${t.pct.toFixed(1).replace('.', ',')}%`;
}

function renderTrendLegend(legendEl: HTMLDivElement, hasNeutral: boolean) {
  legendEl.innerHTML =
    '<span style="display:flex;align-items:center;gap:6px;font-size:12px;"><span style="width:12px;height:10px;display:inline-block;background:var(--good);"></span><span style="font-size:11px;font-weight:700;">▲</span> Mejora vs. mes anterior</span>' +
    '<span style="display:flex;align-items:center;gap:6px;font-size:12px;"><span style="width:12px;height:10px;display:inline-block;background:var(--warn);"></span><span style="font-size:11px;font-weight:700;">▬</span> Estable</span>' +
    '<span style="display:flex;align-items:center;gap:6px;font-size:12px;"><span style="width:12px;height:10px;display:inline-block;background:var(--critical);"></span><span style="font-size:11px;font-weight:700;">▼</span> Baja</span>' +
    (hasNeutral
      ? '<span style="display:flex;align-items:center;gap:6px;font-size:12px;"><span style="width:12px;height:10px;display:inline-block;background:var(--steel);"></span> Sin mes anterior para comparar</span>'
      : '');
}

function renderTrendTable(table: HTMLTableElement, rows: PuntoMensual[]) {
  const body = rows
    .map((r, i) => {
      const t = trend(rows, i);
      return `<tr><td>${labelLargo(r.mes)}</td><td>${fmtMoney(r.gananciaNeta)}</td><td>${variacionTexto(t)}</td></tr>`;
    })
    .join('');
  table.innerHTML =
    '<thead><tr><th>Mes</th><th>Ganancia neta</th><th>Variación</th></tr></thead>' +
    `<tbody>${body}</tbody>`;
}

function renderBars(refs: FinanceChartRefs, rows: PuntoMensual[]) {
  const W = 640;
  const H = 300;
  const PAD = { top: 26, right: 14, bottom: 34, left: 46 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  refs.svgWrap.innerHTML = '<svg role="img" aria-label="Ganancia neta por mes"></svg>';
  const svg = refs.svgWrap.querySelector('svg')!;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const maxVal = niceMax(Math.max(...rows.map((r) => r.gananciaNeta)) * 1.25);
  const steps = 4;
  const slotW = plotW / rows.length;
  const barW = Math.min(28, slotW * 0.5);
  const xFor = (i: number) => PAD.left + slotW * i + slotW / 2;
  const yFor = (v: number) => PAD.top + plotH - (v / maxVal) * plotH;
  const baseline = PAD.top + plotH;

  for (let s = 0; s <= steps; s++) {
    const v = (maxVal / steps) * s;
    const y = yFor(v);
    svg.appendChild(el('line', { x1: PAD.left, x2: W - PAD.right, y1: y, y2: y, stroke: 'var(--line)', 'stroke-width': 1 }));
    const t = el('text', { x: PAD.left - 8, y: y + 3, 'text-anchor': 'end', fill: 'var(--steel)', 'font-size': 10 });
    t.textContent = fmtMoneyCompact(v);
    svg.appendChild(t);
  }

  let hasNeutral = false;

  rows.forEach((r, i) => {
    const cx = xFor(i);
    const top = yFor(r.gananciaNeta);
    const t = trend(rows, i);
    if (t.cls === 'neutral') hasNeutral = true;
    const r4 = 4;

    const group = el('g', {});
    const d =
      `M${cx - barW / 2} ${baseline}` +
      ` L${cx - barW / 2} ${top + r4}` +
      ` Q${cx - barW / 2} ${top} ${cx - barW / 2 + r4} ${top}` +
      ` L${cx + barW / 2 - r4} ${top}` +
      ` Q${cx + barW / 2} ${top} ${cx + barW / 2} ${top + r4}` +
      ` L${cx + barW / 2} ${baseline} Z`;
    group.appendChild(el('path', { d, fill: trendColorVar(t.cls) }));

    const label = el('text', { x: cx, y: top - 8, 'text-anchor': 'middle', fill: 'var(--ink)', 'font-size': 11, 'font-weight': 700 });
    label.textContent = fmtMoneyCompact(r.gananciaNeta);
    group.appendChild(label);
    svg.appendChild(group);

    const xt = el('text', { x: cx, y: H - 10, 'text-anchor': 'middle', fill: 'var(--steel)', 'font-size': 11 });
    xt.textContent = labelCorto(r.mes);
    svg.appendChild(xt);

    const hit = el('rect', {
      x: PAD.left + slotW * i,
      y: PAD.top - 12,
      width: slotW,
      height: plotH + 12,
      fill: 'transparent',
      style: 'cursor:pointer',
      tabindex: 0,
    });

    function show() {
      group.setAttribute('opacity', '0.8');
      const pctText = t.pct === null ? 'sin datos previos' : `${t.pct >= 0 ? '+' : ''}${t.pct.toFixed(1).replace('.', ',')}% vs. mes anterior`;
      refs.tooltip.innerHTML =
        `<div style="font-weight:700;margin-bottom:6px;font-size:12.5px;">${labelLargo(r.mes)}</div>` +
        `<div style="display:flex;justify-content:space-between;gap:14px;padding:2px 0;"><span style="color:rgba(255,255,255,0.75);">Ganancia neta</span><span style="font-weight:700;">${fmtMoney(r.gananciaNeta)}</span></div>` +
        `<div style="display:flex;justify-content:space-between;gap:14px;padding:2px 0;"><span style="color:rgba(255,255,255,0.75);">Variación</span><span style="font-weight:700;">${trendArrow(t.pct)} ${pctText}</span></div>`;
      refs.tooltip.style.left = `${(cx / W) * 100}%`;
      refs.tooltip.style.top = `${(top / H) * refs.chartWrap.offsetHeight - 10}px`;
      refs.tooltip.style.opacity = '1';
    }
    function hide() {
      group.setAttribute('opacity', '1');
      refs.tooltip.style.opacity = '0';
    }
    hit.addEventListener('pointerenter', show);
    hit.addEventListener('focus', show);
    hit.addEventListener('pointerleave', hide);
    hit.addEventListener('blur', hide);
    svg.appendChild(hit);
  });

  renderTrendLegend(refs.legend, hasNeutral);
  renderTrendTable(refs.table, rows);
}

function renderLine(refs: FinanceChartRefs, rows: PuntoMensual[]) {
  const W = 640;
  const H = 300;
  const PAD = { top: 26, right: 18, bottom: 34, left: 46 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  refs.svgWrap.innerHTML = '<svg role="img" aria-label="Ganancia neta, evolución del año"></svg>';
  const svg = refs.svgWrap.querySelector('svg')!;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const maxVal = niceMax(Math.max(...rows.map((r) => r.gananciaNeta)) * 1.15);
  const steps = 4;
  const xFor = (i: number) => PAD.left + (rows.length === 1 ? plotW / 2 : (i / (rows.length - 1)) * plotW);
  const yFor = (v: number) => PAD.top + plotH - (v / maxVal) * plotH;
  const baseline = PAD.top + plotH;

  for (let s = 0; s <= steps; s++) {
    const v = (maxVal / steps) * s;
    const y = yFor(v);
    svg.appendChild(el('line', { x1: PAD.left, x2: W - PAD.right, y1: y, y2: y, stroke: 'var(--line)', 'stroke-width': 1 }));
    const t = el('text', { x: PAD.left - 8, y: y + 3, 'text-anchor': 'end', fill: 'var(--steel)', 'font-size': 10 });
    t.textContent = fmtMoneyCompact(v);
    svg.appendChild(t);
  }

  const trends = rows.map((_, i) => trend(rows, i));
  const hasNeutral = trends.some((t) => t.cls === 'neutral');

  const top = rows.map((r, i) => `${xFor(i)},${yFor(r.gananciaNeta)}`);
  const areaPoints = top.concat([`${xFor(rows.length - 1)},${baseline}`, `${xFor(0)},${baseline}`]);
  svg.appendChild(el('polygon', { points: areaPoints.join(' '), fill: `rgba(var(--line-rgb), 0.5)` }));

  for (let i = 1; i < rows.length; i++) {
    const d = `M${xFor(i - 1)} ${yFor(rows[i - 1].gananciaNeta)} L${xFor(i)} ${yFor(rows[i].gananciaNeta)}`;
    svg.appendChild(
      el('path', { d, fill: 'none', stroke: trendColorVar(trends[i].cls), 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    );
  }

  rows.forEach((r, i) => {
    const xt = el('text', { x: xFor(i), y: H - 10, 'text-anchor': 'middle', fill: 'var(--steel)', 'font-size': 11 });
    xt.textContent = labelCorto(r.mes);
    svg.appendChild(xt);
  });

  const crosshair = el('line', { x1: 0, x2: 0, y1: PAD.top, y2: baseline, stroke: 'var(--steel)', 'stroke-width': 1, opacity: 0 });
  svg.appendChild(crosshair);

  const dots = rows.map((r, i) => {
    const dot = el('circle', {
      cx: xFor(i),
      cy: yFor(r.gananciaNeta),
      r: 4,
      fill: trendColorVar(trends[i].cls),
      stroke: '#fff',
      'stroke-width': 2,
    });
    svg.appendChild(dot);
    return dot;
  });

  [0, rows.length - 1].forEach((i) => {
    const lbl = el('text', {
      x: xFor(i) + (i === 0 ? 4 : -4),
      y: yFor(rows[i].gananciaNeta) - 10,
      'text-anchor': i === 0 ? 'start' : 'end',
      fill: 'var(--ink)',
      'font-size': 11,
      'font-weight': 700,
    });
    lbl.textContent = fmtMoneyCompact(rows[i].gananciaNeta);
    svg.appendChild(lbl);
  });

  function showTooltip(i: number) {
    const r = rows[i];
    const t = trends[i];
    const x = xFor(i);
    crosshair.setAttribute('x1', String(x));
    crosshair.setAttribute('x2', String(x));
    crosshair.setAttribute('opacity', '1');
    dots.forEach((dot, di) => dot.setAttribute('r', di === i ? '6' : '4'));

    const pctText = t.pct === null ? 'sin datos previos' : `${t.pct >= 0 ? '+' : ''}${t.pct.toFixed(1).replace('.', ',')}% vs. mes anterior`;
    refs.tooltip.innerHTML =
      `<div style="font-weight:700;margin-bottom:6px;font-size:12.5px;">${labelLargo(r.mes)}</div>` +
      `<div style="display:flex;justify-content:space-between;gap:14px;padding:2px 0;"><span style="color:rgba(255,255,255,0.75);">Ganancia neta</span><span style="font-weight:700;">${fmtMoney(r.gananciaNeta)}</span></div>` +
      `<div style="display:flex;justify-content:space-between;gap:14px;padding:2px 0;"><span style="color:rgba(255,255,255,0.75);">Variación</span><span style="font-weight:700;">${trendArrow(t.pct)} ${pctText}</span></div>`;
    refs.tooltip.style.left = `${(x / W) * 100}%`;
    refs.tooltip.style.top = `${(yFor(r.gananciaNeta) / H) * refs.chartWrap.offsetHeight - 10}px`;
    refs.tooltip.style.opacity = '1';
  }
  function hideTooltip() {
    crosshair.setAttribute('opacity', '0');
    dots.forEach((dot) => dot.setAttribute('r', '4'));
    refs.tooltip.style.opacity = '0';
  }

  rows.forEach((_, i) => {
    const slotW = plotW / rows.length;
    const hit = el('rect', { x: PAD.left + slotW * i, y: 0, width: slotW, height: H, fill: 'transparent', style: 'cursor:crosshair', tabindex: 0 });
    hit.addEventListener('pointerenter', () => showTooltip(i));
    hit.addEventListener('focus', () => showTooltip(i));
    hit.addEventListener('blur', hideTooltip);
    svg.appendChild(hit);
  });
  svg.addEventListener('pointerleave', hideTooltip);

  renderTrendLegend(refs.legend, hasNeutral);
  renderTrendTable(refs.table, rows);
}

function renderDonut(refs: FinanceChartRefs, row: PuntoMensual) {
  const total = row.facturacion;
  const resto = row.gananciaNeta - row.comision;
  const segments = [
    { key: 'gastos', label: 'Gastos', value: row.gastos, color: 'var(--critical)' },
    { key: 'comision', label: 'Tu comisión', value: row.comision, color: 'var(--warn)' },
    { key: 'resto', label: 'Resto para la empresa', value: resto, color: 'var(--good)' },
  ];

  const size = 220;
  const cx = 110;
  const cy = 110;
  const r = 72;
  const strokeW = 30;
  const circumference = 2 * Math.PI * r;

  refs.svgWrap.innerHTML = `<svg role="img" aria-label="Distribución de la facturación del mes" style="max-width:260px;" viewBox="0 0 ${size} ${size}"></svg><div></div>`;
  const svg = refs.svgWrap.querySelector('svg')!;
  const legendHost = refs.svgWrap.children[1] as HTMLDivElement;
  legendHost.className = 'donut-legend-host';

  const g = el('g', { transform: `rotate(-90 ${cx} ${cy})` });
  svg.appendChild(g);

  let acc = 0;
  const arcs: SVGElement[] = [];
  segments.forEach((seg) => {
    const frac = total > 0 ? seg.value / total : 0;
    const dash = frac * circumference;
    const arc = el('circle', {
      cx,
      cy,
      r,
      fill: 'none',
      stroke: seg.color,
      'stroke-width': strokeW,
      'stroke-dasharray': `${dash} ${circumference - dash}`,
      'stroke-dashoffset': -acc,
      style: 'cursor:pointer;transition:stroke-width .12s ease, opacity .12s ease',
    });
    arc.dataset.key = seg.key;
    g.appendChild(arc);
    arcs.push(arc);
    acc += dash;
  });

  const centerValue = el('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', fill: 'var(--navy-deep)', 'font-size': 21, 'font-weight': 700 });
  centerValue.textContent = fmtMoneyCompact(total);
  const centerLabel = el('text', { x: cx, y: cy + 16, 'text-anchor': 'middle', fill: 'var(--steel)', 'font-size': 10 });
  centerLabel.textContent = 'Facturación total';
  svg.appendChild(centerValue);
  svg.appendChild(centerLabel);

  const rowsEls = segments.map((seg) => {
    const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
    const rowEl = document.createElement('div');
    rowEl.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px;transition:background .12s ease;';
    rowEl.dataset.key = seg.key;
    rowEl.innerHTML =
      `<span style="width:12px;height:12px;flex-shrink:0;background:${seg.color};"></span>` +
      `<span style="flex:1;min-width:0;font-size:12.5px;color:var(--ink);">${seg.label}</span>` +
      `<span style="display:flex;align-items:baseline;gap:6px;flex-shrink:0;"><span style="font-size:13px;font-weight:700;color:var(--navy-deep);">${fmtMoney(seg.value)}</span><span style="font-size:11.5px;color:var(--steel);">${pct}%</span></span>`;
    legendHost.appendChild(rowEl);
    return rowEl;
  });
  legendHost.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex:1 1 220px;min-width:200px;';

  function setHover(key: string | null) {
    arcs.forEach((a) => {
      const match = key === null || a.dataset.key === key;
      a.setAttribute('opacity', match ? '1' : '0.5');
    });
    rowsEls.forEach((rowEl) => {
      rowEl.style.background = key !== null && rowEl.dataset.key === key ? 'var(--paper)' : '';
    });
  }
  arcs.forEach((a) => {
    a.addEventListener('pointerenter', () => setHover(a.dataset.key ?? null));
    a.addEventListener('pointerleave', () => setHover(null));
  });
  rowsEls.forEach((rowEl) => {
    rowEl.addEventListener('pointerenter', () => setHover(rowEl.dataset.key ?? null));
    rowEl.addEventListener('pointerleave', () => setHover(null));
  });

  refs.legend.innerHTML = '';

  const body =
    segments
      .map((seg) => {
        const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
        return `<tr><td>${seg.label}</td><td>${fmtMoney(seg.value)}</td><td>${pct}%</td></tr>`;
      })
      .join('') + `<tr><td><strong>Facturación total</strong></td><td><strong>${fmtMoney(total)}</strong></td><td>100%</td></tr>`;
  refs.table.innerHTML = '<thead><tr><th>Concepto</th><th>Monto</th><th>%</th></tr></thead>' + `<tbody>${body}</tbody>`;
}

export function renderFinanceChart(refs: FinanceChartRefs, rows: PuntoMensual[], periodo: PeriodoFinanzas): string {
  refs.tooltip.style.opacity = '0';
  if (rows.length === 0) return 'Sin datos';
  if (periodo === 'mes') {
    renderDonut(refs, rows[0]);
    return 'Distribución de la facturación';
  }
  if (periodo === '3m') {
    renderBars(refs, rows);
    return 'Ganancia neta por mes';
  }
  if (rows.length === 1) {
    renderDonut(refs, rows[0]);
    return 'Distribución de la facturación';
  }
  renderLine(refs, rows);
  return 'Ganancia neta — evolución del año';
}
