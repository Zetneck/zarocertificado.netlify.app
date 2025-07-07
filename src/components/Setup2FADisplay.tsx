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
      
      console.log('=== DEBUG FRONTEND ===');
      console.log('authToken exists:', !!authToken);
      console.log('tempToken exists:', !!tempToken);
      console.log('authToken preview:', authToken?.substring(0, 30) + '...');
      console.log('tempToken preview:', tempToken?.substring(0, 30) + '...');
      
      let response;
      
      if (authToken) {
        console.log('Trying with authToken...');
        // Usuario existente con token de autenticación
        response = await fetch('/.netlify/functions/debug-qr-token', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
      } else if (tempToken) {
        console.log('Trying with tempToken...');
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
      console.log('Debug response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error en debug');
      }

      // Si el debug es exitoso, intentar con la función real
      if (data.success) {
        console.log('Debug successful, trying real QR generation...');
        
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
          console.log('Real QR response:', realData);
          
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
      console.log('🔍 Completando setup 2FA con código:', verificationCode);
      
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
          console.log('🔄 Token expirado, regenerando QR...');
          setActiveStep(0);
          setVerificationCode('');
          setError('Tu sesión expiró. Regenerando código QR...');
          generateQR();
          return;
        }
        
        throw new Error(data.message || data.error || 'Error completando setup 2FA');
      }

      if (data.success) {
        console.log('✅ Setup 2FA completado exitosamente');
        console.log('📦 Datos recibidos:', { token: !!data.token, user: !!data.user });
        setActiveStep(3);
        
        // Actualizar localStorage con token final
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          console.log('✅ AuthToken guardado');
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('✅ Usuario guardado');
        }
        
        // Limpiar tokens temporales
        localStorage.removeItem('tempToken');
        localStorage.removeItem('tempUser');
        console.log('🧹 Tokens temporales eliminados');
        
        // Actualizar el contexto de autenticación
        try {
          await refreshUser();
          console.log('✅ Estado de autenticación actualizado');
        } catch (error) {
          console.error('⚠️ Error al actualizar estado:', error);
        }
        
        // Completar setup después de un breve delay para mostrar el éxito
        setTimeout(() => {
          console.log('🎯 Llamando onComplete...');
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
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="primary" />
        Configurar Autenticación en 2 Pasos
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress sx={{ mr: 2 }} />
          <Typography>Generando código QR...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button onClick={generateQR} size="small" sx={{ mt: 1 }}>
            Intentar de nuevo
          </Button>
        </Alert>
      )}

      {/* Paso 1: Mostrar QR y configuración */}
      {qrData && activeStep === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              📱 Configura tu aplicación autenticadora
            </Typography>
            <Typography variant="body2">
              Usa Google Authenticator, Microsoft Authenticator o cualquier app compatible con TOTP.
            </Typography>
          </Alert>

          <Paper elevation={3} sx={{ p: 2, textAlign: 'center', mb: 2, border: '2px solid', borderColor: 'primary.main' }}>
            <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <QrCode2 color="primary" />
              Escanea este código QR
            </Typography>
            
            <Box sx={{ display: 'inline-block', p: 1, backgroundColor: 'white', borderRadius: 2 }}>
              <Box
                component="img"
                src={qrData.qrCode} 
                alt="Código QR 2FA"
                sx={{
                  maxWidth: '180px',
                  height: 'auto',
                  display: 'block'
                }}
              />
            </Box>

            <Alert severity="info" sx={{ mt: 1, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                📱 Busca en tu app:
              </Typography>
              <Typography variant="body2">
                Después de escanear, aparecerá <strong>"Zaro Certificado"</strong> en tu Google Authenticator con un código de 6 dígitos.
              </Typography>
            </Alert>
          </Paper>

          {/* Botón principal más arriba */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
            <Button onClick={onCancel} variant="outlined" size="large">
              Cancelar
            </Button>
            <Button 
              onClick={() => setActiveStep(2)} 
              variant="contained"
              size="large"
              startIcon={<ArrowForward />}
              sx={{ 
                minWidth: 220,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)'
                  },
                  '70%': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)'
                  },
                  '100%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)'
                  }
                }
              }}
            >
              Ya escaneé el código
            </Button>
          </Box>

          {/* Sección colapsible para configuración manual */}
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Configuración manual (opcional)
            </Typography>
          </Divider>

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Clave secreta:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  flexGrow: 1, 
                  fontFamily: 'monospace', 
                  backgroundColor: 'action.hover',
                  p: 1,
                  borderRadius: 1,
                  wordBreak: 'break-all',
                  fontSize: '0.8rem'
                }}
              >
                {qrData.secret}
              </Typography>
              <IconButton onClick={copySecret} size="small" color="primary">
                {copied ? <CheckCircle color="success" /> : <ContentCopy />}
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Servicio: {qrData.serviceName} | Cuenta: {qrData.accountName}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Paso 2: Verificar código */}
      {qrData && activeStep === 2 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              🔐 Verifica tu configuración
            </Typography>
            <Typography variant="body2">
              Ingresa el código de 6 dígitos que aparece en tu aplicación autenticadora para completar la configuración.
            </Typography>
          </Alert>

          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="primary" />
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
              sx={{ mb: 2 }}
              error={!!verificationError}
              helperText={verificationError || 'Ingresa el código que aparece en tu app autenticadora'}
            />

            {verificationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
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
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Regenerar código QR
                  </Button>
                )}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => setActiveStep(1)} 
                variant="outlined"
                disabled={verifying}
              >
                Volver
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                variant="contained"
                disabled={verifying || verificationCode.length !== 6}
                startIcon={verifying ? <CircularProgress size={20} /> : <CheckCircle />}
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
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              🎉 ¡2FA Activado Exitosamente!
            </Typography>
            <Typography variant="body2">
              Tu cuenta ahora está protegida con autenticación de dos factores. Podrás acceder a la aplicación.
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
}
