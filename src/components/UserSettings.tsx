import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  Alert,
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
  IconButton
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Palette,
  Download,
  DeleteForever,
  Warning,
  ArrowBack
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';

interface UserSettingsProps {
  onBack: () => void;
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export function UserSettings({ onBack, mode, toggleMode }: UserSettingsProps) {
  const { user, updateUserSettings, deleteAccount } = useAuthReal();
  const [settings, setSettings] = useState({
    emailNotifications: user?.settings?.emailNotifications ?? true,
    smsNotifications: user?.settings?.smsNotifications ?? false,
    autoSave: user?.settings?.autoSave ?? true
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSettingChange = async (setting: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    
    try {
      await updateUserSettings({ [setting]: value });
      setMessage({ type: 'success', text: 'Configuración actualizada' });
    } catch {
      setMessage({ type: 'error', text: 'Error al actualizar configuración' });
      // Revertir cambio en caso de error
      setSettings(prev => ({ ...prev, [setting]: !value }));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINAR') {
      return;
    }

    setLoading(true);
    try {
      await deleteAccount();
      setMessage({ type: 'success', text: 'Cuenta eliminada correctamente' });
      setShowDeleteDialog(false);
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar la cuenta' });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Simular exportación de datos
    const userData = {
      profile: user,
      settings: settings,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `zaro-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Datos exportados correctamente' });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings color="primary" />
          Configuración
        </Typography>
      </Box>

      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Configuración de Apariencia */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Palette color="primary" />
            Apariencia
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Palette />
              </ListItemIcon>
              <ListItemText 
                primary="Tema oscuro"
                secondary="Cambiar entre modo claro y oscuro"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={mode === 'dark'}
                  onChange={toggleMode}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Configuración de Notificaciones */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications color="primary" />
            Notificaciones
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText 
                primary="Notificaciones por email"
                secondary="Recibir alertas y actualizaciones por correo"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText 
                primary="Notificaciones SMS"
                secondary="Recibir alertas importantes por mensaje de texto"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.smsNotifications}
                  onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Configuración de Seguridad */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security color="primary" />
            Seguridad
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Security />
              </ListItemIcon>
              <ListItemText 
                primary="Autenticación de dos factores"
                secondary="Configurar 2FA para mayor seguridad"
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" size="small">
                  {user?.twoFactorEnabled ? 'Configurar' : 'Habilitar'}
                </Button>
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Security />
              </ListItemIcon>
              <ListItemText 
                primary="Cambiar contraseña"
                secondary="Actualizar tu contraseña de acceso"
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" size="small">
                  Cambiar
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Configuración General */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings color="primary" />
            General
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText 
                primary="Guardado automático"
                secondary="Guardar automáticamente los datos del formulario"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Download />
              </ListItemIcon>
              <ListItemText 
                primary="Exportar datos"
                secondary="Descargar una copia de todos tus datos"
              />
              <ListItemSecondaryAction>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={exportData}
                >
                  Exportar
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Zona de Peligro */}
      <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
            <Warning />
            Zona de Peligro
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estas acciones son irreversibles. Procede con cuidado.
          </Typography>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForever />}
            onClick={() => setShowDeleteDialog(true)}
          >
            Eliminar Cuenta
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de confirmación para eliminar cuenta */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>
          Eliminar Cuenta Permanentemente
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.
          </Alert>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Para confirmar la eliminación, escribe <strong>ELIMINAR</strong> en el campo de abajo:
          </Typography>
          
          <TextField
            fullWidth
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Escribe ELIMINAR"
            error={deleteConfirmation !== '' && deleteConfirmation !== 'ELIMINAR'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleteConfirmation !== 'ELIMINAR' || loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar Cuenta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
