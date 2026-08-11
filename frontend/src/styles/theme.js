import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0284c7',      // Primary Sky Blue
      light: '#38bdf8',     // Light Sky Blue
      dark: '#0369a1',      // Dark Sky Blue Hover
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0284c7',      // Sky Blue Accent
      light: '#7dd3fc',     // Light Sky Blue
      dark: '#075985',      // Deep Sky Blue
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10b981',      // Success Green
      light: '#34d399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#f59e0b',      // Amber Warning
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#dc2626',      // Error Red
      light: '#f87171',
      dark: '#991b1b',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#f0f9ff',   // Soft Tinted Sky Blue Light Canvas
      paper: '#FFFFFF',     // Solid Pure White Cards & Modals
    },
    text: {
      primary: '#0f172a',   // Deep Slate Navy Text
      secondary: '#475569', // Muted Slate Gray Text
      disabled: '#94a3b8',
    },
    divider: '#e0f2fe',
  },
  typography: {
    fontFamily: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          boxShadow: 'none',
          padding: '8px 20px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0284c7',
          color: '#FFFFFF',
          fontWeight: 700,
          '&:hover': {
            backgroundColor: '#0369a1',
          },
        },
        outlinedPrimary: {
          backgroundColor: '#FFFFFF',
          borderColor: '#0284c7',
          color: '#0284c7',
          borderWidth: '1.5px',
          '&:hover': {
            backgroundColor: '#f0f9ff',
            borderColor: '#0369a1',
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px -2px rgba(2, 132, 199, 0.12)',
          border: '1.5px solid #e0f2fe',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: '#FFFFFF',
          color: '#0f172a',
        },
      },
    },
  },
});

export default theme;
