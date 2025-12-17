// MUI Component overrides following Material Design guidelines

export const createComponents = (mode, palette) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarColor: mode === 'dark' ? '#6b6b6b #2b2b2b' : '#959595 #f0f0f0',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: mode === 'dark' ? '#2b2b2b' : '#f0f0f0',
        },
        '&::-webkit-scrollbar-thumb': {
          background: mode === 'dark' ? '#6b6b6b' : '#959595',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: mode === 'dark' ? '#8b8b8b' : '#757575',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: palette.background.paper,
        color: palette.text.primary,
        borderBottom: `1px solid ${palette.divider}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: mode === 'dark'
          ? '0 4px 30px rgba(0, 0, 0, 0.3)'
          : '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: palette.background.default,
        borderRight: `1px solid ${palette.divider}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: palette.background.paper,
        borderRadius: '16px',
        border: `1px solid ${palette.divider}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: mode === 'dark'
            ? '0 12px 40px rgba(0, 0, 0, 0.4)'
            : '0 12px 40px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundColor: palette.background.paper,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
      elevation1: {
        boxShadow: mode === 'dark'
          ? '0 2px 8px rgba(0, 0, 0, 0.4)'
          : '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
      elevation2: {
        boxShadow: mode === 'dark'
          ? '0 4px 16px rgba(0, 0, 0, 0.4)'
          : '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
      elevation3: {
        boxShadow: mode === 'dark'
          ? '0 8px 24px rgba(0, 0, 0, 0.4)'
          : '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: '12px',
        fontWeight: 600,
        padding: '12px 24px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      },
      contained: {
        background: mode === 'dark'
          ? `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`
          : `linear-gradient(135deg, ${palette.primary.light} 0%, ${palette.primary.main} 100%)`,
        color: palette.primary.contrastText,
        boxShadow: mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.15)',
        '&:hover': {
          boxShadow: mode === 'dark'
            ? '0 8px 30px rgba(0, 0, 0, 0.4)'
            : '0 8px 30px rgba(0, 0, 0, 0.2)',
        },
      },
      outlined: {
        borderColor: palette.primary.main,
        color: palette.primary.main,
        borderWidth: '2px',
        '&:hover': {
          borderWidth: '2px',
          backgroundColor: palette.primary.main + '14',
        },
      },
      text: {
        color: palette.primary.main,
        '&:hover': {
          backgroundColor: palette.primary.main + '14',
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: palette.action.hover,
          transform: 'scale(1.1)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          backgroundColor: palette.background.paper,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.primary.main,
              borderWidth: '2px',
            },
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.primary.main,
              borderWidth: '2px',
            },
          },
        },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
        backgroundColor: palette.background.paper,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: '12px',
        backgroundColor: palette.background.paper,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${palette.divider}`,
        boxShadow: mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.5)'
          : '0 8px 32px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        margin: '2px 8px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: palette.action.hover,
          transform: 'translateX(4px)',
        },
        '&.Mui-selected': {
          backgroundColor: palette.primary.main + '14',
          '&:hover': {
            backgroundColor: palette.primary.main + '20',
          },
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: '20px',
        backgroundColor: palette.background.paper,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${palette.divider}`,
        boxShadow: mode === 'dark'
          ? '0 24px 64px rgba(0, 0, 0, 0.6)'
          : '0 24px 64px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontWeight: 700,
        fontSize: '1.5rem',
        color: palette.text.primary,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: '16px',
        backgroundColor: palette.background.paper,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${palette.divider}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      },
      colorPrimary: {
        backgroundColor: palette.primary.main,
        color: palette.primary.contrastText,
        '&:hover': {
          backgroundColor: palette.primary.dark,
        },
      },
      colorSecondary: {
        backgroundColor: palette.secondary.main,
        color: palette.secondary.contrastText,
        '&:hover': {
          backgroundColor: palette.secondary.dark,
        },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        backgroundColor: palette.background.paper,
        borderRadius: '12px',
        border: `1px solid ${palette.divider}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
      indicator: {
        height: '3px',
        borderRadius: '1.5px',
        backgroundColor: palette.primary.main,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: '8px',
        margin: '4px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: palette.action.hover,
        },
        '&.Mui-selected': {
          color: palette.primary.main,
        },
      },
    },
  },
  MuiList: {
    styleOverrides: {
      root: {
        padding: '8px',
        backgroundColor: palette.background.paper,
        borderRadius: '12px',
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        margin: '2px 0',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: palette.action.hover,
          transform: 'translateX(4px)',
        },
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        margin: '2px 0',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: palette.action.hover,
          transform: 'translateX(4px)',
        },
        '&.Mui-selected': {
          backgroundColor: palette.primary.main + '14',
          '&:hover': {
            backgroundColor: palette.primary.main + '20',
          },
        },
      },
    },
  },
  MuiListItemText: {
    styleOverrides: {
      primary: {
        fontWeight: 500,
        color: palette.text.primary,
      },
      secondary: {
        color: palette.text.secondary,
      },
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        color: palette.text.primary,
        minWidth: '40px',
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        backgroundColor: palette.background.paper,
        borderRadius: '12px !important',
        border: `1px solid ${palette.divider}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: '16px 0',
        },
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
        fontWeight: 600,
        '&:hover': {
          backgroundColor: palette.action.hover,
        },
      },
    },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: {
        '& .MuiSnackbarContent-root': {
          borderRadius: '12px',
          backgroundColor: palette.background.paper,
          color: palette.text.primary,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${palette.divider}`,
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${palette.divider}`,
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        padding: '8px',
      },
      switchBase: {
        padding: '1px',
        '&.Mui-checked': {
          transform: 'translateX(16px)',
          color: '#fff',
          '& + .MuiSwitch-track': {
            backgroundColor: palette.primary.main,
            opacity: 1,
            border: 0,
          },
        },
      },
      thumb: {
        boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
        width: '24px',
        height: '24px',
      },
      track: {
        borderRadius: '26px',
        border: `1px solid ${palette.grey[400]}`,
        backgroundColor: palette.grey[50],
        opacity: 1,
        transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
      },
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: {
        color: palette.grey[600],
        '&.Mui-checked': {
          color: palette.primary.main,
        },
        '&:hover': {
          backgroundColor: palette.primary.main + '14',
        },
      },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: {
        color: palette.grey[600],
        '&.Mui-checked': {
          color: palette.primary.main,
        },
        '&:hover': {
          backgroundColor: palette.primary.main + '14',
        },
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: {
        color: palette.primary.main,
      },
      thumb: {
        backgroundColor: palette.primary.main,
        '&:hover': {
          boxShadow: `0px 0px 0px 8px ${palette.primary.main}14`,
        },
        '&.Mui-focusVisible': {
          boxShadow: `0px 0px 0px 8px ${palette.primary.main}32`,
        },
      },
      track: {
        backgroundColor: palette.primary.main,
      },
      rail: {
        backgroundColor: palette.grey[300],
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: '4px',
        backgroundColor: palette.grey[200],
      },
      bar: {
        borderRadius: '4px',
        backgroundColor: palette.primary.main,
      },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      root: {
        color: palette.primary.main,
      },
    },
  },
});
