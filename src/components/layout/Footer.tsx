import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer id="contacto" className={styles.footer}>
      <div className="wrap">
        <div className={styles.top}>
          <div className={styles.brand}>
            <img src="/LogoIcon.png" alt="" className={styles.logoIcon} />
            <span className={styles.logoText}>
              CRAD
              <small>Construcciones y Reparaciones</small>
            </span>
          </div>
          <div className={styles.contact}>
            <div>
              <PhoneIcon /> +54 9 11 7286-9207
            </div>
            <div>
              <MailIcon /> serviciosgrupocrad@gmail.com
            </div>
            <div>
              <PinIcon /> San Martín, Buenos Aires
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} CRAD Construcciones y Reparaciones</span>
          <a
            href="https://www.instagram.com/crad.construcciones/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.instagram}
          >
            Instagram
          </a>
        </div>
        <div className={styles.credit}>
          Desarrollado por{' '}
          <a href="https://www.profilemarketing.com.ar" target="_blank" rel="noopener noreferrer">
            Profile
          </a>
        </div>
      </div>
    </footer>
  );
}

function iconProps() {
  return {
    viewBox: '0 0 24 24',
    width: 14,
    height: 14,
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
}

function PhoneIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M5 4l2.5-.5 2 4-1.6 1.6a11 11 0 0 0 5 5l1.6-1.6 4 2L18 17c-6 1-13-6-13-13z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
