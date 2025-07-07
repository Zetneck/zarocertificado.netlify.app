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
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Close,
  Security,
  CheckCircle,
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';

interface TwoFactorSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function TwoFactorSettings({ open, onClose }: TwoFactorSettingsProps) {
  const { user, toggleTwoFactor } = useAuthReal();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle2FA = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await toggleTwoFactor();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'Error al cambiar la configuración de 2FA'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage(null);
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

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box>
            <Typography variant="subtitle2">
              {user?.twoFactorEnabled ? 'Deshabilitar' : 'Habilitar'} autenticación de dos factores
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.twoFactorEnabled 
                ? 'Desactivar la protección adicional de tu cuenta'
                : 'Activar una capa adicional de seguridad'
              }
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={user?.twoFactorEnabled || false}
                onChange={handleToggle2FA}
                disabled={loading}
              />
            }
            label=""
          />
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2">
              Actualizando configuración...
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
