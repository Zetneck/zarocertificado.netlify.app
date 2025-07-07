import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  credits: number;
  phone?: string;
  department?: string;
  two_factor_enabled: boolean;
  created_at: string;
  last_login?: string;
  certificates_count: number;
}

interface NewUser {
  email: string;
  name: string;
  password: string;
  role: string;
  credits: number;
  phone: string;
  department: string;
}

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanelOverlay({ onBack }: AdminPanelProps) {
  const { user } = useAuthReal();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; userId: string } | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    name: '',
    password: '',
    role: 'user',
    credits: 10,
    phone: '',
    department: ''
  });

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-users');
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear usuario');
      }

      setSuccess('Usuario creado exitosamente');
      setOpenDialog(false);
      setNewUser({
        email: '',
        name: '',
        password: '',
        role: 'user',
        credits: 10,
        phone: '',
        department: ''
      });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, permanent: boolean = false) => {
    const confirmMessage = permanent 
      ? '¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE este usuario? Esta acción NO se puede deshacer y eliminará todos sus datos.'
      : '¿Estás seguro de que quieres eliminar este usuario? (Eliminación suave - se puede recuperar)';
      
    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const url = permanent 
        ? `/.netlify/functions/admin-users?id=${userId}&permanent=true`
        : `/.netlify/functions/admin-users?id=${userId}`;
        
      const response = await authenticatedFetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }

      const message = permanent 
        ? 'Usuario eliminado permanentemente'
        : 'Usuario eliminado exitosamente (eliminación suave)';
      setSuccess(message);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const updateUserCredits = async (userId: string, newCredits: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch('/.netlify/functions/admin-users', {
        method: 'PUT',
        body: JSON.stringify({ id: userId, credits: newCredits }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar créditos');
      }

      setSuccess('Créditos actualizados exitosamente');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadUsers();
    }
  }, [user, loadUsers]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        bgcolor: 'background.default',
        zIndex: 1300,
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="error">
          Solo los administradores pueden acceder a este panel.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      bgcolor: 'background.default',
      zIndex: 1300,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
          Panel de Administración
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadUsers}
          disabled={loading}
          size="small"
        >
          Actualizar
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          size="small"
        >
          Crear Usuario
        </Button>
        <Button
          variant="outlined"
          color="warning"
          onClick={() => window.open('/.netlify/functions/cleanup-deleted-users', '_blank')}
          size="small"
        >
          Gestionar Eliminados
        </Button>
      </Box>

      {/* Contenido */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {/* Alertas */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Tabla de usuarios */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Créditos</TableCell>
                <TableCell>Certificados</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell>{userItem.name}</TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={userItem.role} 
                      size="small" 
                      color={userItem.role === 'admin' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={userItem.credits}
                      onChange={(e) => {
                        const newCredits = parseInt(e.target.value) || 0;
                        updateUserCredits(userItem.id, newCredits);
                      }}
                      size="small"
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>{userItem.certificates_count}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => setMenuAnchor({ element: e.currentTarget, userId: userItem.id })}
                      size="small"
                      color="error"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Menú de opciones de eliminación */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem 
          onClick={() => {
            if (menuAnchor) {
              deleteUser(menuAnchor.userId, false);
              setMenuAnchor(null);
            }
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Eliminar (suave)</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuAnchor) {
              deleteUser(menuAnchor.userId, true);
              setMenuAnchor(null);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteForeverIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar permanentemente</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog para crear usuario */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Nombre"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={newUser.role}
                label="Rol"
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              >
                <MenuItem value="user">Usuario</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Créditos iniciales"
              type="number"
              value={newUser.credits}
              onChange={(e) => setNewUser(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            onClick={createUser} 
            variant="contained"
            disabled={!newUser.name || !newUser.email || !newUser.password}
          >
            Crear Usuario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
