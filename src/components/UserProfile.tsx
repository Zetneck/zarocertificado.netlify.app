import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Chip,
  IconButton
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  Phone,
  Email,
  Badge,
  CalendarToday,
  ArrowBack
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user, updateUserProfile } = useAuthReal();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await updateUserProfile(formData);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      setIsEditing(false);
    } catch {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || ''
    });
    setIsEditing(false);
    setMessage(null);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'user': return 'Usuario';
      case 'operator': return 'Operador';
      default: return role;
    }
  };

  const getRoleColor = (role: string): "error" | "primary" | "secondary" | "default" => {
    switch (role) {
      case 'admin': return 'error';
      case 'user': return 'primary';
      case 'operator': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person color="primary" />
          Mi Perfil
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

      <Card>
        <CardContent>
          {/* Header del perfil */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 3, 
                bgcolor: 'primary.main',
                fontSize: '2rem'
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  label={getRoleLabel(user?.role || '')}
                  color={getRoleColor(user?.role || '')}
                  size="small"
                />
                {user?.twoFactorEnabled && (
                  <Chip 
                    label="2FA Habilitado"
                    color="success"
                    size="small"
                  />
                )}
              </Box>
            </Box>

            <Box>
              {!isEditing ? (
                <Button
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                  variant="outlined"
                >
                  Editar
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<Save />}
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                  >
                    Guardar
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    variant="outlined"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Información personal */}
          <Typography variant="h6" gutterBottom>
            Información Personal
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <TextField
              fullWidth
              label="Nombre completo"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isEditing}
              InputProps={{
                startAdornment: <Badge color="action" sx={{ mr: 1 }} />
              }}
            />

            <TextField
              fullWidth
              label="Correo electrónico"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={!isEditing}
              InputProps={{
                startAdornment: <Email color="action" sx={{ mr: 1 }} />
              }}
            />

            <TextField
              fullWidth
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              disabled={!isEditing}
              InputProps={{
                startAdornment: <Phone color="action" sx={{ mr: 1 }} />
              }}
            />

            <TextField
              fullWidth
              label="Departamento"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              disabled={!isEditing}
              InputProps={{
                startAdornment: <Badge color="action" sx={{ mr: 1 }} />
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Información de la cuenta */}
          <Typography variant="h6" gutterBottom>
            Información de la Cuenta
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarToday color="action" />
                <Typography variant="body2" color="text.secondary">
                  Miembro desde: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarToday color="action" />
                <Typography variant="body2" color="text.secondary">
                  Último acceso: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Box>

            {/* Créditos eliminados */}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
