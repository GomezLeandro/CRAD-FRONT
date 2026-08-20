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
      <div className="wrap">
        <h2 className="section-title">Trabajos</h2>
        <div className={styles.gallery}>
          {trabajos.map((t) => (
            <button key={t.id} className={styles.card} onClick={() => setSeleccionado(t)}>
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
            <div className={styles.modalImg}>
              <span>Foto próximamente</span>
            </div>
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
