import styles from './WhatsAppButton.module.css';

const WHATSAPP_NUMBER = '5491122370857';

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.button}
      aria-label="Escribinos por WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff" aria-hidden="true">
        <path d="M16.04 3C9.1 3 3.46 8.64 3.46 15.58c0 2.35.65 4.55 1.77 6.44L3 29l7.18-2.19a12.5 12.5 0 0 0 5.86 1.47c6.94 0 12.58-5.64 12.58-12.58S22.98 3 16.04 3z" />
      </svg>
    </a>
  );
}
