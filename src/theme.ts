import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#242424', contrastText: '#ffffff' },
    background: { default: '#f5f5f4', paper: '#ffffff' },
    text: { primary: '#202020', secondary: '#777974' },
    divider: '#eeeeeb',
    success: { main: '#48735b' },
    error: { main: '#b54343' },
  },
  typography: {
    fontFamily: 'var(--font-sans)',
    button: {
      fontFamily: 'var(--font-mono)',
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0',
    },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 24, minHeight: 40, paddingInline: 18 },
        outlined: { borderColor: '#dededb' },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 28, backgroundImage: 'none' } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 600, letterSpacing: '-0.6px' } } },
    MuiTooltip: { defaultProps: { arrow: true } },
    MuiIconButton: { styleOverrides: { root: { color: '#575954' } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 16 } } },
  },
});
