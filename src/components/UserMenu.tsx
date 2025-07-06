import React, { useState } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Chip,
  ListItemIcon
} from '@mui/material';
import {
  AccountCircle,
  Security,
  Logout,
  Settings,
  History
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { TwoFactorSettings } from './TwoFactorSettings';
import { AccessHistory } from './AccessHistory';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const handleShowHistory = () => {
    setShowLoginHistory(true);
    handleMenuClose();
  };

  const handleShowSecurity = () => {
    setShowSecuritySettings(true);
    handleMenuClose();
  };

  if (!user) return null;

  return (
    <Box>
      <IconButton onClick={handleMenuOpen} size="large">
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 280, mt: 1 }
        }}
      >
        {/* Información del usuario */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip 
              label={user.role} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
            {user.twoFactorEnabled && (
              <Chip 
                label="2FA" 
                size="small" 
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Divider />

        {/* Opciones del menú */}
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Perfil</Typography>
        </MenuItem>

        <MenuItem onClick={handleShowSecurity}>
          <ListItemIcon>
            <Security fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Configuración 2FA</Typography>
        </MenuItem>

        <MenuItem onClick={handleShowHistory}>
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Historial de Accesos</Typography>
        </MenuItem>

        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Configuración</Typography>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Cerrar Sesión</Typography>
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <TwoFactorSettings 
        open={showSecuritySettings}
        onClose={() => setShowSecuritySettings(false)}
      />

      <AccessHistory
        open={showLoginHistory}
        onClose={() => setShowLoginHistory(false)}
      />
    </Box>
  );
}