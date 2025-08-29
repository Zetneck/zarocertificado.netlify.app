import { useState } from 'react';
import type { ReactNode } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertTitle, 
  Box, 
  Typography, 
  Chip,
  IconButton,
  Fade,
  LinearProgress
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { 
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { NotificationContext } from '../context/NotificationContext';

interface Notification {
  id: string;
  title?: string;
  message: string;
  severity: AlertColor;
  duration?: number;
  showProgress?: boolean;
  metadata?: {
    folio?: string;
    placas?: string;
    fileName?: string;
    timestamp?: Date;
  };
}

interface NotificationProviderProps {
  children: ReactNode;
}

const getNotificationIcon = (severity: AlertColor) => {
  const iconMap = {
    success: <SuccessIcon />,
    error: <ErrorIcon />,
    warning: <WarningIcon />,
    info: <InfoIcon />
  };
  return iconMap[severity];
};

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (
    message: string, 
    severity: AlertColor = 'info', 
    options?: {
      title?: string;
      duration?: number;
      showProgress?: boolean;
      metadata?: Notification['metadata'];
    }
  ) => {
    const id = Date.now().toString();
    const newNotification: Notification = { 
      id, 
      message, 
      severity, 
      title: options?.title,
      duration: options?.duration || (severity === 'success' ? 8000 : 6000),
      showProgress: options?.showProgress || false,
      metadata: options?.metadata
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, newNotification.duration);
    }
  };

  const handleClose = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ 
      showNotification
    }}>
      {children}
      {notifications.map((notification) => (
        <Fade key={notification.id} in={true} timeout={300}>
          <Snackbar
            open={true}
            autoHideDuration={notification.duration || null}
            onClose={() => handleClose(notification.id)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
              '& .MuiSnackbarContent-root': {
                padding: 0,
              },
              // Asegurar que no tape las notificaciones de descarga del navegador
              zIndex: (theme) => theme.zIndex.snackbar - 1,
              // Margen desde el borde para que no tape las descargas
              marginRight: 2,
              marginBottom: 2
            }}
          >
            <Alert 
              onClose={() => handleClose(notification.id)} 
              severity={notification.severity}
              variant="outlined"
              icon={getNotificationIcon(notification.severity)}
              sx={{
                minWidth: 400,
                maxWidth: 500,
                // Diseño elegante coherente con el tema de la aplicación
                background: (theme) => theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: (theme) => notification.severity === 'success' 
                  ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`
                  : `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
                color: (theme) => theme.palette.text.primary,
                '& .MuiAlert-message': {
                  width: '100%',
                  padding: 0,
                  color: (theme) => theme.palette.text.primary
                },
                '& .MuiAlert-icon': {
                  color: notification.severity === 'success' 
                    ? 'rgb(34, 197, 94)' 
                    : notification.severity === 'error' 
                    ? 'rgb(239, 68, 68)'
                    : notification.severity === 'warning'
                    ? 'rgb(245, 158, 11)'
                    : 'rgb(59, 130, 246)'
                }
              }}
            >
              <Box sx={{ width: '100%' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    {notification.title && (
                      <AlertTitle sx={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                        {notification.title}
                      </AlertTitle>
                    )}
                    <Typography variant="body2" sx={{ mt: notification.title ? 0.5 : 0, opacity: 0.95 }}>
                      {notification.message}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={() => handleClose(notification.id)}
                    sx={{ color: 'inherit', opacity: 0.7, '&:hover': { opacity: 1 } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Metadata */}
                {notification.metadata && (
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {notification.metadata.folio && (
                        <Chip 
                          size="small" 
                          label={`Folio: ${notification.metadata.folio}`}
                          variant="outlined"
                          sx={{ 
                            backgroundColor: (theme) => theme.palette.mode === 'dark' 
                              ? 'rgba(99, 102, 241, 0.1)' 
                              : 'rgba(99, 102, 241, 0.05)',
                            color: 'rgb(99, 102, 241)',
                            borderColor: 'rgba(99, 102, 241, 0.3)',
                            fontSize: '0.75rem',
                            height: 26,
                            '& .MuiChip-label': {
                              fontWeight: 500
                            }
                          }}
                        />
                      )}
                      {notification.metadata.placas && (
                        <Chip 
                          size="small" 
                          label={`Placas: ${notification.metadata.placas}`}
                          variant="outlined"
                          sx={{ 
                            backgroundColor: (theme) => theme.palette.mode === 'dark' 
                              ? 'rgba(34, 197, 94, 0.1)' 
                              : 'rgba(34, 197, 94, 0.05)',
                            color: 'rgb(34, 197, 94)',
                            borderColor: 'rgba(34, 197, 94, 0.3)',
                            fontSize: '0.75rem',
                            height: 26,
                            '& .MuiChip-label': {
                              fontWeight: 500
                            }
                          }}
                        />
                      )}
                    </Box>
                    {notification.metadata.timestamp && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.8, 
                          fontSize: '0.7rem',
                          display: 'block',
                          mt: 0.5
                        }}
                      >
                        Generado hace {Math.floor((Date.now() - notification.metadata.timestamp.getTime()) / 1000)} segundos
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Progress Bar */}
                {notification.showProgress && (
                  <LinearProgress 
                    variant="indeterminate" 
                    sx={{ 
                      mb: 1.5,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'rgba(255,255,255,0.8)'
                      }
                    }} 
                  />
                )}
              </Box>
            </Alert>
          </Snackbar>
        </Fade>
      ))}
    </NotificationContext.Provider>
  );
};
