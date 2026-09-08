import { useEffect, useState } from 'react';
import { listarTrabajosPublicos } from '../../services/trabajosService';
import { Modal } from '../ui/Modal';
import type { Trabajo } from '../../types/domain';
import styles from './Trabajos.module.css';

export function Trabajos() {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [seleccionado, setSeleccionado] = useState<Trabajo | null>(null);

  useEffect(() => {
    let cancelled = false;
    listarTrabajosPublicos().then((result) => {
      if (!cancelled && result.ok) setTrabajos(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="trabajos" className={styles.section}>
      <div className={`wrap ${styles.content}`}>
        <h2 className="section-title">Trabajos</h2>
        <div className={styles.gallery}>
          {trabajos.map((t) => (
            <button
              key={t.id}
              className={styles.card}
              style={t.imagenUrl ? { backgroundImage: `url(${t.imagenUrl})` } : undefined}
              onClick={() => setSeleccionado(t)}
            >
              <div className={styles.info}>
                <p className={styles.t}>{t.titulo}</p>
                <p className={styles.d}>{t.ubicacion}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Modal open={seleccionado !== null} onClose={() => setSeleccionado(null)} maxWidth={620}>
        {seleccionado && (
          <div>
            {seleccionado.imagenUrl ? (
              <img
                className={styles.modalPhoto}
                src={seleccionado.imagenUrl}
                alt={seleccionado.titulo}
              />
            ) : (
              <div className={styles.modalImg}>
                <PhotoIcon />
                <span>Foto próximamente</span>
              </div>
            )}
            <div className={styles.modalHead}>
              <div className="eyebrow">
                <span className="rule" />
                <span>{seleccionado.ubicacion.toUpperCase()}</span>
              </div>
              <h2 className={styles.modalTitle}>{seleccionado.titulo}</h2>
            </div>
            <p className={styles.modalDesc}>{seleccionado.descripcion}</p>
          </div>
        )}
      </Modal>
    </section>
  );
}

function PhotoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="34"
      height="34"
      fill="none"
      stroke="#fff"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.7"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M21 15l-5-5-9 9" />
    </svg>
  );
}
