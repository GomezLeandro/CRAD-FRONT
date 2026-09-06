interface RubroIconProps {
  rubroKey: string;
}

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const ICONS: Record<string, JSX.Element> = {
  plomeria: (
    <svg {...ICON_PROPS} strokeWidth={1.6}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a6 6 0 0 1-8.13 7.87l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9A6 6 0 0 1 17.5 2.9l-3.1 3.1z" />
      <path d="M4 20l2-2" />
    </svg>
  ),
  gas: (
    <svg {...ICON_PROPS} strokeWidth={1.4}>
      <circle cx="12" cy="12.5" r="9.3" strokeWidth={1.2} />
      <path
        d="M10.7 16.2A1.7 1.7 0 0 0 12.4 14.5c0-.93-.34-1.34-.67-2-.72-1.44-.15-2.72 1.34-4.02.34 1.68 1.34 3.29 2.68 4.36 1.34 1.07 2.01 2.35 2.01 3.7a4.7 4.7 0 1 1-9.4 0c0-.77.29-1.54.67-2.01a1.68 1.68 0 0 0 1.68 1.68z"
        strokeWidth={1.6}
      />
    </svg>
  ),
  electricidad: (
    <svg {...ICON_PROPS} strokeWidth={1.5}>
      <path d="M12 2.5 1.5 21h21L12 2.5z" />
      <path d="M13 8.3l-3.4 5.7h2.5l-.9 3.7 3.9-6.3h-2.4l1-3.1z" strokeWidth={1.3} />
    </svg>
  ),
  climatizacion: (
    <svg {...ICON_PROPS} strokeWidth={1.6}>
      <path d="M2 7.5h11.5a2.5 2.5 0 1 0-2.3-3.4" />
      <path d="M2 12h15a2.7 2.7 0 1 1-2.5 3.7" />
      <path d="M2 16.5h8.5a2.2 2.2 0 1 1-2 3" />
    </svg>
  ),
  parquetista: (
    <svg {...ICON_PROPS} strokeWidth={1.5}>
      <rect x="3" y="4.5" width="18" height="3.4" rx="0.4" />
      <path d="M7 4.5v3.4M15 4.5v3.4" strokeWidth={1} />
      <rect x="3" y="10.3" width="18" height="3.4" rx="0.4" />
      <path d="M11 10.3v3.4M18 10.3v3.4" strokeWidth={1} />
      <rect x="3" y="16.1" width="18" height="3.4" rx="0.4" />
      <path d="M8.5 16.1v3.4M16 16.1v3.4" strokeWidth={1} />
    </svg>
  ),
  pintura: (
    <svg {...ICON_PROPS} strokeWidth={1.6}>
      <rect x="2.5" y="3" width="14" height="5.5" rx="0.8" />
      <line x1="12.5" y1="8.5" x2="12.5" y2="13" />
      <path d="M12.5 13h5v3.5h-5z" />
      <path d="M15 16.5a2.3 2.3 0 1 0 4.6 0c0-1.7-2.3-3.6-2.3-3.6s-2.3 1.9-2.3 3.6z" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg {...ICON_PROPS} strokeWidth={1.6}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4l2.5 2.5" />
  </svg>
);

/** Ícono por rubro en la grilla de Servicios, en base a la clave cargada desde el admin. */
export function RubroIcon({ rubroKey }: RubroIconProps) {
  return ICONS[normalize(rubroKey)] ?? DEFAULT_ICON;
}
