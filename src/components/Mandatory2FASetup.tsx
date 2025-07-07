import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Security,
  Warning,
  Smartphone
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuthReal } from '../hooks/useAuthReal';
import { Setup2FADisplay } from './Setup2FADisplay';

export function Mandatory2FASetup() {
  const [showSetup, setShowSetup] = useState(false);
  const { user, signOut } = useAuthReal();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const theme = useTheme();

  const handleStartSetup = () => {
    setShowSetup(true);
  };

  const handleSetupComplete = async () => {
    console.log('🎉 Setup 2FA completado exitosamente');
    setShowSetup(false);
    setLoading(true);
    setMessage({
      type: 'success',
      text: '2FA configurado exitosamente. Redirigiendo a la aplicación...'
    });
    
    // Verificar que tengamos el token de autenticación actualizado
    const authToken = localStorage.getItem('authToken');
    console.log('✅ AuthToken después del setup:', !!authToken);
    
    // Recargar inmediatamente para actualizar el estado de autenticación
    setTimeout(() => {
      console.log('🔄 Recargando página para actualizar estado...');
      window.location.reload();
    }, 1000);
  };

  const handleSetupCancel = () => {
    setShowSetup(false);
  };

  if (showSetup) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Container maxWidth="md">
          <Paper sx={{ 
            p: 4, 
            borderRadius: 3,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(30, 41, 59, 0.95)' 
              : 'rgba(248, 250, 252, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 25px 50px rgba(0, 0, 0, 0.5)'
              : '0 25px 50px rgba(99, 102, 241, 0.1)'
          }}>
            <Setup2FADisplay 
              onComplete={handleSetupComplete}
              onCancel={handleSetupCancel}
            />
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        {/* Logo de Zaro */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/Logo-Zaro.png"
            alt="Logo Zaro"
            sx={{
              height: { xs: 50, sm: 60 },
              width: 'auto',
              maxWidth: '250px',
              objectFit: 'contain',
              filter: theme.palette.mode === 'dark' 
                ? 'brightness(1.1) drop-shadow(0 0 20px rgba(129, 140, 248, 0.4))' 
                : 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.2))',
              mb: 2
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </Box>

        <Paper sx={{ 
          p: 4, 
          borderRadius: 3,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 25px 50px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px rgba(99, 102, 241, 0.1)'
        }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar sx={{ 
              bgcolor: 'warning.main', 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2 
            }}>
              <Warning sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              mb: 1,
              background: 'linear-gradient(45deg, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Configuración Requerida
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Autenticación de Dos Factores
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              🔒 Configuración de seguridad obligatoria
            </Typography>
            <Typography variant="body2">
              Para proteger tu cuenta, es necesario configurar la autenticación de dos factores (2FA) antes de continuar.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="primary" />
              ¿Qué necesitas?
            </Typography>
            
            <Box sx={{ pl: 4 }}>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Smartphone sx={{ fontSize: 20 }} color="primary" />
                Una aplicación autenticadora en tu teléfono
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3, mb: 2 }}>
                Como Google Authenticator, Microsoft Authenticator, etc.
              </Typography>
            </Box>
          </Box>

          {message && (
            <Alert severity={message.type} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          {loading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
                Configurando seguridad...
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={signOut}
              disabled={loading}
            >
              Cerrar Sesión
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartSetup}
              disabled={loading}
              startIcon={<Security />}
              sx={{ minWidth: 200 }}
            >
              Configurar 2FA Ahora
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mt: 3 
          }}>
            Usuario: {user?.email}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
