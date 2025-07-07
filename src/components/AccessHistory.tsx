import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import {
  Security,
  Schedule
} from '@mui/icons-material';

interface AccessHistoryProps {
  open: boolean;
  onClose: () => void;
}

export function AccessHistory({ open, onClose }: AccessHistoryProps) {
  // Datos de ejemplo para mostrar el diseño
  const sampleData = [
    {
      date: '15 de Diciembre 2024, 14:30',
      ip: '192.168.1.100',
      device: 'Windows Chrome',
      status: 'Exitoso'
    },
    {
      date: '14 de Diciembre 2024, 09:15',
      ip: '192.168.1.100', 
      device: 'Windows Chrome',
      status: 'Exitoso'
    },
    {
      date: '13 de Diciembre 2024, 16:45',
      ip: '192.168.1.105',
      device: 'Android Mobile',
      status: 'Fallido'
    }
  ];

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

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Schedule sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Funcionalidad en desarrollo
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            El historial de accesos estará disponible próximamente. Esta función mostrará:
          </Typography>
        </Box>

        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 Información que se registrará:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Fecha y hora de cada acceso
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Dirección IP desde donde se accede
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Tipo de dispositivo utilizado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Intentos exitosos y fallidos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Uso de autenticación de dos factores
          </Typography>
        </Box>

        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Vista previa del diseño:
          </Typography>
          {sampleData.map((item, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              py: 1,
              borderBottom: index < sampleData.length - 1 ? '1px solid' : 'none',
              borderColor: 'grey.200'
            }}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {item.date}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.ip} • {item.device}
                </Typography>
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1,
                  bgcolor: item.status === 'Exitoso' ? 'success.light' : 'error.light',
                  color: item.status === 'Exitoso' ? 'success.dark' : 'error.dark'
                }}
              >
                {item.status}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
