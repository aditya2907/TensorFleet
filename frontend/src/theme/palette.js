// TensorFleet design tokens — indigo brand on slate neutrals.
// Both palettes expose the same custom keys (sidebar, gradients) so
// components can style against tokens instead of hardcoded colors.

const slate = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
};

const brand = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
};

// The sidebar keeps a deep-slate look in both modes — it anchors the layout.
const sidebar = {
  background: '#0d1321',
  border: 'rgba(148, 163, 184, 0.12)',
  text: '#e2e8f0',
  textMuted: '#8494ab',
  active: 'rgba(129, 140, 248, 0.16)',
  activeText: '#c7d2fe',
  hover: 'rgba(148, 163, 184, 0.08)',
};

export const lightPalette = {
  primary: {
    main: brand[600],
    light: brand[400],
    dark: brand[700],
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#7c3aed',
    light: '#a78bfa',
    dark: '#6d28d9',
    contrastText: '#ffffff',
  },
  error: {
    main: '#dc2626',
    light: '#f87171',
    dark: '#b91c1c',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#d97706',
    light: '#fbbf24',
    dark: '#b45309',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0284c7',
    light: '#38bdf8',
    dark: '#0369a1',
    contrastText: '#ffffff',
  },
  success: {
    main: '#059669',
    light: '#34d399',
    dark: '#047857',
    contrastText: '#ffffff',
  },
  grey: slate,
  background: {
    default: '#f4f6fa',
    paper: '#ffffff',
  },
  text: {
    primary: slate[900],
    secondary: slate[600],
    disabled: slate[400],
  },
  divider: '#e5e9f0',
  action: {
    active: slate[600],
    hover: 'rgba(15, 23, 42, 0.04)',
    selected: 'rgba(79, 70, 229, 0.08)',
    disabled: slate[400],
    disabledBackground: slate[200],
    focus: 'rgba(79, 70, 229, 0.12)',
  },
  brand,
  sidebar,
  gradients: {
    brand: `linear-gradient(135deg, ${brand[500]} 0%, #7c3aed 100%)`,
  },
};

export const darkPalette = {
  primary: {
    main: brand[400],
    light: brand[300],
    dark: brand[500],
    contrastText: '#0d1321',
  },
  secondary: {
    main: '#a78bfa',
    light: '#c4b5fd',
    dark: '#8b5cf6',
    contrastText: '#0d1321',
  },
  error: {
    main: '#f87171',
    light: '#fca5a5',
    dark: '#ef4444',
    contrastText: '#0d1321',
  },
  warning: {
    main: '#fbbf24',
    light: '#fcd34d',
    dark: '#f59e0b',
    contrastText: '#0d1321',
  },
  info: {
    main: '#38bdf8',
    light: '#7dd3fc',
    dark: '#0ea5e9',
    contrastText: '#0d1321',
  },
  success: {
    main: '#34d399',
    light: '#6ee7b7',
    dark: '#10b981',
    contrastText: '#0d1321',
  },
  grey: slate,
  background: {
    default: '#0b101b',
    paper: '#121927',
  },
  text: {
    primary: '#e6eaf2',
    secondary: slate[400],
    disabled: slate[600],
  },
  divider: 'rgba(148, 163, 184, 0.14)',
  action: {
    active: slate[300],
    hover: 'rgba(148, 163, 184, 0.08)',
    selected: 'rgba(129, 140, 248, 0.16)',
    disabled: slate[600],
    disabledBackground: 'rgba(148, 163, 184, 0.12)',
    focus: 'rgba(129, 140, 248, 0.24)',
  },
  brand,
  sidebar,
  gradients: {
    brand: `linear-gradient(135deg, ${brand[400]} 0%, #a78bfa 100%)`,
  },
};
