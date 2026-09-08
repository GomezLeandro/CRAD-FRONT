import { useState } from 'react';
import { ObraModal } from './ObraModal';
import styles from './Obra.module.css';

const PASOS = [
  { n: '01', t: 'Relevamiento y presupuesto', d: 'Visita técnica sin cargo, alcance definido por escrito.' },
  { n: '02', t: 'Proyecto y planos', d: 'Diseño ajustado a normativa municipal.' },
  { n: '03', t: 'Ejecución por etapas', d: 'Avance y pagos alineados a certificación de obra.' },
  { n: '04', t: 'Entrega', d: 'Final de obra y documentación completa.' },
];

export function Obra() {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <section id="obra" className={styles.section}>
      <div className={styles.titleRow}>
        <div className="wrap">
          <h2 className="section-title">Obra</h2>
        </div>
      </div>
      <div className={styles.contentRow}>
        <div className={styles.contentInner}>
          <div className={styles.cols}>
            <div className={styles.textCol}>
              <h3 className={styles.subtitle}>
                Construcción
                <br />
                desde cero,
                <br />
                de punta a punta.
              </h3>
              <p className={styles.desc}>
                <strong>Desde el terreno hasta la entrega de llaves:</strong>
                <br />
                Proyecto, dirección de obra y ejecución con un solo interlocutor.
              </p>
              <div className={styles.steps}>
                {PASOS.map((p) => (
                  <div key={p.n} className={styles.step}>
                    <span className={styles.n}>{p.n}</span>
                    <div>
                      <p className={styles.stepTitle}>{p.t}</p>
                      <p className={styles.stepDesc}>{p.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`btn btn-navy ${styles.cta}`}
                onClick={() => setModalAbierto(true)}
              >
                Contanos tu proyecto
              </button>
            </div>
            <img src="/obra.jpeg" alt="Planos y proyecto de obra" className={styles.visual} />
          </div>
        </div>
      </div>
      <ObraModal open={modalAbierto} onClose={() => setModalAbierto(false)} />
    </section>
  );
}
