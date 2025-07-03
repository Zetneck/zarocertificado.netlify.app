import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  Stack,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  LocalShipping,
  Warning,
  CheckCircle,
  ImportExport,
  Security,
  Assignment
} from '@mui/icons-material';
import { useCertificateContext } from '../hooks/useCertificateContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

interface TransportInfo {
  type: 'importacion' | 'exportacion' | 'transito';
  status: 'vigente' | 'proximo_vencer' | 'vencido' | 'sin_certificado';
  daysRemaining?: number;
}

export function TransportStatusPanel() {
  const { fechaInicio, fechaFinal, folio, remolque, placas } = useCertificateContext();

  // Calcular estado del certificado
  const getTransportInfo = (): TransportInfo => {
    if (!fechaInicio || !fechaFinal) {
      return { type: 'transito', status: 'sin_certificado' };
    }

    const today = dayjs();
    const final = dayjs(fechaFinal);
    
    if (today.isAfter(final)) {
      return { type: 'transito', status: 'vencido', daysRemaining: 0 };
    }
    
    const daysRemaining = final.diff(today, 'day');
    
    if (daysRemaining <= 7) {
      return { type: 'transito', status: 'proximo_vencer', daysRemaining };
    }
    
    return { type: 'transito', status: 'vigente', daysRemaining };
  };

  const transportInfo = getTransportInfo();

  // Función para obtener color del estado
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'vigente': return 'success';
      case 'proximo_vencer': return 'warning';
      case 'vencido': return 'error';
      default: return 'info';
    }
  };

  // Función para obtener icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vigente': return <CheckCircle />;
      case 'proximo_vencer': return <Warning />;
      case 'vencido': return <Warning />;
      default: return <Assignment />;
    }
  };

  // Función para obtener mensaje del estado
  const getStatusMessage = (info: TransportInfo) => {
    switch (info.status) {
      case 'vigente':
        return `Certificado vigente por ${info.daysRemaining} días más`;
      case 'proximo_vencer':
        return `⚠️ Certificado vence en ${info.daysRemaining} días`;
      case 'vencido':
        return '🚫 Certificado vencido - Renovación requerida';
      default:
        return 'Sin certificado registrado';
    }
  };

  // Calcular progreso de vigencia
  const getValidityProgress = () => {
    if (!fechaInicio || !fechaFinal) return 0;
    
    const inicio = dayjs(fechaInicio);
    const final = dayjs(fechaFinal);
    const today = dayjs();
    
    const totalDays = final.diff(inicio, 'day');
    const daysUsed = today.diff(inicio, 'day');
    
    return Math.min(Math.max((daysUsed / totalDays) * 100, 0), 100);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 3,
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(226, 232, 240, 0.8) 100%)',
        borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}20, transparent)`,
          borderRadius: '50%',
          transform: 'translate(50%, -50%)'
        }
      }}
    >
      {/* Header del panel */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LocalShipping sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Estado del Transporte
        </Typography>
      </Box>

      {/* Información del vehículo */}
      {(remolque || placas) && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {remolque && (
              <Chip 
                icon={<LocalShipping />}
                label={`Remolque: ${remolque}`}
                variant="outlined"
                size="small"
              />
            )}
            {placas && (
              <Chip 
                icon={<Security />}
                label={`Placas: ${placas}`}
                variant="outlined"
                size="small"
              />
            )}
            {folio && (
              <Chip 
                icon={<Assignment />}
                label={`Folio: ${folio}`}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Estado del certificado */}
      <Alert 
        severity={getStatusColor(transportInfo.status)}
        icon={getStatusIcon(transportInfo.status)}
        sx={{ mb: 2 }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {getStatusMessage(transportInfo)}
        </Typography>
      </Alert>

      {/* Barra de progreso de vigencia */}
      {fechaInicio && fechaFinal && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Vigencia del certificado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(getValidityProgress())}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getValidityProgress()}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: transportInfo.status === 'vigente' 
                  ? 'success.main'
                  : transportInfo.status === 'proximo_vencer'
                  ? 'warning.main'
                  : 'error.main'
              }
            }}
          />
        </Box>
      )}

      {/* Información sobre regulaciones */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(59, 130, 246, 0.1)' 
            : 'rgba(59, 130, 246, 0.05)',
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(59, 130, 246, 0.2)' 
            : 'rgba(59, 130, 246, 0.1)'}`,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <ImportExport sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Regulaciones de Transporte Internacional
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Los certificados de fumigación para transporte terrestre de importación/exportación 
          deben estar vigentes dentro de los <strong>últimos 30 días</strong> según las 
          regulaciones internacionales de comercio.
        </Typography>
      </Box>

      {/* Recordatorios y acciones */}
      {transportInfo.status === 'proximo_vencer' && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          <Typography variant="body2">
            <strong>Acción requerida:</strong> Programe la renovación del certificado antes del vencimiento 
            para evitar interrupciones en el transporte.
          </Typography>
        </Alert>
      )}

      {transportInfo.status === 'vencido' && (
        <Alert severity="error">
          <Typography variant="body2">
            <strong>Certificado vencido:</strong> Este vehículo no puede realizar operaciones de 
            importación/exportación hasta obtener un nuevo certificado de fumigación.
          </Typography>
        </Alert>
      )}

      {/* Fechas del certificado */}
      {fechaInicio && fechaFinal && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} sx={{ fontSize: '0.875rem' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Fecha de emisión:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {dayjs(fechaInicio).format('DD/MM/YYYY')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Fecha de vencimiento:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {dayjs(fechaFinal).format('DD/MM/YYYY')}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}