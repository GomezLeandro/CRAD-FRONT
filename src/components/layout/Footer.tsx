import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer id="contacto" className={styles.footer}>
      <div className="wrap">
        <div className={styles.top}>
          <div className={styles.brand}>CRAD</div>
          <div className={styles.contact}>
            <div>📞 +54 9 11 2237-0857</div>
            <div>✉️ serviciosgrupocrad@gmail.com</div>
            <div>📍 San Martín, Buenos Aires</div>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} CRAD Construcciones y Reparaciones</span>
        </div>
      </div>
    </footer>
  );
}
