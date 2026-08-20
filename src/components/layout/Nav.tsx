import { useState } from 'react';
import styles from './Nav.module.css';

const LINKS = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#obra', label: 'Obra' },
  { href: '#trabajos', label: 'Trabajos' },
  { href: '#contacto', label: 'Contacto' },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className={styles.nav}>
        <div className={`wrap ${styles.inner}`}>
          <a href="#top" className={styles.logo} aria-label="CRAD - inicio">
            <LogoMark />
            <span>
              CRAD
              <small>Construcciones y Reparaciones</small>
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

function LogoMark() {
  return (
    <svg viewBox="60 46 305 134" width="34" height="34" aria-hidden="true">
      <path
        d="M65 178V96l86-46 86 46v82"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
      />
      <path
        d="M151 96l60 32v50"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
      />
    </svg>
  );
}
