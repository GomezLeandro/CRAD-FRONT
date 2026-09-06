import { useEffect, useState } from 'react';
import { listarServiciosPublicos } from '../../services/serviciosService';
import { BookingModal } from '../booking/BookingModal';
import { RubroIcon } from '../icons/RubroIcon';
import type { Servicio } from '../../types/domain';
import styles from './Servicios.module.css';

export function Servicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listarServiciosPublicos().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setServicios(result.data);
      } else {
        setError(true);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="servicios" className={styles.section}>
      <div className="wrap">
        <h2 className="section-title">Servicios</h2>

        {loading && <p className={styles.status}>Cargando servicios…</p>}
        {error && (
          <p className={styles.status}>
            No pudimos cargar los servicios. Probá recargar la página.
          </p>
        )}

        {!loading && !error && (
          <div className={styles.grid}>
            {servicios.map((s) => (
              <div key={s.id} className={styles.card}>
                <div className={styles.icon}>
                  {s.iconoUrl ? (
                    <img src={s.iconoUrl} alt="" width={34} height={34} />
                  ) : (
                    <RubroIcon rubroKey={s.rubroKey} />
                  )}
                </div>
                <p className={styles.title}>{s.nombre}</p>
                <p className={styles.desc}>{s.descripcion}</p>
                <button
                  className={`btn btn-navy ${styles.cardBtn}`}
                  onClick={() => setRubroSeleccionado(s.nombre)}
                >
                  Reserva
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <p className={styles.bridge}>
            ¿Es un proyecto de cero?{' '}
            <a href="#obra" className={styles.bridgeGo}>
              Ver sección Obra →
            </a>
          </p>
        )}
      </div>

      <BookingModal
        open={rubroSeleccionado !== null}
        onClose={() => setRubroSeleccionado(null)}
        rubro={rubroSeleccionado ?? ''}
      />
    </section>
  );
}
