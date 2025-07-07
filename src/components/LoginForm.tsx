import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';
import { useTheme } from '@mui/material/styles';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn, loading } = useAuthReal();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      const result = await signIn(email, password);
      
      // El ProtectedRoute manejará automáticamente la redirección
      // basándose en los estados del contexto de autenticación
      if (result?.success) {
        // Login successful
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      setError(error instanceof Error ? error.message : 'Error al iniciar sesión');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        overflow: 'hidden',
        background: theme.palette.mode === 'dark' 
          ? `
            linear-gradient(135deg, 
              #0f172a 0%, 
              #1e293b 25%, 
              #334155 50%, 
              #1e293b 75%, 
              #0f172a 100%
            ),
            radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
          `
          : `
            linear-gradient(135deg, 
              #f8fafc 0%, 
              #e2e8f0 25%, 
              #cbd5e1 50%, 
              #e2e8f0 75%, 
              #f8fafc 100%
            ),
            radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
          `,
        backgroundAttachment: 'fixed',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1, sm: 2 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(45deg, transparent 0%, rgba(99, 102, 241, 0.02) 50%, transparent 100%)'
            : 'linear-gradient(45deg, transparent 0%, rgba(99, 102, 241, 0.01) 50%, transparent 100%)',
          zIndex: 0,
          pointerEvents: 'none'
        }
      }}
    >
      <Container 
        maxWidth="sm" 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          width: '100%',
          maxWidth: { xs: '100%', sm: '400px', md: '450px' }
        }}
      >
        <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
          {/* Logo de Zaro */}
          <Box
            component="img"
            src="/Logo-Zaro.png"
            alt="Logo Zaro"
            sx={{
              height: { xs: 40, sm: 50, md: 60 },
              width: 'auto',
              maxWidth: { xs: '250px', sm: '300px' },
              objectFit: 'contain',
              filter: theme.palette.mode === 'dark' 
                ? 'brightness(1.1) drop-shadow(0 0 20px rgba(129, 140, 248, 0.4)) invert(0) contrast(1.1) saturate(1.2)' 
                : 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.2)) invert(1) contrast(1) saturate(1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              mb: { xs: 1, sm: 2 }
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
              letterSpacing: '-0.02em',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #818cf8, #22d3ee, #34d399)'
                : 'linear-gradient(45deg, #6366f1, #06b6d4, #10b981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: theme.palette.mode === 'dark' ? '0 0 30px rgba(129, 140, 248, 0.4)' : 'none',
              mb: { xs: 0.5, sm: 1 }
            }}
          >
            Certificados de Fumigación
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: { xs: 0.5, sm: 1 },
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Acceso seguro con autenticación 2FA
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Security color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
            <Typography 
              variant="body2" 
              color="primary.main" 
              fontWeight={600}
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Sistema Protegido
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          borderRadius: 3,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(129, 140, 248, 0.2)'
            : '0 25px 50px rgba(99, 102, 241, 0.1), 0 0 0 1px rgba(99, 102, 241, 0.1)',
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(129, 140, 248, 0.2)'
            : '1px solid rgba(99, 102, 241, 0.1)'
        }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              size={window.innerWidth < 600 ? "small" : "medium"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              size={window.innerWidth < 600 ? "small" : "medium"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size={window.innerWidth < 600 ? "small" : "medium"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2, 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size={window.innerWidth < 600 ? "medium" : "large"}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: { xs: 1.5, sm: 2 } }}>
            <Link 
              href="#" 
              variant="body2"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
