import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Security,
  Computer,
  CheckCircle,
  Error,
  Shield,
  LocationOn,
  Refresh,
  DesktopWindows,
  PhoneAndroid,
  LaptopMac,
  Tablet
} from '@mui/icons-material';

interface AccessHistoryProps {
  open: boolean;
  onClose: () => void;
}

interface AccessLog {
  id?: string;
  date: string;
  ip: string;
  device: string;
  userAgent: string;
  status: string;
  twoFactorUsed: boolean;
  timestamp: string;
  rawData?: Record<string, unknown>;
}

export function AccessHistory({ open, onClose }: AccessHistoryProps) {
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchAccessHistory();
    }
  }, [open]);

  const fetchAccessHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No autorizado. Inicia sesión nuevamente.');
        return;
      }

      const response = await fetch('/.netlify/functions/access-history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Raw access history data:', data);

      if (response.ok) {
        const logs = data.data || [];
        console.log('Processed access logs:', logs);
        
        // Filtrar entradas duplicadas basadas en timestamp + ip + status
        const uniqueLogs = logs.filter((log: AccessLog, index: number, arr: AccessLog[]) => {
          const isDuplicate = arr.findIndex((l: AccessLog) => 
            l.timestamp === log.timestamp && 
            l.ip === log.ip && 
            l.status === log.status
          ) !== index;
          return !isDuplicate;
        });
        
        console.log('Unique access logs:', uniqueLogs);
        setAccessLogs(uniqueLogs);
      } else {
        setError(data.error || 'Error al cargar el historial de accesos');
      }
    } catch (error) {
      console.error('Error al obtener historial:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device: string, userAgent: string = '') => {
    const deviceLower = device.toLowerCase();
    const userAgentLower = userAgent.toLowerCase();
    
    if (deviceLower.includes('mobile') || userAgentLower.includes('mobile') || 
        deviceLower.includes('android') || userAgentLower.includes('android') ||
        deviceLower.includes('iphone') || userAgentLower.includes('iphone')) {
      return <PhoneAndroid sx={{ color: 'primary.main' }} />;
    }
    
    if (deviceLower.includes('tablet') || userAgentLower.includes('tablet') ||
        deviceLower.includes('ipad') || userAgentLower.includes('ipad')) {
      return <Tablet sx={{ color: 'primary.main' }} />;
    }
    
    if (deviceLower.includes('mac') || userAgentLower.includes('mac')) {
      return <LaptopMac sx={{ color: 'primary.main' }} />;
    }
    
    if (deviceLower.includes('windows') || userAgentLower.includes('windows')) {
      return <DesktopWindows sx={{ color: 'primary.main' }} />;
    }
    
    return <Computer sx={{ color: 'primary.main' }} />;
  };

  const getStatusConfig = (status: string) => {
    const isSuccess = status === 'Exitoso';
    return {
      icon: isSuccess ? <CheckCircle sx={{ fontSize: 16 }} /> : <Error sx={{ fontSize: 16 }} />,
      color: isSuccess ? 'success' : 'error',
      bgcolor: isSuccess ? 'success.light' : 'error.light',
      textColor: isSuccess ? 'success.dark' : 'error.dark'
    } as const;
  };

  const formatRelativeTime = (timestamp: string) => {
    // Obtener la hora actual en zona horaria de México
    const now = new Date();
    const mexicoNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    
    // La fecha del access log ya viene formateada en zona horaria de México desde el backend
    const accessTime = new Date(timestamp);
    const diffMs = mexicoNow.getTime() - accessTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Hace un momento' : `Hace ${diffMinutes} minutos`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
    } else if (diffDays < 30) {
      return diffDays === 1 ? 'Hace 1 día' : `Hace ${diffDays} días`;
    } else {
      return accessTime.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: 6 
        }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Cargando historial de accesos...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <IconButton color="inherit" size="small" onClick={fetchAccessHistory}>
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
      );
    }

    if (accessLogs.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Security sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No hay registros de acceso
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Los accesos a tu cuenta aparecerán aquí una vez que inicies sesión.
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Últimos {accessLogs.length} accesos
          </Typography>
          <Tooltip title="Actualizar">
            <IconButton size="small" onClick={fetchAccessHistory}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        <List sx={{ p: 0 }}>
          {accessLogs.map((log, index) => {
            const statusConfig = getStatusConfig(log.status);
            const uniqueKey = log.id || `${log.timestamp}_${index}_${log.ip}`;
            
            return (
              <Box key={uniqueKey}>
                <ListItem 
                  sx={{ 
                    px: 0, 
                    py: 2,
                    '&:hover': {
                      bgcolor: alpha('#1976d2', 0.04),
                      borderRadius: 1
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getDeviceIcon(log.device, log.userAgent)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 1
                      }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight="medium" noWrap>
                            {log.date}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {formatRelativeTime(log.timestamp)} • {log.ip}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1, 
                          alignItems: 'center',
                          flexShrink: 0
                        }}>
                          {log.twoFactorUsed && (
                            <Tooltip title="Autenticación de dos factores utilizada">
                              <Shield sx={{ 
                                fontSize: 16, 
                                color: 'success.main' 
                              }} />
                            </Tooltip>
                          )}
                          
                          <Chip
                            icon={statusConfig.icon}
                            label={log.status}
                            size="small"
                            sx={{
                              height: 24,
                              bgcolor: statusConfig.bgcolor,
                              color: statusConfig.textColor,
                              '& .MuiChip-icon': {
                                color: statusConfig.textColor
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {log.ip}
                            </Typography>
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {log.device}
                          </Typography>
                        </Stack>
                      </Box>
                    }
                  />
                </ListItem>
                
                {index < accessLogs.length - 1 && (
                  <Divider sx={{ ml: 5 }} />
                )}
              </Box>
            );
          })}
        </List>
      </Box>
    );
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
          maxHeight: '85vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Security color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">
            Historial de Accesos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitorea la actividad de inicio de sesión en tu cuenta
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, minHeight: 400 }}>
        {renderContent()}
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        justifyContent: 'space-between'
      }}>
        <Typography variant="caption" color="text.secondary">
          Los registros se mantienen por 90 días
        </Typography>
        <Button onClick={onClose} color="primary" variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
