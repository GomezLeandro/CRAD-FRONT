import { useState } from 'react';
import styles from './Nav.module.css';

const LINKS = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#obra', label: 'Obra' },
  { href: '#trabajos', label: 'Trabajos' },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className={styles.nav}>
        <div className={`wrap ${styles.inner}`}>
          <a href="#top" className={styles.logo} aria-label="CRAD - inicio">
            <img src="/LogoIcon.png" alt="" className={styles.logoIcon} />
            <span className={styles.logoText}>
              CRAD
            </span>
          </a>
          <nav className={styles.links}>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <button
            className={styles.burger}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={`${styles.backdrop} ${open ? styles.open : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <nav className={`${styles.mobileNav} ${open ? styles.open : ''}`} aria-hidden={!open}>
        <button className={styles.close} onClick={() => setOpen(false)} aria-label="Cerrar menú">
          ✕
        </button>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
      </nav>
    </>
  );
}
