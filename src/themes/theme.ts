import { createTheme } from '@mui/material/styles';

// 🎨 TEMA MODERNO - PALETA VIBRANTE Y PROFESIONAL
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { 
      main: '#6366f1', // Índigo vibrante
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff'
    },
    secondary: { 
      main: '#06b6d4', // Cyan moderno
      light: '#22d3ee',
      dark: '#0891b2',
      contrastText: '#ffffff'
    },
    success: { 
      main: '#10b981', // Verde esmeralda
      light: '#34d399',
      dark: '#059669'
    },
    warning: { 
      main: '#f59e0b', // Ámbar dorado
      light: '#fbbf24',
      dark: '#d97706'
    },
    error: { 
      main: '#ef4444', // Rojo coral
      light: '#f87171',
      dark: '#dc2626'
    },
    background: { 
      default: '#f8fafc', // Gris claro suave
      paper: '#ffffff'
    },
    text: {
      primary: '#1e293b', // Gris azulado oscuro
      secondary: '#64748b' // Gris medio
    },
    divider: '#e2e8f0'
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 700,
      letterSpacing: '0.02em'
    }
  },
  shape: {
    borderRadius: 12
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  ]
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: '#818cf8', // Índigo claro
      light: '#a5b4fc',
      dark: '#6366f1',
      contrastText: '#ffffff'
    },
    secondary: { 
      main: '#22d3ee', // Cyan brillante
      light: '#67e8f9',
      dark: '#06b6d4',
      contrastText: '#000000'
    },
    success: { 
      main: '#34d399', // Verde menta
      light: '#6ee7b7',
      dark: '#10b981'
    },
    warning: { 
      main: '#fbbf24', // Amarillo dorado
      light: '#fcd34d',
      dark: '#f59e0b'
    },
    error: { 
      main: '#f87171', // Rojo suave
      light: '#fca5a5',
      dark: '#ef4444'
    },
    background: { 
      default: '#0f172a', // Azul marino profundo
      paper: '#1e293b' // Gris azulado oscuro
    },
    text: {
      primary: '#f1f5f9', // Blanco azulado
      secondary: '#cbd5e1' // Gris claro azulado
    },
    divider: '#334155'
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 700,
      letterSpacing: '0.02em'
    }
  },
  shape: {
    borderRadius: 12
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
    '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.5)'
  ]
});
