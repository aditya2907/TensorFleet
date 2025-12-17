import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
      light: '#8b9bf7',
      dark: '#4c63d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f093fb',
      light: '#f5b7ff',
      dark: '#e066c8',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: 'rgba(255, 255, 255, 0.9)',
    },
    grey: {
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
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3rem',
      letterSpacing: '-0.025em',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.25rem',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.015em',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.95rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 16,
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          padding: `${theme.spacing(1.5)} ${theme.spacing(3)}`,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          transition: theme.transitions.create(['all'], {
            duration: theme.transitions.duration.short,
          }),
        }),
        contained: ({ theme }) => ({
          boxShadow: theme.shadows[2],
          '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'translateY(-1px)',
          },
        }),
        outlined: ({ theme }) => ({
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            transform: 'translateY(-1px)',
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius * 1.25,
          boxShadow: theme.shadows[1],
          transition: theme.transitions.create(['all'], {
            duration: theme.transitions.duration.standard,
          }),
          border: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(10px)',
          backgroundColor: theme.palette.background.paper,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[3],
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius * 1.25,
          backgroundColor: theme.palette.background.paper,
        }),
        elevation1: ({ theme }) => ({
          boxShadow: theme.shadows[1],
        }),
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: '#ffffff',
          borderRadius: `0 ${theme.shape.borderRadius * 1.25}px ${theme.shape.borderRadius * 1.25}px 0`,
          // Only style elements within the drawer, not globally
          '& .MuiListItemText-primary': {
            color: '#000000 !important',
            fontWeight: 500,
          },
          '& .MuiListItemIcon-root': {
            color: '#ffffff !important',
          },
          '& .MuiSvgIcon-root': {
            color: '#ffffff !important',
          },
          '& .MuiListItemButton-root': {
            color: '#ffffff !important',
          },
          '& .MuiTypography-root': {
            color: '#ffffff !important',
          },
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius * 0.75,
          margin: theme.spacing(0.5, 1),
          // Only apply special styling when inside a drawer
          '.MuiDrawer-paper &': {
            color: '#ffffff !important',
            '&.Mui-selected': {
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff !important',
              '& .MuiListItemText-primary': {
                color: '#ffffff !important',
                fontWeight: 600,
              },
              '& .MuiListItemIcon-root': {
                color: '#ffffff !important',
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
                color: '#ffffff !important',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#ffffff !important',
              '& .MuiListItemText-primary': {
                color: '#ffffff !important',
              },
              '& .MuiListItemIcon-root': {
                color: '#ffffff !important',
              },
            },
          },
          // Default styling for non-drawer list items
          '&.Mui-selected': {
            backgroundColor: theme.palette.action.selected,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }),
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '40px',
          // Don't set global color, let it inherit from parent context
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontWeight: 500,
          // Don't set global color, let it inherit from parent context
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          fontWeight: 500,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '& .MuiChip-label': {
            paddingLeft: theme.spacing(1.5),
            paddingRight: theme.spacing(1.5),
            fontSize: '0.875rem',
          },
        }),
        colorPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }),
        colorSecondary: ({ theme }) => ({
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
        }),
        outlined: ({ theme }) => ({
          borderWidth: '2px',
          '&:hover': {
            backgroundColor: `${theme.palette.primary.main}10`,
            borderColor: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius / 4,
          height: 8,
        }),
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: theme.palette.grey[300],
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: '2px',
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: '2px',
              boxShadow: `0 0 0 3px ${theme.palette.primary.main}15`,
            },
            '&.Mui-error fieldset': {
              borderColor: theme.palette.error.main,
            },
            '&.Mui-error:hover fieldset': {
              borderColor: theme.palette.error.main,
            },
            '&.Mui-error.Mui-focused fieldset': {
              borderColor: theme.palette.error.main,
              boxShadow: `0 0 0 3px ${theme.palette.error.main}15`,
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            '&.Mui-focused': {
              color: theme.palette.primary.main,
              fontWeight: 600,
            },
          },
          '& .MuiFormHelperText-root': {
            marginTop: theme.spacing(0.75),
            fontSize: '0.75rem',
          },
        }),
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          fontWeight: 500,
          '& .MuiAlert-icon': {
            fontSize: '1.25rem',
          },
        }),
        standardWarning: ({ theme }) => ({
          backgroundColor: `${theme.palette.warning.main}15`,
          color: theme.palette.warning.dark,
          border: `1px solid ${theme.palette.warning.main}30`,
        }),
        standardError: ({ theme }) => ({
          backgroundColor: `${theme.palette.error.main}15`,
          color: theme.palette.error.dark,
          border: `1px solid ${theme.palette.error.main}30`,
        }),
        standardSuccess: ({ theme }) => ({
          backgroundColor: `${theme.palette.success.main}15`,
          color: theme.palette.success.dark,
          border: `1px solid ${theme.palette.success.main}30`,
        }),
        standardInfo: ({ theme }) => ({
          backgroundColor: `${theme.palette.info.main}15`,
          color: theme.palette.info.dark,
          border: `1px solid ${theme.palette.info.main}30`,
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: theme.shadows[2],
        }),
      },
    },
  },
  shadows: [
    'none',
    '0 2px 8px rgba(0,0,0,0.08)',
    '0 4px 12px rgba(0,0,0,0.1)',
    '0 6px 16px rgba(0,0,0,0.12)',
    '0 8px 24px rgba(0,0,0,0.14)',
    '0 10px 32px rgba(0,0,0,0.16)',
    '0 12px 40px rgba(0,0,0,0.18)',
    '0 14px 48px rgba(0,0,0,0.2)',
    '0 16px 56px rgba(0,0,0,0.22)',
    '0 18px 64px rgba(0,0,0,0.24)',
    '0 20px 72px rgba(0,0,0,0.26)',
    '0 22px 80px rgba(0,0,0,0.28)',
    '0 24px 88px rgba(0,0,0,0.3)',
    '0 26px 96px rgba(0,0,0,0.32)',
    '0 28px 104px rgba(0,0,0,0.34)',
    '0 30px 112px rgba(0,0,0,0.36)',
    '0 32px 120px rgba(0,0,0,0.38)',
    '0 34px 128px rgba(0,0,0,0.4)',
    '0 36px 136px rgba(0,0,0,0.42)',
    '0 38px 144px rgba(0,0,0,0.44)',
    '0 40px 152px rgba(0,0,0,0.46)',
    '0 42px 160px rgba(0,0,0,0.48)',
    '0 44px 168px rgba(0,0,0,0.5)',
    '0 46px 176px rgba(0,0,0,0.52)',
    '0 48px 184px rgba(0,0,0,0.54)',
  ],
});
