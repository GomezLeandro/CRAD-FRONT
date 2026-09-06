import { useId } from 'react';

interface LogoMarkProps {
  size?: number;
  /** Recorre un brillo sobre el trazo, igual al efecto del Hero. */
  shine?: boolean;
}

/** Isotipo de CRAD (silueta de techo a dos aguas). Compartido por Nav y Footer. */
export function LogoMark({ size = 34, shine = false }: LogoMarkProps) {
  const gradientId = useId();
  const stroke = shine ? `url(#${gradientId})` : 'currentColor';

  return (
    <svg viewBox="60 46 305 134" width={size} height={size} aria-hidden="true">
      {shine && (
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="90" y2="300">
            <stop offset="0%" stopColor="currentColor" />
            <stop offset="42%" stopColor="currentColor" />
            <stop offset="50%" stopColor="#fff" />
            <stop offset="58%" stopColor="currentColor" />
            <stop offset="100%" stopColor="currentColor" />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              values="-180 0; 520 0; -180 0"
              dur="5.5s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      )}
      <path d="M65 178V96l86-46 86 46v82" fill="none" stroke={stroke} strokeWidth="10" />
      <path d="M151 96l60 32v50" fill="none" stroke={stroke} strokeWidth="10" />
    </svg>
  );
}
