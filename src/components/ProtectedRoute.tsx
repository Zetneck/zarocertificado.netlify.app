import React, { useState } from 'react';
import { Box, CircularProgress, Typography, ThemeProvider } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from './LoginForm';
import { TwoFactorVerification } from './TwoFactorVerification';
import { ThemeToggleFloating } from './ThemeToggleFloating';
import { lightTheme, darkTheme } from '../themes/theme';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | 'operator';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, session, isAuthenticated, isLoading, pendingVerification } = useAuth();
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const theme = mode === 'light' ? lightTheme : darkTheme;

  // Mostrar loading mientras se inicializa
  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)'
          }}
        >
          <ThemeToggleFloating mode={mode} toggleMode={toggleMode} />
          <CircularProgress size={50} />
          <Typography variant="body1" color="text.secondary">
            Verificando sesión...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // Si no hay sesión, mostrar login
  if (!session) {
    return (
      <ThemeProvider theme={theme}>
        <ThemeToggleFloating mode={mode} toggleMode={toggleMode} />
        <LoginForm />
      </ThemeProvider>
    );
  }

  // Si la sesión requiere 2FA, mostrar verificación
  if (pendingVerification && !session.isVerified) {
    return (
      <ThemeProvider theme={theme}>
        <ThemeToggleFloating mode={mode} toggleMode={toggleMode} />
        <TwoFactorVerification />
      </ThemeProvider>
    );
  }

  // Si no está autenticado completamente
  if (!isAuthenticated || !user) {
    return (
      <ThemeProvider theme={theme}>
        <ThemeToggleFloating mode={mode} toggleMode={toggleMode} />
        <LoginForm />
      </ThemeProvider>
    );
  }

  // Verificar permisos de rol si se especifica
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No tienes permisos para acceder a esta sección.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Rol requerido: <strong>{requiredRole}</strong> | Tu rol: <strong>{user.role}</strong>
        </Typography>
      </Box>
    );
  }

  // Si todo está bien, mostrar el contenido protegido
  return <>{children}</>;
}
