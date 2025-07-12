import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'No autorizado. Inicia sesión nuevamente.' });
        return;
      }

      const response = await fetch('/.netlify/functions/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Contraseña cambiada exitosamente' });
        // Limpiar campos después del éxito
        setTimeout(() => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          onClose();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al cambiar la contraseña' });
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setMessage({ type: 'error', text: 'Error de conexión. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cambiar Contraseña</DialogTitle>
      <DialogContent>
        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}
        <TextField
          label="Contraseña actual"
          type="password"
          fullWidth
          margin="normal"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={loading}
          helperText="Ingresa tu contraseña actual para verificar tu identidad"
        />
        <TextField
          label="Nueva contraseña"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
          helperText="Mínimo 6 caracteres"
        />
        <TextField
          label="Confirmar nueva contraseña"
          type="password"
          fullWidth
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          error={confirmPassword.length > 0 && newPassword !== confirmPassword}
          helperText={
            confirmPassword.length > 0 && newPassword !== confirmPassword 
              ? "Las contraseñas no coinciden" 
              : "Confirma tu nueva contraseña"
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleChangePassword}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          variant="contained"
          color="primary"
        >
          {loading ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
