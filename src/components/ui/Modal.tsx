import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
  labelledBy?: string;
}

export function Modal({ open, onClose, children, maxWidth = 920, labelledBy }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape — requisito básico de accesibilidad para modales.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
