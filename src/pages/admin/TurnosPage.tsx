import { useEffect, useState, useCallback } from 'react';
import { listarTurnos, actualizarEstadoTurno } from '../../services/turnosService';
import type { Turno, TurnoEstado } from '../../types/domain';
import styles from './TurnosPage.module.css';

const ESTADOS: { value: TurnoEstado | 'todos'; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'rechazado', label: 'Rechazados' },
  { value: 'completado', label: 'Completados' },
  { value: 'todos', label: 'Todos' },
];

export function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [filtro, setFiltro] = useState<TurnoEstado | 'todos'>('pendiente');
  const [loading, setLoading] = useState(true);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    const result = await listarTurnos(filtro === 'todos' ? undefined : filtro);
    if (result.ok) {
      setTurnos(result.data);
      setError('');
    } else {
      setError(result.error.message);
    }
    setLoading(false);
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstado(id: string, estado: 'confirmado' | 'rechazado' | 'completado') {
    setActualizandoId(id);
    const result = await actualizarEstadoTurno(id, estado);
    setActualizandoId(null);
    if (result.ok) {
      cargar();
    } else {
      setError(result.error.message);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Turnos</h1>

      <div className={styles.tabs}>
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            className={`${styles.tab} ${filtro === e.value ? styles.tabActive : ''}`}
            onClick={() => setFiltro(e.value)}
          >
            {e.label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>Cargando…</p>}

      {!loading && turnos.length === 0 && <p className={styles.empty}>No hay turnos en este filtro.</p>}

      <div className={styles.list}>
        {turnos.map((t) => (
          <article key={t.id} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.rubro}>
                {t.rubro} {t.urgente && <span className={styles.urgente}>URGENTE</span>}
              </span>
              <span className={`${styles.estado} ${styles[t.estado]}`}>{t.estado}</span>
            </div>
            <p className={styles.problema}>{t.problema}</p>
            <dl className={styles.meta}>
              <div>
                <dt>Fecha</dt>
                <dd>
                  {t.fecha} — {t.horario}
                </dd>
              </div>
              <div>
                <dt>Dirección</dt>
                <dd>{t.direccion}</dd>
              </div>
              <div>
                <dt>Contacto</dt>
                <dd>{t.contacto}</dd>
              </div>
            </dl>
            {t.estado === 'pendiente' && (
              <div className={styles.actions}>
                <button
                  className="btn btn-navy"
                  disabled={actualizandoId === t.id}
                  onClick={() => cambiarEstado(t.id, 'confirmado')}
                >
                  Confirmar
                </button>
                <button
                  className={styles.rejectBtn}
                  disabled={actualizandoId === t.id}
                  onClick={() => cambiarEstado(t.id, 'rechazado')}
                >
                  Rechazar
                </button>
              </div>
            )}
            {t.estado === 'confirmado' && (
              <div className={styles.actions}>
                <button
                  className="btn btn-navy"
                  disabled={actualizandoId === t.id}
                  onClick={() => cambiarEstado(t.id, 'completado')}
                >
                  Marcar como completado
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
