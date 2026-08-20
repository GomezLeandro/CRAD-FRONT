import { useEffect, useState, type FormEvent } from 'react';
import {
  crearFactura,
  listarFacturas,
  marcarFacturaPagada,
  obtenerIngresosPorMes,
  type IngresoMensual,
} from '../../services/facturasService';
import type { Factura } from '../../types/domain';
import styles from './FacturasPage.module.css';

export function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [ingresos, setIngresos] = useState<IngresoMensual[]>([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fechaEmision, setFechaEmision] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  async function cargar() {
    const [f, i] = await Promise.all([listarFacturas(), obtenerIngresosPorMes()]);
    if (f.ok) setFacturas(f.data);
    if (i.ok) setIngresos(i.data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const result = await crearFactura({
      clienteNombre,
      concepto,
      monto: Number(monto),
      fechaEmision,
    });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setClienteNombre('');
    setConcepto('');
    setMonto('');
    cargar();
  }

  async function pagar(id: string) {
    await marcarFacturaPagada(id, new Date().toISOString().slice(0, 10));
    cargar();
  }

  const maxTotal = Math.max(1, ...ingresos.map((i) => i.total));

  return (
    <div>
      <h1 className={styles.title}>Facturación</h1>

      <section className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Ingresos por mes</h2>
        {ingresos.length === 0 ? (
          <p className={styles.empty}>Todavía no hay facturas cargadas.</p>
        ) : (
          <div className={styles.chart}>
            {ingresos.map((i) => (
              <div key={i.mes} className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{ height: `${(i.total / maxTotal) * 100}%` }}
                  title={`$${i.total.toLocaleString('es-AR')}`}
                />
                <span className={styles.barLabel}>{i.mes}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.formCard}>
        <h2 className={styles.chartTitle}>Nueva factura</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="field">
            <label htmlFor="clienteNombre">Cliente</label>
            <input
              id="clienteNombre"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="concepto">Concepto</label>
            <input id="concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="monto">Monto</label>
            <input
              id="monto"
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="fechaEmision">Fecha</label>
            <input
              id="fechaEmision"
              type="date"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-navy">
            Agregar factura
          </button>
        </form>
      </section>

      <div className={styles.list}>
        {facturas.map((f) => (
          <div key={f.id} className={styles.row}>
            <div>
              <strong>{f.clienteNombre}</strong>
              <p className={styles.concepto}>{f.concepto}</p>
            </div>
            <span>${f.monto.toLocaleString('es-AR')}</span>
            <span className={f.estado === 'pagada' ? styles.pagada : styles.pendiente}>
              {f.estado}
            </span>
            {f.estado === 'pendiente' && (
              <button className={styles.payBtn} onClick={() => pagar(f.id)}>
                Marcar pagada
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
