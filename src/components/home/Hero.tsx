import { BuildingBlueprint } from '../icons/BuildingBlueprint';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="top" className={styles.hero}>
      <div className={styles.heroGridBg} aria-hidden="true" />
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
          <div className={styles.heroCta}>
            <a href="#servicios" className="btn btn-outline">
              Coordinar visita
            </a>
          </div>
        </div>
        <div className={styles.visual} aria-hidden="true">
          <BuildingBlueprint width={380} height={467} />
          <div className={styles.dims}>
            <span className={styles.r} />
            <span>alt. 3.40 m</span>
          </div>
          <div className={`${styles.dims} ${styles.dims2}`}>
            <span className={styles.r} />
            <span>esc. 1:50</span>
          </div>
        </div>
      </div>
    </section>
  );
}
