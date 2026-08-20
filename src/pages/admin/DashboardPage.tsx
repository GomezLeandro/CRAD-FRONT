import { useEffect, useState } from 'react';
import { listarTurnos } from '../../services/turnosService';
import { listarMensajes } from '../../services/mensajesService';
import { obtenerIngresosPorMes } from '../../services/facturasService';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const [pendientes, setPendientes] = useState<number | null>(null);
  const [mensajesSinLeer, setMensajesSinLeer] = useState<number | null>(null);
  const [ingresoMesActual, setIngresoMesActual] = useState<number | null>(null);

  useEffect(() => {
    listarTurnos('pendiente').then((r) => setPendientes(r.ok ? r.data.length : 0));
    listarMensajes().then((r) => setMensajesSinLeer(r.ok ? r.data.filter((m) => !m.leido).length : 0));
    obtenerIngresosPorMes().then((r) => {
      if (!r.ok) return setIngresoMesActual(0);
      const mesActual = new Date().toISOString().slice(0, 7);
      const actual = r.data.find((i) => i.mes === mesActual);
      setIngresoMesActual(actual?.total ?? 0);
    });
  }, []);

  return (
    <div>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.label}>Turnos pendientes</span>
          <span className={styles.value}>{pendientes ?? '—'}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Mensajes sin leer</span>
          <span className={styles.value}>{mensajesSinLeer ?? '—'}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Facturado este mes</span>
          <span className={styles.value}>
            {ingresoMesActual === null ? '—' : `$${ingresoMesActual.toLocaleString('es-AR')}`}
          </span>
        </div>
      </div>
    </div>
  );
}
