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
  ListItemText,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Key as KeyIcon,
  ContentCopy as ContentCopyIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import { useAuthReal } from '../hooks/useAuthReal';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
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
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string>('');
  const [customPassword, setCustomPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    name: '',
    password: '',
    role: 'user',
  phone: '',
  department: ''
  });

  // Estado para gestionar eliminados (soft-deleted)
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [deletedError, setDeletedError] = useState('');
  const [deletedList, setDeletedList] = useState<Array<{ id: string; email: string; name: string; deleted_at?: string }>>([]);
  const [deletedCount, setDeletedCount] = useState<number>(0);

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

  const openResetDialog = (userId: string) => {
    setResetUserId(userId);
    setTempPassword('');
    setCustomPassword('');
    setShowPassword(false);
    setResetOpen(true);
  };

  const resetPassword = async (mode: 'generate' | 'custom') => {
    if (!resetUserId) return;
    setLoading(true);
    setError('');
    try {
  type ResetBody = { userId: string; customPassword?: string };
  const body: ResetBody = { userId: resetUserId };
      if (mode === 'custom') {
        if (customPassword.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        body.customPassword = customPassword;
      }

      const response = await authenticatedFetch('/.netlify/functions/admin-reset-password', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al restablecer contraseña');
      }
      setTempPassword(data.tempPassword as string);
      setSuccess('Contraseña restablecida. Puedes revelarla y copiarla.');
      setShowPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Sin gestión de créditos
  const loadDeletedUsers = useCallback(async () => {
    setDeletedLoading(true);
    setDeletedError('');
    try {
      const resp = await authenticatedFetch('/.netlify/functions/cleanup-deleted-users');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al consultar eliminados');
      const list = (data.deleted_users || []) as Array<{ id: string; email: string; name: string; deleted_at?: string }>;
      setDeletedList(list);
      setDeletedCount(Number(data.deleted_users_count || list.length || 0));
    } catch (e) {
      setDeletedError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setDeletedLoading(false);
    }
  }, []);

  const executeCleanup = async () => {
    setDeletedLoading(true);
    setDeletedError('');
    try {
      // Ejecuta la limpieza definitiva (requiere token admin, lo agrega authenticatedFetch)
      const resp = await authenticatedFetch('/.netlify/functions/cleanup-deleted-users', { method: 'POST' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al limpiar usuarios eliminados');
      setSuccess(data.message || 'Limpieza ejecutada');
      // Refrescar lista
      await loadDeletedUsers();
      // Y refrescar usuarios activos
      await loadUsers();
    } catch (e) {
      setDeletedError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setDeletedLoading(false);
    }
  };

  const restoreDeletedUser = async (userId: string) => {
    setDeletedLoading(true);
    setDeletedError('');
    try {
      const resp = await authenticatedFetch(`/.netlify/functions/cleanup-deleted-users?id=${userId}`, { method: 'PATCH' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al restaurar usuario');
      setSuccess('Usuario restaurado');
      await loadDeletedUsers();
      await loadUsers();
    } catch (e) {
      setDeletedError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setDeletedLoading(false);
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
          onClick={() => { setDeletedOpen(true); void loadDeletedUsers(); }}
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
                  
                  <TableCell>{userItem.certificates_count}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => setMenuAnchor({ element: e.currentTarget, userId: userItem.id })}
                      size="small"
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
              openResetDialog(menuAnchor.userId);
              setMenuAnchor(null);
            }
          }}
        >
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Restablecer contraseña</ListItemText>
        </MenuItem>
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

      {/* Dialog de restablecer contraseña */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restablecer contraseña</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Las contraseñas no se pueden ver ni recuperar. Aquí podrás generar una nueva temporal o establecer una personalizada. Se mostrará una sola vez.
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Contraseña personalizada (opcional)"
              type={showPassword ? 'text' : 'password'}
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(s => !s)}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
              helperText="Mínimo 6 caracteres. O deja vacío para generar una segura."
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={() => resetPassword(customPassword ? 'custom' : 'generate')} disabled={loading}>
                {customPassword ? 'Establecer personalizada' : 'Generar nueva'}
              </Button>
              <Button variant="text" onClick={() => { setCustomPassword(''); setTempPassword(''); }} disabled={loading}>Limpiar</Button>
            </Box>

            {tempPassword && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Nueva contraseña temporal</Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  value={tempPassword}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => setShowPassword(s => !s)}>
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        <IconButton onClick={() => navigator.clipboard.writeText(tempPassword)}>
                          <ContentCopyIcon />
                        </IconButton>
                      </Box>
                    )
                  }}
                />
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Guarda o comparte esta contraseña ahora. No volverá a mostrarse.
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog gestionar eliminados */}
      <Dialog open={deletedOpen} onClose={() => setDeletedOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gestionar usuarios eliminados</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Aquí se listan los usuarios eliminados (soft-delete). Puedes ejecutar una limpieza definitiva.
          </Alert>
          {deletedError && <Alert severity="error" sx={{ mb: 2 }}>{deletedError}</Alert>}
          {deletedLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Total eliminados: {deletedCount}
              </Typography>
              {deletedList.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No hay usuarios eliminados.</Typography>
              ) : (
                <List dense>
                  {deletedList.map((u, idx) => (
                    <>
                      <ListItem key={u.id}
                        secondaryAction={
                          <Button size="small" variant="outlined" onClick={() => restoreDeletedUser(u.id)} disabled={deletedLoading}>
                            Restaurar
                          </Button>
                        }
                      >
                        <ListItemText
                          primary={`${u.name || '(sin nombre)'} <${u.email}>`}
                          secondary={u.deleted_at ? `Eliminado: ${new Date(u.deleted_at).toLocaleString()}` : undefined}
                        />
                      </ListItem>
                      {idx < deletedList.length - 1 && <Divider component="li" />}
                    </>
                  ))}
                </List>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={loadDeletedUsers} disabled={deletedLoading}>Actualizar</Button>
          <Button startIcon={<DeleteSweepIcon />} color="error" variant="contained" onClick={executeCleanup} disabled={deletedLoading || deletedCount === 0}>
            Ejecutar limpieza
          </Button>
          <Button onClick={() => setDeletedOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as string }))}
              >
                <MenuItem value="user">Usuario</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
            {/* Créditos eliminados */}
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
