import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  Security,
  Smartphone,
  Email,
  Message,
  Shield,
  Warning,
  Download,
  Close
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

interface TwoFactorSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function TwoFactorSettings({ open, onClose }: TwoFactorSettingsProps) {
  const { user, twoFactorMethods, enableTwoFactor, disableTwoFactor, generateBackupCodes } = useAuth();
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [qrSecret, setQrSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleEnableMethod = async (methodId: string) => {
    setSelectedMethod(methodId);
    setShowEnableDialog(true);
    setError(null);

    if (methodId === 'authenticator') {
      const result = await enableTwoFactor(methodId);
      if (result.success && result.secret) {
        setQrSecret(result.secret);
      } else {
        setError(result.error || 'Error al generar código QR');
      }
    }
  };

  const confirmEnable = async () => {
    if (!selectedMethod) return;

    const result = await enableTwoFactor(selectedMethod);
    if (result.success) {
      setShowEnableDialog(false);
      setQrSecret(null);
      setSelectedMethod(null);
    } else {
      setError(result.error || 'Error al habilitar 2FA');
    }
  };

  const handleDisable = async () => {
    const result = await disableTwoFactor(password);
    if (result.success) {
      setShowDisableDialog(false);
      setPassword('');
    } else {
      setError(result.error || 'Error al deshabilitar 2FA');
    }
  };

  const handleGenerateBackupCodes = async () => {
    const result = await generateBackupCodes();
    if (result.success && result.codes) {
      setBackupCodes(result.codes);
    } else {
      setError(result.error || 'Error al generar códigos');
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          <Typography variant="h6">Autenticación de Dos Factores</Typography>
        </Box>
        <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1 }}>
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent>
        {/* Estado actual */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">
                  Estado: {user?.twoFactorEnabled ? 'Habilitado' : 'Deshabilitado'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.twoFactorEnabled 
                    ? 'Tu cuenta está protegida con 2FA' 
                    : 'Mejora la seguridad habilitando 2FA'
                  }
                </Typography>
              </Box>
              <Switch
                checked={user?.twoFactorEnabled || false}
                onChange={() => user?.twoFactorEnabled ? setShowDisableDialog(true) : handleEnableMethod('authenticator')}
                color="primary"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Métodos disponibles */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Métodos de Verificación
            </Typography>
            <List>
              {twoFactorMethods.map((method) => (
                <ListItem key={method.id}>
                  <ListItemIcon>
                    {method.type === 'authenticator' && <Smartphone />}
                    {method.type === 'email' && <Email />}
                    {method.type === 'sms' && <Message />}
                  </ListItemIcon>
                  <ListItemText
                    primary={method.name}
                    secondary={method.description}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant={method.enabled ? 'contained' : 'outlined'}
                      onClick={() => handleEnableMethod(method.id)}
                      disabled={user?.twoFactorEnabled}
                    >
                      {method.enabled ? 'Configurado' : 'Configurar'}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Códigos de respaldo */}
        {user?.twoFactorEnabled && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield color="warning" />
                Códigos de Respaldo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Genera códigos de respaldo para acceder a tu cuenta si pierdes tu dispositivo.
              </Typography>
              
              <Button
                variant="outlined"
                onClick={handleGenerateBackupCodes}
                startIcon={<Download />}
                sx={{ mb: 2 }}
              >
                Generar Códigos de Respaldo
              </Button>

              {backupCodes.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Guarda estos códigos en un lugar seguro. Cada código solo puede usarse una vez.
                  </Alert>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: 1,
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    fontFamily: 'monospace'
                  }}>
                    {backupCodes.map((code, index) => (
                      <Typography key={index} variant="body2">
                        {index + 1}. {code}
                      </Typography>
                    ))}
                  </Box>
                  <Button
                    size="small"
                    onClick={downloadBackupCodes}
                    startIcon={<Download />}
                    sx={{ mt: 1 }}
                  >
                    Descargar códigos
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Diálogo para habilitar 2FA */}
        <Dialog open={showEnableDialog} onClose={() => setShowEnableDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Habilitar Autenticación 2FA</DialogTitle>
          <DialogContent>
            {selectedMethod === 'authenticator' && qrSecret && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Escanea este código QR con tu app autenticadora:
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'white', display: 'inline-block', borderRadius: 1 }}>
                  {/* Placeholder para QR Code */}
                  <Box sx={{ width: 200, height: 200, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2">Código QR</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 2, fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                  Clave secreta: {qrSecret}
                </Typography>
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEnableDialog(false)}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={confirmEnable}>
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para deshabilitar 2FA */}
        <Dialog open={showDisableDialog} onClose={() => setShowDisableDialog(false)}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Deshabilitar 2FA
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Esto reducirá la seguridad de tu cuenta. ¿Estás seguro?
            </Alert>
            <TextField
              fullWidth
              type="password"
              label="Confirma tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDisableDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={handleDisable}
              disabled={!password}
            >
              Deshabilitar
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>

      <DialogActions>
        <Button startIcon={<Close />} onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
