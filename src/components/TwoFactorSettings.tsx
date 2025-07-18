import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Close,
  Security,
  CheckCircle,
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';
import { Setup2FADisplay } from './Setup2FADisplay';

interface TwoFactorSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function TwoFactorSettings({ open, onClose }: TwoFactorSettingsProps) {
  const { user, completeSetup2FA } = useAuthReal();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const handleEnable2FA = async () => {
    if (!user?.twoFactorEnabled) {
      // Mostrar setup para usuarios que no tienen 2FA
      setShowSetup(true);
      return;
    }
  };

  const handleSetupComplete = async () => {
    setShowSetup(false);
    
    // Completar setup de 2FA
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await completeSetup2FA();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'Error al activar 2FA'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupCancel = () => {
    setShowSetup(false);
  };

  const handleClose = () => {
    setMessage(null);
    setShowSetup(false);
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          Autenticación de Dos Factores
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {showSetup ? (
          <Setup2FADisplay 
            onComplete={handleSetupComplete}
            onCancel={handleSetupCancel}
          />
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              La autenticación de dos factores proporciona una capa adicional de seguridad a tu cuenta.
            </Typography>
            
            {message && (
              <Alert severity={message.type} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: user?.twoFactorEnabled ? 'success.main' : 'grey.400' }}>
                {user?.twoFactorEnabled ? <CheckCircle /> : <Security />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">
                  Estado actual: {user?.twoFactorEnabled ? 'Habilitado' : 'Deshabilitado'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.twoFactorEnabled 
                    ? 'Tu cuenta está protegida con autenticación de dos factores'
                    : 'Tu cuenta usa solo contraseña para la autenticación'
                  }
                </Typography>
              </Box>
            </Box>

            {user?.twoFactorEnabled ? (
              // Usuario con 2FA ya habilitado - Solo informativo
              <Box sx={{ 
                p: 3, 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 2, 
                border: 1, 
                borderColor: 'success.main' 
              }}>
                <Typography variant="subtitle2" sx={{ 
                  color: 'success.main', 
                  mb: 1, 
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>
                  ✅ Autenticación de dos factores activa
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'text.primary', 
                  mb: 2,
                  lineHeight: 1.6
                }}>
                  Tu cuenta está protegida. El 2FA es obligatorio y no se puede deshabilitar por seguridad.
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'text.secondary',
                  fontStyle: 'italic'
                }}>
                  Usa tu aplicación autenticadora (Google Authenticator) para generar códigos de acceso.
                </Typography>
              </Box>
            ) : (
              // Usuario sin 2FA - Mostrar botón para habilitar
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                p: 3, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 2, 
                border: 1, 
                borderColor: 'warning.main' 
              }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'warning.main', 
                    fontWeight: 600,
                    fontSize: '1rem',
                    mb: 0.5
                  }}>
                    🔒 Habilitar autenticación de dos factores
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.primary',
                    lineHeight: 1.6
                  }}>
                    Requerido para proteger tu cuenta. Configura Google Authenticator.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleEnable2FA}
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  Configurar
                </Button>
              </Box>
            )}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Actualizando configuración...
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      {!showSetup && (
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cerrar
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
