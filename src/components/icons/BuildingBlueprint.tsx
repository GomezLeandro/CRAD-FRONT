import { useId } from 'react';

interface BuildingBlueprintProps {
  width?: number;
  height?: number;
}

/** Ilustración técnica del edificio del Hero (con el mismo brillo animado). Compartida por Hero y el panel de admin. */
export function BuildingBlueprint({ width = 300, height = 368 }: BuildingBlueprintProps) {
  const gradientId = useId();

  return (
    <svg viewBox="86 23 111 136" width={width} height={height}>
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="45" y2="150">
          <stop offset="0%" stopColor="#2A4A6B" />
          <stop offset="42%" stopColor="#2A4A6B" />
          <stop offset="50%" stopColor="#A9CDF2" />
          <stop offset="58%" stopColor="#2A4A6B" />
          <stop offset="100%" stopColor="#2A4A6B" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            values="-90 0; 260 0; -90 0"
            dur="5.5s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <polygon
        points="92.5 152.67 98.41 152.67 98.41 72.93 154.1 40.02 154.1 132 160.32 132 160.32 29.05 92.5 68.71 92.5 152.67"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
      />
      <polygon
        points="123.49 86.19 123.49 86.21 149.99 86.21 149.99 91.86 123.49 91.86 123.49 146.61 184.43 146.61 184.43 87.41 164.35 77.2 164.35 69.52 191.06 83.48 191.06 152.67 117.6 152.67 117.6 86.19 123.49 86.19"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
      />
    </svg>
  );
}
