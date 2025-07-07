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
      // Intentar primero con authToken, luego con tempToken
      const authToken = localStorage.getItem('authToken');
      const tempToken = localStorage.getItem('tempToken');
      
      // Token validation...
      
      let response;
      
      if (authToken) {
        // Using authToken...
        // Usuario existente con token de autenticación
        response = await fetch('/.netlify/functions/debug-qr-token', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
      } else if (tempToken) {
        // Using tempToken...
        // Usuario nuevo con token temporal
        response = await fetch('/.netlify/functions/debug-qr-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tempToken }),
        });
      } else {
        throw new Error('No hay token de autenticación disponible');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error en debug');
      }

      // Si el debug es exitoso, intentar con la función real
      if (data.success) {
        
        let realResponse;
        if (authToken) {
          realResponse = await fetch('/.netlify/functions/generate-2fa-qr', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });
        } else if (tempToken) {
          realResponse = await fetch('/.netlify/functions/generate-2fa-qr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tempToken }),
          });
        }

        if (realResponse) {
          const realData = await realResponse.json();
          
          if (realResponse.ok) {
            setQrData(realData);
            setActiveStep(1);
          } else {
            throw new Error(realData.message || realData.error || 'Error generando QR real');
          }
        }
      }

    } catch (error) {
      console.error('Error generando QR:', error);
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
      
      const tempToken = localStorage.getItem('tempToken');
      if (!tempToken) {
        throw new Error('Sesión expirada. Inicia sesión nuevamente.');
      }

      // Llamar a la función para completar el setup
      const response = await fetch('/.netlify/functions/complete-2fa-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: verificationCode.trim(), 
          tempToken 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error del servidor:', data);
        
        // Si el token expiró, regenerar el QR
        if (data.error?.includes('Token temporal') || data.error?.includes('inválido') || data.error?.includes('expirado')) {
          // Token expired, regenerating...
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
    <Box sx={{ maxHeight: '80vh', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="primary" />
        Configurar Autenticación en 2 Pasos
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
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
            
            <Box sx={{ display: 'inline-block', p: 0.5, backgroundColor: 'white', borderRadius: 1 }}>
              <Box
                component="img"
                src={qrData.qrCode} 
                alt="Código QR 2FA"
                sx={{
                  maxWidth: '140px',
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
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 2 }}>
            <Button onClick={onCancel} variant="outlined" size="medium">
              Cancelar
            </Button>
            <Button 
              onClick={() => setActiveStep(2)} 
              variant="contained"
              size="medium"
              startIcon={<ArrowForward />}
              sx={{ 
                minWidth: 180,
                py: 1,
                fontSize: '0.9rem',
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
          <Alert severity="info" sx={{ mb: 2, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              🔐 Verifica tu configuración
            </Typography>
            <Typography variant="caption">
              Ingresa el código de 6 dígitos de tu aplicación autenticadora.
            </Typography>
          </Alert>

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="primary" fontSize="small" />
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
              sx={{ mb: 1.5 }}
              error={!!verificationError}
              helperText={verificationError || 'Código de tu app autenticadora'}
              size="small"
            />

            {verificationError && (
              <Alert severity="error" sx={{ mb: 1.5 }}>
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
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    Regenerar código QR
                  </Button>
                )}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => setActiveStep(1)} 
                variant="outlined"
                disabled={verifying}
                size="small"
              >
                Volver
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                variant="contained"
                disabled={verifying || verificationCode.length !== 6}
                startIcon={verifying ? <CircularProgress size={16} /> : <CheckCircle />}
                size="small"
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
          <Alert severity="success" sx={{ mb: 2, py: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              🎉 ¡2FA Activado!
            </Typography>
            <Typography variant="body2">
              Tu cuenta está protegida. Accediendo a la aplicación...
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
}
