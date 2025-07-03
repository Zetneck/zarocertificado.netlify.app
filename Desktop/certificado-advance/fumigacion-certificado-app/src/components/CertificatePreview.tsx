import { Box, Paper, Typography, Divider } from '@mui/material';
import dayjs from 'dayjs';

interface CertificatePreviewProps {
  folio: string;
  remolque: string;
  placas: string;
  fechaInicio: string;
  fechaFinal: string;
}

export function CertificatePreview({ 
  folio, 
  remolque, 
  placas, 
  fechaInicio,
  fechaFinal
}: CertificatePreviewProps) {
  // Calcular días de vigencia simple
  const calcularVigencia = () => {
    if (!fechaInicio || !fechaFinal) return '';
    const inicio = dayjs(fechaInicio, 'DD/MM/YYYY');
    const final = dayjs(fechaFinal, 'DD/MM/YYYY');
    const dias = final.diff(inicio, 'day') + 1;
    return `${dias} días`;
  };

  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 3, 
        backgroundColor: '#ffffff',
        color: '#000000',
        border: '2px solid #ddd',
        borderRadius: 2,
        minHeight: '400px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Encabezado con logo */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2',
              mb: 1 
            }}
          >
            CERTIFICADO DE FUMIGACIÓN
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#666'
            }}
          >
            Folio: {folio || '[Folio]'}
          </Typography>
        </Box>
        
        {/* Logo PROGILSA */}
        <Box
          sx={{
            width: '80px',
            height: '80px',
            border: '2px solid #1976d2',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="PROGILSA"
            sx={{
              maxWidth: '70px',
              maxHeight: '70px',
              objectFit: 'contain'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = '<div style="font-size: 10px; text-align: center; color: #1976d2; font-weight: bold;">PROGILSA</div>';
              }
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ 
        mb: 3,
        borderColor: 'rgba(0, 0, 0, 0.12)'
      }} />

      {/* Información principal en dos columnas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 4 }}>
        {/* Columna izquierda */}
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 2, 
              color: '#1976d2'
            }}
          >
            INFORMACIÓN DEL VEHÍCULO
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#666'
              }}
            >
              Remolque:
            </Typography>
            <Typography variant="body1" sx={{ color: '#000000' }}>
              {remolque || '[Remolque]'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#666'
              }}
            >
              Placas:
            </Typography>
            <Typography variant="body1" sx={{ color: '#000000' }}>
              {placas || '[Placas]'}
            </Typography>
          </Box>
        </Box>

        {/* Columna derecha */}
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 2, 
              color: '#1976d2'
            }}
          >
            PERÍODO DE VIGENCIA
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#666'
              }}
            >
              Fecha de Inicio:
            </Typography>
            <Typography variant="body1" sx={{ color: '#000000' }}>
              {fechaInicio || '[Fecha Inicio]'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#666'
              }}
            >
              Fecha de Vencimiento:
            </Typography>
            <Typography variant="body1" sx={{ color: '#000000' }}>
              {fechaFinal || '[Fecha Final]'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#666'
              }}
            >
              Vigencia:
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#1976d2',
                fontWeight: 'bold' 
              }}
            >
              {calcularVigencia() || '[Vigencia]'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Sección de firmas */}
      <Box sx={{ 
        mt: 4, 
        pt: 3, 
        borderTop: '1px solid #ddd'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 3, 
            color: '#1976d2',
            textAlign: 'center' 
          }}
        >
          FIRMAS Y AUTORIZACIONES
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {/* Firma Autorizado */}
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ mb: 2, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box
                component="img"
                src="/firma-autorizado.png"
                alt="Firma Autorizado"
                sx={{
                  maxHeight: '50px',
                  maxWidth: '120px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<div style="border-bottom: 1px solid #666; width: 120px; height: 1px; margin: 25px auto;"></div>';
                  }
                }}
              />
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold',
                color: '#000000'
              }}
            >
              Persona Autorizada
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#666'
              }}
            >
              PROGILSA
            </Typography>
          </Box>

          {/* Firma Técnico */}
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ mb: 2, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box
                component="img"
                src="/firma-tecnico.png"
                alt="Firma Técnico"
                sx={{
                  maxHeight: '40px',
                  maxWidth: '100px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<div style="border-bottom: 1px solid #666; width: 100px; height: 1px; margin: 20px auto;"></div>';
                  }
                }}
              />
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold',
                color: '#000000'
              }}
            >
              Técnico Responsable
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#666'
              }}
            >
              Certificación Técnica
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Pie de página */}
      <Box sx={{ 
        mt: 4, 
        pt: 2, 
        borderTop: '1px solid #ddd',
        textAlign: 'center' 
      }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#666'
          }}
        >
          Este certificado garantiza que el vehículo ha sido fumigado según las normas establecidas
        </Typography>
      </Box>
    </Paper>
  );
}
