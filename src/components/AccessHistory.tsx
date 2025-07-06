import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Computer,
  Smartphone,
  Security,
  CheckCircle,
  Error,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import type { LoginAttempt } from '../types/auth';

interface AccessHistoryProps {
  open: boolean;
  onClose: () => void;
}

export function AccessHistory({ open, onClose }: AccessHistoryProps) {
  const { getLoginHistory } = useAuth();
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const history = await getLoginHistory();
      setAttempts(history);
    } catch (error) {
      console.error('Error loading access history:', error);
    } finally {
      setLoading(false);
    }
  }, [getLoginHistory]);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory]);

  const getStatusIcon = (attempt: LoginAttempt) => {
    if (attempt.success) {
      return <CheckCircle color="success" />;
    }
    return <Error color="error" />;
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone />;
    }
    return <Computer />;
  };

  const getStatusColor = (attempt: LoginAttempt): 'success' | 'error' => {
    return attempt.success ? 'success' : 'error';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Security color="primary" />
        <Typography variant="h6">
          Historial de Accesos
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            p: 4 
          }}>
            <CircularProgress />
          </Box>
        ) : attempts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No hay historial de accesos disponible
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {attempts.map((attempt, index) => (
              <React.Fragment key={`${attempt.email}-${attempt.timestamp.getTime()}-${index}`}>
                <ListItem sx={{ px: 3, py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: getStatusColor(attempt) === 'success' ? 'success.light' : 'error.light',
                      color: getStatusColor(attempt) === 'success' ? 'success.dark' : 'error.dark'
                    }}>
                      {getDeviceIcon(attempt.userAgent)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" component="span">
                          {new Date(attempt.timestamp).toLocaleString('es-ES')}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(attempt)}
                          label={attempt.success ? 'Exitoso' : 'Fallido'}
                          size="small"
                          color={getStatusColor(attempt)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Email:</strong> {attempt.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>IP:</strong> {attempt.ipAddress}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Dispositivo:</strong> {attempt.userAgent.length > 50 
                            ? `${attempt.userAgent.substring(0, 50)}...` 
                            : attempt.userAgent}
                        </Typography>
                        {attempt.twoFactorUsed && (
                          <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
                            <strong>2FA:</strong> Utilizado
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < attempts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
