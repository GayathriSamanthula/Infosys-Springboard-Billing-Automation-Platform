import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#F59E0B',      // Accent Gold
      light: '#FBBF24',     // Light Gold
      dark: '#D97706',      // Gold Hover
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#111827',      // Rich Black
      light: '#1F2937',     // Dark Gray
      dark: '#030712',      // Deep Black
      contrastText: '#F9FAFB',
    },
    success: {
      main: '#10B981',      // Success Green
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F97316',      // Warning Orange
      light: '#FB923C',
      dark: '#EA580C',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444',      // Error Red
      light: '#F87171',
      dark: '#DC2626',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#111827',   // Rich Black Background Base
      paper: '#FFFFFF',     // Solid White Cards & Modals
    },
    text: {
      primary: '#111827',   // Primary Text on Light Background
      secondary: '#4B5563', // Muted Gray Text
      disabled: '#9CA3AF',
    },
    divider: '#E5E7EB',
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
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: 'none',
          padding: '8px 20px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
          },
        },
        containedPrimary: {
          backgroundColor: '#F59E0B',
          color: '#FFFFFF',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#D97706',
          },
        },
        outlinedPrimary: {
          backgroundColor: '#FFFFFF',
          borderColor: '#F59E0B',
          color: '#F59E0B',
          borderWidth: '1.5px',
          '&:hover': {
            backgroundColor: '#FEF3C7',
            borderColor: '#D97706',
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.12)',
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.12)',
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: '#111827',
          color: '#FFFFFF',
          borderBottom: '1px solid #1F2937',
        },
        body: {
          borderBottom: '1px solid #F3F4F6',
          color: '#111827',
        },
      },
    },
  },
});

export default theme;
