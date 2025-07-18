import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Button,
  Divider,
  Stepper,
  Step,
  StepLabel,
  TextField
} from '@mui/material';
import {
  ContentCopy,
  CheckCircle,
  QrCode2,
  Security,
  ArrowForward
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';
import { useResponsive } from '../hooks/useResponsive';

interface QRData {
  success: boolean;
  qrCode: string;
  secret: string;
  manual: string;
  serviceName: string;
  accountName: string;
  instructions: string[];
}

interface Setup2FADisplayProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function Setup2FADisplay({ onComplete, onCancel }: Setup2FADisplayProps) {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Estados para verificación del código
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Hook de autenticación para refresh
  const { refreshUser } = useAuthReal();
  const { isMobile } = useResponsive();

  const steps = [
    'Generar código QR',
    'Configurar aplicación',
    'Completar activación'
  ];

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener tokens disponibles
      const authToken = localStorage.getItem('authToken');
      const tempToken = localStorage.getItem('tempToken');
      
      console.log('🔍 Tokens disponibles:', { 
        hasAuth: !!authToken, 
        hasTemp: !!tempToken 
      });
      
      let response;
      
      if (authToken) {
        // Usuario existente con token de autenticación
        console.log('🔑 Usando authToken para generar QR');
        response = await fetch('/.netlify/functions/generate-2fa-qr', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
      } else if (tempToken) {
        // Usuario nuevo con token temporal
        console.log('🔑 Usando tempToken para generar QR');
        response = await fetch('/.netlify/functions/generate-2fa-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tempToken }),
        });
      } else {
        throw new Error('No hay token de autenticación disponible');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ QR generado exitosamente');
        setQrData(data);
        setActiveStep(1);
      } else {
        throw new Error(data.message || 'Error generando código QR');
      }

    } catch (error) {
      console.error('❌ Error generando QR:', error);
      setError(error instanceof Error ? error.message : 'Error generando código QR');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    if (qrData?.secret) {
      await navigator.clipboard.writeText(qrData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Ingresa un código de 6 dígitos');
      return;
    }

    setVerifying(true);
    setVerificationError(null);    
    
    try {
      const authToken = localStorage.getItem('authToken');
      const tempToken = localStorage.getItem('tempToken');
      
      console.log('🔍 Verificando código 2FA:', { 
        hasAuth: !!authToken, 
        hasTemp: !!tempToken,
        codeLength: verificationCode.length
      });

      if (!authToken && !tempToken) {
        throw new Error('Sesión expirada. Inicia sesión nuevamente.');
      }

      // Llamar a la función para completar el setup
      const response = await fetch('/.netlify/functions/complete-2fa-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: verificationCode.trim(), 
          tempToken: tempToken || undefined,
          authToken: authToken || undefined
        }),
      });

      // Verificar si la respuesta es HTML en lugar de JSON (error de servidor)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ El servidor devolvió HTML en lugar de JSON');
        throw new Error('Error del servidor. Verifica la conexión.');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error del servidor:', data);
        
        // Si el token expiró, regenerar el QR
        if (data.error?.includes('Token temporal') || 
            data.error?.includes('inválido') || 
            data.error?.includes('expirado')) {
          setActiveStep(0);
          setVerificationCode('');
          setError('Tu sesión expiró. Regenerando código QR...');
          generateQR();
          return;
        }
        
        throw new Error(data.message || data.error || 'Error completando setup 2FA');
      }

      if (data.success) {
        // Setup completed successfully
        setActiveStep(3);
        
        // Actualizar localStorage con token final
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Limpiar tokens temporales
        localStorage.removeItem('tempToken');
        localStorage.removeItem('tempUser');
        
        // Actualizar el contexto de autenticación
        try {
          await refreshUser();
        } catch (error) {
          console.error('⚠️ Error al actualizar estado:', error);
        }
        
        // Completar setup después de un breve delay para mostrar el éxito
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Error completando setup 2FA:', error);
      setVerificationError(error instanceof Error ? error.message : 'Error en verificación');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box sx={{ maxHeight: { xs: '80vh', sm: '80vh' }, overflow: 'auto' }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: { xs: 1, sm: 1 }, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}
      >
        <Security color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        Configurar Autenticación en 2 Pasos
      </Typography>

      <Stepper 
        activeStep={activeStep} 
        sx={{ 
          mb: { xs: 1.5, sm: 2 },
          '& .MuiStepLabel-label': {
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={2}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Generando código QR...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
          <Button onClick={generateQR} size="small" sx={{ mt: 0.5 }}>
            Intentar de nuevo
          </Button>
        </Alert>
      )}

      {/* Paso 1: Mostrar QR y configuración */}
      {qrData && activeStep === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 1.5, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              📱 Configura tu aplicación autenticadora
            </Typography>
            <Typography variant="caption">
              Usa Google Authenticator, Microsoft Authenticator o cualquier app TOTP.
            </Typography>
          </Alert>

          <Paper elevation={2} sx={{ p: 1.5, textAlign: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <QrCode2 color="primary" fontSize="small" />
              Escanea este código QR
            </Typography>
            
            <Box sx={{ 
              display: 'inline-block', 
              p: 0.5, 
              backgroundColor: 'white', 
              borderRadius: 1 
            }}>
              <Box
                component="img"
                src={qrData.qrCode} 
                alt="Código QR 2FA"
                sx={{
                  maxWidth: { xs: '120px', sm: '140px' },
                  height: 'auto',
                  display: 'block'
                }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Aparecerá como <strong>"Zaro Certificado"</strong> en tu app
            </Typography>
          </Paper>

          {/* Botón principal más compacto */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 1.5 }, 
            justifyContent: 'center', 
            mb: 2,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button 
              onClick={onCancel} 
              variant="outlined" 
              size={isMobile ? "small" : "medium"}
              sx={{ 
                order: { xs: 2, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.9rem' }
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => setActiveStep(2)} 
              variant="contained"
              size={isMobile ? "small" : "medium"}
              startIcon={<ArrowForward sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />}
              sx={{ 
                order: { xs: 1, sm: 2 },
                minWidth: { xs: 'auto', sm: 180 },
                py: { xs: 0.8, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                fontWeight: 600
              }}
            >
              Ya escaneé el código
            </Button>
          </Box>

          {/* Sección colapsible para configuración manual */}
          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Configuración manual (opcional)
            </Typography>
          </Divider>

          <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Clave secreta:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  flexGrow: 1, 
                  fontFamily: 'monospace', 
                  backgroundColor: 'action.hover',
                  p: 0.5,
                  borderRadius: 0.5,
                  wordBreak: 'break-all',
                  fontSize: '0.7rem'
                }}
              >
                {qrData.secret}
              </Typography>
              <IconButton onClick={copySecret} size="small" color="primary">
                {copied ? <CheckCircle color="success" fontSize="small" /> : <ContentCopy fontSize="small" />}
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {qrData.serviceName} | {qrData.accountName}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Paso 2: Verificar código */}
      {qrData && activeStep === 2 && (
        <Box>
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2, 
              py: 1,
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600, 
                mb: 0.5,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              🔐 Verifica tu configuración
            </Typography>
            <Typography 
              variant="caption"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              Ingresa el código de 6 dígitos de tu aplicación autenticadora.
            </Typography>
          </Alert>

          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <Typography 
              variant="subtitle2" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: { xs: '0.85rem', sm: '0.9rem' }
              }}
            >
              <Security 
                color="primary" 
                sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}
              />
              Código de verificación
            </Typography>
            
            <TextField
              fullWidth
              label="Código de 6 dígitos"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
                setVerificationError(null);
              }}
              placeholder="123456"
              inputProps={{ maxLength: 6 }}
              disabled={verifying}
              sx={{ 
                mb: 1.5,
                '& .MuiInputBase-input': {
                  textAlign: 'center',
                  fontSize: { xs: '1.1rem', sm: '1.2rem' },
                  letterSpacing: '0.2rem'
                }
              }}
              error={!!verificationError}
              helperText={verificationError || 'Código de tu app autenticadora'}
              size={isMobile ? "small" : "medium"}
              FormHelperTextProps={{
                sx: { 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  textAlign: 'center'
                }
              }}
            />

            {verificationError && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 1.5,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                {verificationError}
                {verificationError.includes('Token') && (
                  <Button
                    size="small"
                    onClick={() => {
                      setActiveStep(0);
                      setVerificationCode('');
                      setError(null);
                      generateQR();
                    }}
                    sx={{ 
                      mt: 0.5, 
                      display: 'block',
                      fontSize: { xs: '0.7rem', sm: '0.8rem' }
                    }}
                  >
                    Regenerar código QR
                  </Button>
                )}
              </Alert>
            )}

            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1, sm: 1.5 }, 
              justifyContent: 'flex-end',
              flexDirection: { xs: 'column-reverse', sm: 'row' }
            }}>
              <Button 
                onClick={() => setActiveStep(1)} 
                variant="outlined"
                disabled={verifying}
                size={isMobile ? "small" : "medium"}
                sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
              >
                Volver
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                variant="contained"
                disabled={verifying || verificationCode.length !== 6}
                startIcon={verifying ? <CircularProgress size={16} /> : <CheckCircle />}
                size={isMobile ? "small" : "medium"}
                sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
              >
                {verifying ? 'Verificando...' : 'Activar 2FA'}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Paso 3: Completado */}
      {activeStep === 3 && (
        <Box textAlign="center">
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2, 
              py: 1,
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            <Typography 
              variant="subtitle1" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
            >
              🎉 ¡2FA Activado!
            </Typography>
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Tu cuenta está protegida. Accediendo a la aplicación...
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
}
