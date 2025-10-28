import { Box, Paper, Typography, Divider, Chip } from '@mui/material';
import { 
  VerifiedUser as VerifiedIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
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
    const dias = final.diff(inicio, 'day'); // Removido el +1 para que coincida con el formulario
    return `${dias} días`;
  };

  return (
    <Paper 
      elevation={8}
      sx={{ 
        p: 0,
        backgroundColor: '#ffffff',
        color: '#000000',
        border: 'none',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        background: `
          linear-gradient(135deg, #667eea 0%, #764ba2 100%),
          linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.98) 100%)
        `,
        backgroundBlendMode: 'overlay',
        boxShadow: `
          0 8px 24px rgba(102, 126, 234, 0.12),
          0 4px 16px rgba(118, 75, 162, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.5)
        `,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: `
            0 12px 32px rgba(102, 126, 234, 0.15),
            0 6px 20px rgba(118, 75, 162, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.5)
          `
        }
      }}
    >
      {/* Banda superior decorativa */}
      <Box sx={{
        height: '4px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
      }} />

      {/* Contenido principal */}
      <Box sx={{ p: 1 }}>
        {/* Encabezado mejorado */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 1,
          position: 'relative'
        }}>
          <Box sx={{ flex: 1 }}>
            {/* Título principal con efecto */}
            <Box sx={{ position: 'relative', mb: 1 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 0.3,
                  letterSpacing: '0.3px',
                  fontSize: '1.8rem'
                }}
              >
                CERTIFICADO
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  color: '#2d3748',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  fontSize: '1.1rem'
                }}
              >
                DE FUMIGACIÓN
              </Typography>
              
              {/* Badge de verificación */}
            </Box>
            
            {/* Folio con diseño especial */}
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: 'white',
              px: 2,
              py: 0.8,
              borderRadius: 16,
              boxShadow: '0 2px 6px rgba(251, 191, 36, 0.2)',
              fontWeight: 'bold',
              fontSize: '1rem',
              letterSpacing: '0.3px'
            }}>
              <BadgeIcon sx={{ mr: 0.8, fontSize: 18 }} />
              Folio: {folio || '[Folio]'}
            </Box>
          </Box>
        </Box>

        {/* Divider elegante */}
        <Divider sx={{
          mb: 1,
          background: 'linear-gradient(90deg, transparent 0%, #667eea 20%, #764ba2 80%, transparent 100%)',
          height: '2px',
          border: 'none'
        }} />

        {/* Información principal con tarjetas */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
          {/* Tarjeta de información del vehículo */}
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: 2.5,
            p: 1.5,
            border: '1px solid rgba(102, 126, 234, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '3px',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '10px',
                p: 1,
                mr: 1.5,
                boxShadow: '0 3px 10px rgba(102, 126, 234, 0.25)'
              }}>
                <CarIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#2d3748',
                  letterSpacing: '0.3px',
                  fontSize: '1rem'
                }}
              >
                INFORMACIÓN DEL VEHÍCULO
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#667eea',
                  mb: 0.5,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.3px'
                }}
              >
                Remolque
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#2d3748',
                  fontWeight: 'bold',
                  background: 'rgba(102, 126, 234, 0.08)',
                  py: 0.8,
                  px: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid rgba(102, 126, 234, 0.15)',
                  fontSize: '0.95rem'
                }}
              >
                {remolque || '[Remolque]'}
              </Typography>
            </Box>

            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#667eea',
                  mb: 0.5,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.3px'
                }}
              >
                Placas
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#2d3748',
                  fontWeight: 'bold',
                  background: 'rgba(102, 126, 234, 0.08)',
                  py: 0.8,
                  px: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid rgba(102, 126, 234, 0.15)',
                  fontSize: '0.95rem'
                }}
              >
                {placas || '[Placas]'}
              </Typography>
            </Box>
          </Box>

          {/* Tarjeta de período de vigencia */}
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
            borderRadius: 2.5,
            p: 1.5,
            border: '1px solid rgba(16, 185, 129, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '3px',
              height: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '10px',
                p: 1,
                mr: 1.5,
                boxShadow: '0 3px 10px rgba(16, 185, 129, 0.25)'
              }}>
                <ScheduleIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#2d3748',
                  letterSpacing: '0.3px',
                  fontSize: '1rem'
                }}
              >
                PERÍODO DE VIGENCIA
              </Typography>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#10b981',
                    mb: 0.5,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.3px'
                  }}
                >
                  Fecha de Inicio
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#2d3748',
                    fontWeight: 'bold',
                    background: 'rgba(16, 185, 129, 0.08)',
                    py: 0.8,
                    px: 1.5,
                    borderRadius: 1.5,
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    fontSize: '0.95rem'
                  }}
                >
                  {fechaInicio || '[Fecha Inicio]'}
                </Typography>
              </Box>

              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#10b981',
                    mb: 0.5,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.3px'
                  }}
                >
                  Fecha de Vencimiento
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#2d3748',
                    fontWeight: 'bold',
                    background: 'rgba(16, 185, 129, 0.08)',
                    py: 0.8,
                    px: 1.5,
                    borderRadius: 1.5,
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    fontSize: '0.95rem'
                  }}
                >
                  {fechaFinal || '[Fecha Final]'}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#10b981',
                  mb: 0.5,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.3px'
                }}
              >
                Vigencia Total
              </Typography>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.25)',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                <SecurityIcon sx={{ mr: 0.8, fontSize: 16 }} />
                {calcularVigencia() || '[Vigencia]'}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Sección de firmas mejorada */}
        <Box sx={{ 
          mt: 1,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
          borderRadius: 3,
          p: 1,
          border: '1px solid rgba(102, 126, 234, 0.08)',
          position: 'relative'
        }}>
          {/* Decoración superior */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #10b981 100%)',
            borderRadius: '3px 3px 0 0'
          }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              borderRadius: '10px',
              p: 1,
              mr: 1.5,
              boxShadow: '0 3px 10px rgba(118, 75, 162, 0.25)'
            }}>
              <SecurityIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textAlign: 'center',
                letterSpacing: '0.5px',
                fontSize: '1.25rem'
              }}
            >
              FIRMAS Y AUTORIZACIONES
            </Typography>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Firma Autorizado mejorada */}
            <Box sx={{ 
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              p: 1.5,
              border: '2px dashed rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'rgba(102, 126, 234, 0.5)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.15)'
              }
            }}>
              <Box sx={{ 
                mb: 1.5, 
                height: '50px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                <Box
                  component="img"
                  src="/firma-autorizado.png"
                  alt="Firma Autorizado"
                  sx={{
                    maxHeight: '45px',
                    maxWidth: '110px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `
                        <div style="
                          border-bottom: 2px solid #667eea; 
                          width: 110px; 
                          height: 2px; 
                          margin: 22px auto;
                        "></div>
                      `;
                    }
                  }}
                />
              </Box>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  mb: 0.5,
                  fontSize: '0.85rem'
                }}
              >
                Persona Autorizada
              </Typography>
              
              <Chip 
                label="PROGILSA"
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}
              />
            </Box>

            {/* Firma Técnico mejorada */}
            <Box sx={{ 
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              p: 1.5,
              border: '2px dashed rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'rgba(16, 185, 129, 0.5)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.15)'
              }
            }}>
              <Box sx={{ 
                mb: 1.5, 
                height: '50px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(16, 185, 129, 0.1)'
              }}>
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
                      target.parentElement.innerHTML = `
                        <div style="
                          border-bottom: 2px solid #10b981; 
                          width: 100px; 
                          height: 2px; 
                          margin: 20px auto;
                        "></div>
                      `;
                    }
                  }}
                />
              </Box>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  mb: 0.5,
                  fontSize: '0.85rem'
                }}
              >
                Técnico Responsable
              </Typography>
              
              <Chip 
                label="Certificación Técnica"
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Pie de página mejorado */}
        <Box sx={{ 
          mt: 1, 
          pt: 1,
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
          borderRadius: 2,
          p: 1,
          border: '1px solid rgba(251, 191, 36, 0.2)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <VerifiedIcon sx={{ color: '#fbbf24', mr: 1, fontSize: 20 }} />
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#2d3748',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              CERTIFICADO OFICIAL
            </Typography>
          </Box>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#4a5568',
              fontStyle: 'italic',
              maxWidth: '500px',
              mx: 'auto',
              lineHeight: 1.5,
              fontSize: '0.8rem'
            }}
          >
            Este certificado garantiza que el vehículo ha sido fumigado según las normas establecidas
            por las autoridades competentes y cumple con todos los requisitos de seguridad internacional.
          </Typography>
        </Box>
      </Box>

      {/* Animación CSS */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Paper>
  );
}
