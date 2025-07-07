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
  const { user } = useAuthReal();
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          Autenticación de Dos Factores
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          La autenticación de dos factores proporciona una capa adicional de seguridad a tu cuenta.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Esta funcionalidad estará disponible próximamente.
        </Alert>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
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
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
