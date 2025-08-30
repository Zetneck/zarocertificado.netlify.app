import { Box, Typography, Paper, List, ListItem, Chip, LinearProgress } from '@mui/material';
import { CheckCircle, Info, Timeline, Description, Security, AccessTime } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useCertificateContext } from '../hooks/useCertificateContext';
import { PreviewDisplay } from './PreviewDisplay';
import dayjs from 'dayjs';

export function RightSidebar() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { folio, remolque, placas, fechaInicio, fechaFinal } = useCertificateContext();

  // Calcular progreso del formulario
  const fields = [folio, remolque, placas, fechaInicio, fechaFinal];
  const completedFields = fields.filter(field => field && field !== '').length;
  const progress = (completedFields / fields.length) * 100;

  // Calcular información de vigencia
  const getVigenciaInfo = () => {
    if (!fechaInicio || !fechaFinal) return null;
    
    const inicio = dayjs(fechaInicio.format('YYYY-MM-DD'));
    const final = dayjs(fechaFinal.format('YYYY-MM-DD'));
    const hoy = dayjs();
    
    const diasTotales = final.diff(inicio, 'day') + 1;
    const diasRestantes = final.diff(hoy, 'day');
    
    return {
      diasTotales,
      diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
      estado: diasRestantes > 0 ? 'vigente' : 'vencido'
    };
  };

  const vigenciaInfo = getVigenciaInfo();

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 1, sm: 1.5 },
      height: '100%'
    }}>
      {/* Progreso del formulario */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 1.5, 
          backgroundColor: isDark 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(10px)',
          border: isDark 
            ? '2px solid rgba(129, 140, 248, 0.3)' 
            : '2px solid rgba(99, 102, 241, 0.1)'
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: theme.palette.primary.main,
            fontWeight: 700,
            fontSize: '1rem',
            mb: 1
          }}
        >
          <Timeline 
            sx={{ color: theme.palette.primary.main, fontSize: '1rem' }}
          />
          PROGRESO FORMULARIO
        </Typography>
        <Box sx={{ mb: 1.5 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }}
          />
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontWeight: 500,
            fontSize: '0.8rem'
          }}
        >
          {completedFields} de {fields.length} campos completados ({Math.round(progress)}%)
        </Typography>
      </Paper>

      {/* Vista previa del certificado */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 1,
          flex: 1,
          backgroundColor: isDark 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          border: isDark 
            ? '2px solid rgba(129, 140, 248, 0.3)' 
            : '2px solid rgba(99, 102, 241, 0.1)'
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: theme.palette.primary.main,
            fontWeight: 700,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          <Description 
            sx={{ color: theme.palette.primary.main, fontSize: '1rem' }}
          />
          VISTA PREVIA DEL CERTIFICADO
        </Typography>
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto'
        }}>
          <PreviewDisplay />
        </Box>
      </Paper>

      {/* Información del certificado */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 1.5, 
          backgroundColor: isDark 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(10px)',
          border: isDark 
            ? '2px solid rgba(129, 140, 248, 0.3)' 
            : '2px solid rgba(99, 102, 241, 0.1)'
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: theme.palette.primary.main,
            fontWeight: 700,
            fontSize: '1rem',
            mb: 1
          }}
        >
          <Info 
            sx={{ color: theme.palette.primary.main, fontSize: '1rem' }}
          />
          INFORMACIÓN DEL CERTIFICADO
        </Typography>
        <List sx={{ p: 0 }}>
          <ListItem sx={{ py: 0.3, display: 'flex', alignItems: 'center' }}>
            <CheckCircle 
              sx={{ 
                color: theme.palette.success.main, 
                mr: 1, 
                fontSize: '1rem' 
              }} 
            />
            <Box 
              component="span"
              className="advice-text-item"
              data-theme={isDark ? 'dark' : 'light'}
              style={{
                color: isDark ? '#FFFFFF' : '#1e293b',
                fontSize: '0.8rem',
                fontWeight: 500,
                fontFamily: '"Inter", "Roboto", sans-serif',
                display: 'inline-block'
              }}
            >
              Los campos son obligatorios
            </Box>
          </ListItem>
          
          <ListItem sx={{ py: 0.3, display: 'flex', alignItems: 'center' }}>
            <Security 
              sx={{ 
                color: theme.palette.primary.main, 
                mr: 1, 
                fontSize: '1rem' 
              }} 
            />
            <Box 
              component="span"
              className="advice-text-item"
              data-theme={isDark ? 'dark' : 'light'}
              style={{
                color: isDark ? '#FFFFFF' : '#1e293b',
                fontSize: '0.8rem',
                fontWeight: 500,
                fontFamily: '"Inter", "Roboto", sans-serif',
                display: 'inline-block'
              }}
            >
              El certificado es válido por 30 días
            </Box>
          </ListItem>
          
          {vigenciaInfo && (
            <ListItem sx={{ py: 0.3, display: 'flex', alignItems: 'center' }}>
              <Chip 
                label={`${vigenciaInfo.diasRestantes} días restantes`}
                color={vigenciaInfo.estado === 'vigente' ? 'success' : 'error'}
                size="small"
                sx={{ 
                  mr: 1,
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }}
              />
              <Box 
                component="span"
                className="advice-text-item"
                data-theme={isDark ? 'dark' : 'light'}
                style={{
                  color: vigenciaInfo.estado === 'vigente' 
                    ? (isDark ? '#22c55e' : '#16a34a')
                    : (isDark ? '#ef4444' : '#dc2626'),
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  fontFamily: '"Inter", "Roboto", sans-serif',
                  display: 'inline-block'
                }}
              >
                {vigenciaInfo.estado === 'vigente' ? 'Certificado vigente' : 'Certificado vencido'}
              </Box>
            </ListItem>
          )}
          
          <ListItem sx={{ py: 0.3, display: 'flex', alignItems: 'center' }}>
            <AccessTime 
              sx={{ 
                color: theme.palette.warning.main, 
                mr: 1, 
                fontSize: '1rem' 
              }} 
            />
            <Box 
              component="span"
              className="advice-text-item"
              data-theme={isDark ? 'dark' : 'light'}
              style={{
                color: isDark ? '#FFFFFF' : '#1e293b',
                fontSize: '0.8rem',
                fontWeight: 500,
                fontFamily: '"Inter", "Roboto", sans-serif',
                display: 'inline-block'
              }}
            >
              Las fechas determinan la vigencia
            </Box>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}