import React, { useEffect, useState } from 'react';
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
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '@mui/material/styles';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Recuperación de contraseña
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetInfo, setResetInfo] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  
  const { signIn, loading } = useAuthReal();
  const { isMobile } = useResponsive();
  const theme = useTheme();

  // Si llega ?token= en la URL, abrir el diálogo de confirmación
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      if (t) {
        setResetToken(t);
        setConfirmOpen(true);
      }
    } catch (err) {
      console.debug('No se pudo leer token de URL', err);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validaciones básicas
    if (!email || !password) {
      if (!email && !password) {
        setError('Por favor ingresa tu correo electrónico y contraseña');
      } else if (!email) {
        setFieldErrors({ email: 'El correo electrónico es requerido' });
      } else if (!password) {
        setFieldErrors({ password: 'La contraseña es requerida' });
      }
      return;
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldErrors({ email: 'Por favor ingresa un correo electrónico válido' });
      return;
    }

  try {
      const result = await signIn(email, password);
      
      // Si llegamos aquí, el login fue exitoso
      if (result?.success) {
        // Login exitoso - no necesita log
      }
  } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      const normalizedMessage = errorMessage.toLowerCase().trim();

      // Reset field errors
      const newFieldErrors: { email?: string; password?: string } = {};

      // Manejar diferentes tipos de errores con precisión
      if (normalizedMessage.includes('el correo no existe')) {
        newFieldErrors.email = 'Este correo no está registrado';
        setError('❌ El correo ingresado no existe.');
      } else if (normalizedMessage.includes('la contraseña es incorrecta')) {
        newFieldErrors.password = 'Contraseña incorrecta';
        setError('❌ La contraseña es incorrecta.');
      } else if (normalizedMessage.includes('credenciales incorrectas') ||
                 normalizedMessage.includes('credentials') ||
                 normalizedMessage.includes('invalid credentials')) {
        setError('❌ Correo electrónico o contraseña incorrectos. Por favor verifica tus datos.');
      } else if (normalizedMessage.includes('email y contraseña son requeridos') ||
                 normalizedMessage.includes('required')) {
        setError('📝 Por favor completa todos los campos requeridos.');
      } else if (normalizedMessage.includes('error interno del servidor') ||
                 normalizedMessage.includes('internal server error')) {
        setError('🔧 Error del servidor. Por favor intenta nuevamente en unos momentos.');
      } else if (normalizedMessage.includes('fetch') ||
                 normalizedMessage.includes('network') ||
                 normalizedMessage.includes('conexión')) {
        setError('🌐 Error de conexión. Por favor verifica tu internet e intenta nuevamente.');
      } else if (normalizedMessage.includes('bloqueado') ||
                 normalizedMessage.includes('suspendido') ||
                 normalizedMessage.includes('blocked')) {
        setError('🔒 Tu cuenta ha sido suspendida. Contacta al administrador.');
      } else {
        // Para cualquier otro error, mostrar el mensaje específico
        setError(`⚠️ ${errorMessage}`);
      }

      setFieldErrors(newFieldErrors);
      // Forzar foco visual en la alerta (sin snackbar)
      setTimeout(() => {
        const el = document.querySelector('[role="alert"]') as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
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
              onChange={(e) => {
                setEmail(e.target.value);
                // Limpiar errores cuando el usuario empiece a escribir
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: undefined }));
                }
                if (error) setError(null);
              }}
              margin="normal"
              size={isMobile ? "small" : "medium"}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color={fieldErrors.email ? "error" : "action"} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Limpiar errores cuando el usuario empiece a escribir
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: undefined }));
                }
                if (error) setError(null);
              }}
              margin="normal"
              size={isMobile ? "small" : "medium"}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color={fieldErrors.password ? "error" : "action"} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size={isMobile ? "small" : "medium"}
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
                variant="outlined"
                sx={(theme) => ({ 
                  mt: 2, 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  borderColor: theme.palette.error.light,
                  backgroundColor: theme.palette.common.white,
                  color: theme.palette.error.main,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  borderRadius: 2,
                  '& .MuiAlert-icon': { color: theme.palette.error.main },
                  '& .MuiAlert-message': { width: '100%' }
                })}
                onClose={() => setError(null)}
              >
                <Box>
                  {error}
                  {error.includes('❌ Correo electrónico o contraseña incorrectos') && (
                    <Box sx={{ mt: 1, fontSize: '0.85em', opacity: 0.8 }}>
                      💡 Consejos:
                      <br />• Verifica que el correo esté escrito correctamente
                      <br />• Asegúrate de que la contraseña sea la correcta
                      <br />• Revisa si tienes activado Caps Lock
                    </Box>
                  )}
                </Box>
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size={isMobile ? "medium" : "large"}
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
              onClick={(e) => { e.preventDefault(); setResetOpen(true); setResetInfo(null); }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>
        </Paper>
      </Container>
      {/* Dialog solicitar reset */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle>Recuperar contraseña</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Correo electrónico"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            sx={{ mt: 1 }}
          />
          {resetInfo && <Alert severity="info" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{resetInfo}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cerrar</Button>
          <Button color="secondary" onClick={() => { setConfirmOpen(true); setResetOpen(false); }}>Tengo un token</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const resp = await fetch('/.netlify/functions/request-password-reset', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: resetEmail })
                });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || 'Error al solicitar recuperación');
                // Solo mostrar resetUrl en desarrollo local
                if (data.resetUrl && window.location.hostname === 'localhost') {
                  setResetInfo(`Enlace de prueba (solo desarrollo local):\n${data.resetUrl}\n\nCopia el token de la URL para el siguiente paso.`);
                } else {
                  setResetInfo('Se han enviado las instrucciones de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y spam.');
                }
              } catch (err) {
                console.debug('Solicitud de recuperación fallida', err);
                setResetInfo('Se han enviado las instrucciones de recuperación a tu correo electrónico si la cuenta existe. Revisa tu bandeja de entrada y spam.');
              }
            }}
          >
            Enviar enlace
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmar reset */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Restablecer contraseña</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Token"
            value={resetToken}
            onChange={(e) => setResetToken(e.target.value)}
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            label="Nueva contraseña"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cerrar</Button>
          <Button
            variant="contained"
            disabled={newPassword.length < 6 || !resetToken}
            onClick={async () => {
              try {
                const resp = await fetch('/.netlify/functions/confirm-password-reset', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: resetToken, password: newPassword })
                });
                const data = await resp.json();
                if (!resp.ok || !data.success) throw new Error(data.error || 'Error al restablecer');
                setConfirmOpen(false);
                alert('Contraseña actualizada. Ya puedes iniciar sesión.');
                // Limpiar token de la URL si venía en query
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('token');
                  window.history.replaceState({}, '', url.toString());
                } catch (err2) {
                  console.debug('No se pudo limpiar el token de la URL', err2);
                }
              } catch (err) {
                console.debug('Confirmación de reset fallida', err);
                alert('No se pudo restablecer la contraseña. Verifica el token.');
              }
            }}
          >
            Restablecer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
