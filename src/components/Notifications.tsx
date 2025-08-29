import { useState } from 'react';
import type { ReactNode } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertTitle, 
  Button, 
  ButtonGroup, 
  Box, 
  Typography, 
  Chip,
  IconButton,
  Fade,
  LinearProgress
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import { 
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { NotificationContext } from '../context/NotificationContext';

interface NotificationAction {
  label: string;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  onClick: () => void;
}

interface Notification {
  id: string;
  title?: string;
  message: string;
  severity: AlertColor;
  duration?: number;
  actions?: NotificationAction[];
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
      actions?: NotificationAction[];
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
      actions: options?.actions,
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

  // Función específica para notificaciones de certificados
  const showCertificateNotification = (
    folio: string, 
    placas: string, 
    fileName: string,
    onDownload: () => void,
    onView: () => void,
    onGenerateAnother: () => void
  ) => {
    const actions: NotificationAction[] = [
      {
        label: 'Descargar',
        icon: <DownloadIcon sx={{ fontSize: 16 }} />,
        color: 'success',
        onClick: onDownload
      },
      {
        label: 'Ver',
        icon: <ViewIcon sx={{ fontSize: 16 }} />,
        color: 'info',
        onClick: onView
      },
      {
        label: 'Generar Otro',
        icon: <AddIcon sx={{ fontSize: 16 }} />,
        color: 'primary',
        onClick: onGenerateAnother
      }
    ];

    showNotification(
      `Certificado generado exitosamente`,
      'success',
      {
        title: '¡Certificado Listo!',
        duration: 10000,
        actions,
        metadata: {
          folio,
          placas,
          fileName,
          timestamp: new Date()
        }
      }
    );
  };

  const handleClose = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      showCertificateNotification 
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
              variant="filled"
              icon={getNotificationIcon(notification.severity)}
              sx={{
                minWidth: 400,
                maxWidth: 500,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                borderRadius: 2,
                '& .MuiAlert-message': {
                  width: '100%',
                  padding: 0
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
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'inherit',
                            borderColor: 'rgba(255,255,255,0.3)',
                            fontSize: '0.75rem',
                            height: 24
                          }}
                        />
                      )}
                      {notification.metadata.placas && (
                        <Chip 
                          size="small" 
                          label={`Placas: ${notification.metadata.placas}`}
                          variant="outlined"
                          sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'inherit',
                            borderColor: 'rgba(255,255,255,0.3)',
                            fontSize: '0.75rem',
                            height: 24
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

                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <ButtonGroup 
                      size="small" 
                      variant="outlined"
                      sx={{
                        '& .MuiButton-root': {
                          borderColor: 'rgba(255,255,255,0.3)',
                          color: 'inherit',
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          minWidth: 'auto',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: 'rgba(255,255,255,0.5)'
                          }
                        }
                      }}
                    >
                      {notification.actions.map((action, index) => (
                        <Button
                          key={index}
                          onClick={() => {
                            action.onClick();
                            // Opcional: cerrar la notificación después de la acción
                            // handleClose(notification.id);
                          }}
                          startIcon={action.icon}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </Box>
                )}
              </Box>
            </Alert>
          </Snackbar>
        </Fade>
      ))}
    </NotificationContext.Provider>
  );
};
