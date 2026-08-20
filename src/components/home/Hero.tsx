import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="top" className={styles.hero}>
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.text}>
          <h1>
            Reparaciones,
            <br />
            Instalaciones
            <br />y Obra.
          </h1>
          <p className={styles.sub}>Desde una reparación hasta una obra completa.</p>
          <p className={styles.strong}>Un solo equipo para todo el proceso.</p>
          <a href="#servicios" className="btn btn-outline">
            Coordinar visita
          </a>
        </div>
        <div className={styles.visual} aria-hidden="true">
          <svg viewBox="0 0 320 260" fill="none" stroke="#7FA8CE" strokeWidth="1.6">
            <line x1="10" y1="228" x2="310" y2="228" strokeWidth="2" />
            <path d="M40 228V90l90-46 90 46v92" />
          </svg>
        </div>
      </div>
    </section>
  );
}
