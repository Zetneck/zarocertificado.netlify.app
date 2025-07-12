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

    setLoading(true);
    setMessage(null);

    try {
      // Simular llamada al backend para cambiar la contraseña
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setMessage({ type: 'success', text: 'Contraseña cambiada exitosamente' });
    } catch {
      setMessage({ type: 'error', text: 'Error al cambiar la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cambiar Contraseña</DialogTitle>
      <DialogContent>
        {message && <Alert severity={message.type}>{message.text}</Alert>}
        <TextField
          label="Contraseña actual"
          type="password"
          fullWidth
          margin="normal"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <TextField
          label="Nueva contraseña"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <TextField
          label="Confirmar nueva contraseña"
          type="password"
          fullWidth
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          onClick={handleChangePassword}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
        >
          {loading ? <CircularProgress size={24} /> : 'Cambiar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
