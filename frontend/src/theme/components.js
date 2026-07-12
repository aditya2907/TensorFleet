// Global MUI component overrides. Everything styles against palette tokens —
// no hardcoded brand colors here or in feature components.

import { monoFontFamily } from './typography';

const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export const createComponents = (mode, palette) => {
  const isDark = mode === 'dark';
  const focusRing = `0 0 0 3px ${alpha(isDark ? '#818cf8' : '#4f46e5', 0.28)}`;
  const cardBorder = `1px solid ${palette.divider}`;
  const softShadow = isDark
    ? '0 1px 3px 0 rgba(0, 0, 0, 0.35)'
    : '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.05)';
  const raisedShadow = isDark
    ? '0 12px 32px -8px rgba(0, 0, 0, 0.5)'
    : '0 12px 32px -8px rgba(15, 23, 42, 0.16)';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          backgroundColor: palette.background.default,
          scrollbarColor: isDark ? '#334155 transparent' : '#cbd5e1 transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: '10px',
            height: '10px',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            background: isDark ? '#334155' : '#cbd5e1',
            borderRadius: '8px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '::selection': {
            backgroundColor: alpha(isDark ? '#818cf8' : '#4f46e5', 0.25),
          },
        },
        code: {
          fontFamily: monoFontFamily,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: isDark
            ? 'rgba(11, 16, 27, 0.85)'
            : 'rgba(244, 246, 250, 0.85)',
          color: palette.text.primary,
          borderBottom: cardBorder,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper,
          backgroundImage: 'none',
          borderRadius: 14,
          border: cardBorder,
          boxShadow: softShadow,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { padding: '16px 20px 8px' },
        title: { fontSize: '0.9375rem', fontWeight: 600 },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
          '&:last-child': { paddingBottom: 20 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          padding: '8px 16px',
          '&:focus-visible': { boxShadow: focusRing },
        },
        sizeSmall: { padding: '4px 12px' },
        sizeLarge: { padding: '10px 22px', fontSize: '0.9375rem' },
        containedPrimary: {
          '&:hover': {
            backgroundColor: isDark ? palette.primary.light : palette.primary.dark,
          },
        },
        outlined: {
          borderColor: palette.divider,
          color: palette.text.primary,
          '&:hover': {
            borderColor: palette.primary.main,
            backgroundColor: palette.action.hover,
          },
        },
        outlinedPrimary: {
          borderColor: alpha(isDark ? '#818cf8' : '#4f46e5', 0.4),
          color: palette.primary.main,
          '&:hover': {
            borderColor: palette.primary.main,
            backgroundColor: palette.action.selected,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:focus-visible': { boxShadow: focusRing },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: palette.background.paper,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.divider,
            transition: 'border-color 120ms ease',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark ? '#475569' : '#b6c2d4',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.primary.main,
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.875rem' },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: cardBorder,
          boxShadow: raisedShadow,
          marginTop: 4,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 6px',
          padding: '6px 10px',
          fontSize: '0.875rem',
          '&.Mui-selected': {
            backgroundColor: palette.action.selected,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: cardBorder,
          backgroundImage: 'none',
          boxShadow: raisedShadow,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1.125rem',
          padding: '20px 24px 12px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        sizeSmall: { height: 22 },
        // Soft tinted fills instead of solid blocks for status chips.
        colorSuccess: {
          backgroundColor: alpha(isDark ? '#34d399' : '#059669', isDark ? 0.16 : 0.1),
          color: isDark ? '#6ee7b7' : '#047857',
        },
        colorError: {
          backgroundColor: alpha(isDark ? '#f87171' : '#dc2626', isDark ? 0.16 : 0.09),
          color: isDark ? '#fca5a5' : '#b91c1c',
        },
        colorWarning: {
          backgroundColor: alpha(isDark ? '#fbbf24' : '#d97706', isDark ? 0.16 : 0.11),
          color: isDark ? '#fcd34d' : '#b45309',
        },
        colorInfo: {
          backgroundColor: alpha(isDark ? '#38bdf8' : '#0284c7', isDark ? 0.16 : 0.1),
          color: isDark ? '#7dd3fc' : '#0369a1',
        },
        colorPrimary: {
          backgroundColor: alpha(isDark ? '#818cf8' : '#4f46e5', isDark ? 0.18 : 0.1),
          color: isDark ? '#c7d2fe' : '#4338ca',
        },
        colorSecondary: {
          backgroundColor: alpha(isDark ? '#a78bfa' : '#7c3aed', isDark ? 0.18 : 0.1),
          color: isDark ? '#ddd6fe' : '#6d28d9',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: {
          height: 2,
          borderRadius: 1,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 40,
          padding: '8px 14px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&.Mui-selected': {
            backgroundColor: palette.action.selected,
            '&:hover': { backgroundColor: palette.action.selected },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 38, color: palette.text.secondary },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: palette.text.secondary,
            backgroundColor: isDark ? 'rgba(148, 163, 184, 0.05)' : palette.grey[50],
            borderBottom: cardBorder,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${palette.divider}`,
          fontSize: '0.8438rem',
        },
      },
    },
    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: {
        root: {
          border: cardBorder,
          borderRadius: '12px !important',
          backgroundImage: 'none',
          '&:before': { display: 'none' },
          '& + &': { marginTop: 8 },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, alignItems: 'center' },
        standardSuccess: {
          backgroundColor: alpha(isDark ? '#34d399' : '#059669', isDark ? 0.14 : 0.08),
        },
        standardError: {
          backgroundColor: alpha(isDark ? '#f87171' : '#dc2626', isDark ? 0.14 : 0.07),
        },
        standardWarning: {
          backgroundColor: alpha(isDark ? '#fbbf24' : '#d97706', isDark ? 0.14 : 0.09),
        },
        standardInfo: {
          backgroundColor: alpha(isDark ? '#38bdf8' : '#0284c7', isDark ? 0.14 : 0.08),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#0f172a',
          color: '#e2e8f0',
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 8,
          padding: '6px 10px',
        },
        arrow: {
          color: isDark ? '#1e293b' : '#0f172a',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 99,
          height: 6,
          backgroundColor: isDark ? 'rgba(148, 163, 184, 0.16)' : palette.grey[200],
        },
        bar: { borderRadius: 99 },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: palette.divider },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        thumb: { boxShadow: 'none' },
        track: {
          borderRadius: 22 / 2,
          opacity: isDark ? 0.4 : 1,
          backgroundColor: isDark ? '#475569' : palette.grey[300],
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            boxShadow: raisedShadow,
            border: cardBorder,
          },
        },
      },
    },
  };
};
