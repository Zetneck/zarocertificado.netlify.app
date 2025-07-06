import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert
} from '@mui/material';
import {
  Gavel,
  Schedule,
  Public,
  LocalShipping,
  Assignment,
  Security,
  Warning
} from '@mui/icons-material';

export function TransportRegulationsInfo() {
  const regulations = [
    {
      icon: <Schedule />,
      title: 'Vigencia del Certificado',
      description: 'Máximo 30 días desde la fecha de emisión',
      severity: 'warning' as const
    },
    {
      icon: <Public />,
      title: 'Alcance Internacional',
      description: 'Válido para operaciones de importación y exportación',
      severity: 'info' as const
    },
    {
      icon: <LocalShipping />,
      title: 'Tipo de Transporte',
      description: 'Específico para transporte terrestre de carga',
      severity: 'info' as const
    },
    {
      icon: <Assignment />,
      title: 'Documentación Requerida',
      description: 'Folio, placas del vehículo y datos del remolque',
      severity: 'info' as const
    }
  ];

  const requirementsList = [
    'Inspección previa del vehículo y remolque',
    'Aplicación de fumigante certificado',
    'Sellado hermético del área tratada',
    'Documentación de productos químicos utilizados',
    'Verificación de efectividad del tratamiento'
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Información principal */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.8) 100%)'
            : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(226, 232, 240, 0.8) 100%)',
          borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Gavel sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Regulaciones de Transporte
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Los certificados de fumigación para transporte internacional están sujetos a estrictas 
          regulaciones aduaneras y fitosanitarias para prevenir la propagación de plagas entre países.
        </Typography>

        {/* Lista de regulaciones principales */}
        <List sx={{ py: 0 }}>
          {regulations.map((regulation, index) => (
            <ListItem key={index} sx={{ py: 1, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText'
                  }}
                >
                  {regulation.icon}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {regulation.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {regulation.description}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Requisitos del proceso */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(34, 197, 94, 0.1)'
            : 'rgba(34, 197, 94, 0.05)',
          border: (theme) => `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(34, 197, 94, 0.2)'
            : 'rgba(34, 197, 94, 0.1)'}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Security sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Proceso de Fumigación
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pasos requeridos para la certificación:
        </Typography>

        <List sx={{ py: 0 }}>
          {requirementsList.map((requirement, index) => (
            <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'success.main'
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary">
                    {requirement}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Alerta importante */}
      <Alert
        severity="warning"
        icon={<Warning />}
        sx={{
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          ⚠️ Importante para Operadores de Transporte
        </Typography>
        <Typography variant="body2">
          • Los certificados vencidos pueden resultar en retención del vehículo en aduanas
          <br />
          • Se recomienda renovar el certificado 7 días antes del vencimiento
          <br />
          • Mantener copias digitales y físicas durante el transporte
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Vigencia: 30 días"
            color="warning"
            size="small"
            variant="outlined"
          />
          <Chip
            label="Renovación recomendada: 7 días antes"
            color="info"
            size="small"
            variant="outlined"
          />
        </Box>
      </Alert>
    </Box>
  );
}
