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
  Chip
} from '@mui/material';
import {
  Security,
  ArrowBack,
  CheckCircle,
  Smartphone
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';
import { useTheme } from '@mui/material/styles';

export function TwoFactorVerification() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { signOut, verifyTwoFactor } = useAuthReal();
  
  const theme = useTheme();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      setIsVerifying(false);
      return;
    }

    const result = await verifyTwoFactor(code);
    
    if (!result.success) {
      setError(result.message || 'Código incorrecto');
    }
    // Si es exitoso, el contexto maneja la autenticación automáticamente
    
    setIsVerifying(false);
  };

  const handleCodeChange = (value: string) => {
    // Solo permitir números y máximo 6 dígitos
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
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
        p: 2,
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
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          {/* Logo de Zaro */}
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
                ? 'brightness(1.1) drop-shadow(0 0 20px rgba(129, 140, 248, 0.4)) invert(0) contrast(1.1) saturate(1.2)' 
                : 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.2)) invert(1) contrast(1) saturate(1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              mb: 2
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
              fontSize: { xs: '1.5rem', sm: '1.8rem' },
              letterSpacing: '-0.02em',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #818cf8, #22d3ee, #34d399)'
                : 'linear-gradient(45deg, #6366f1, #06b6d4, #10b981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: theme.palette.mode === 'dark' ? '0 0 30px rgba(129, 140, 248, 0.4)' : 'none',
              mb: 1
            }}
          >
            Verificación en 2 pasos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            Ingresa el código de verificación
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Security color="primary" />
            <Typography variant="body2" color="primary.main" fontWeight={600}>
              Paso 2 de 2
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ 
          p: { xs: 3, sm: 4 }, 
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
          {/* Método de verificación */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Smartphone />}
              size="large"
              sx={{ 
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Google Authenticator
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              🔐 Usa tu aplicación autenticadora
            </Typography>
            <Typography variant="body2">
              Abre Google Authenticator, Microsoft Authenticator u otra app TOTP e ingresa el código de 6 dígitos que aparece para esta cuenta.
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
              El código cambia cada 30 segundos
            </Typography>
          </Alert>

          <form onSubmit={handleVerify}>
            <TextField
              fullWidth
              label="Código TOTP"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="000000"
              slotProps={{
                input: {
                  style: { 
                    textAlign: 'center', 
                    fontSize: '1.5rem',
                    letterSpacing: '0.5rem'
                  },
                  inputMode: 'numeric'
                }
              }}
              margin="normal"
              autoFocus
              helperText="Ingresa el código de 6 dígitos de tu app autenticadora"
            />

            {/* Información sobre TOTP */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                💡 Los códigos TOTP se regeneran automáticamente cada 30 segundos
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isVerifying || code.length !== 6}
              startIcon={isVerifying ? <CircularProgress size={20} /> : <CheckCircle />}
              sx={{ mb: 2 }}
            >
              {isVerifying ? 'Verificando...' : 'Verificar código'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={signOut}
            >
              Volver al login
            </Button>
          </form>

          {/* Métodos alternativos */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ¿Problemas para recibir el código?
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip 
                label="Usar código de respaldo" 
                size="small" 
                variant="outlined"
                clickable 
              />
              <Chip 
                label="Contactar soporte" 
                size="small" 
                variant="outlined"
                clickable 
              />
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
