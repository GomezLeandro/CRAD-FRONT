import styles from './UrgencyBar.module.css';

export function UrgencyBar() {
  return (
    <div className={styles.bar}>
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 5a2 2 0 0 1 2 2" />
        <path d="M15 1a6 6 0 0 1 6 6" />
        <path d="M5 4l2.5-.5 2 4-1.6 1.6a11 11 0 0 0 5 5l1.6-1.6 4 2L18 17c-6 1-13-6-13-13z" />
      </svg>
      ¿Urgencia? Llamanos ahora
      <a href="tel:+5491122370857">+54 9 11 2237-0857</a>
    </div>
  );
}
