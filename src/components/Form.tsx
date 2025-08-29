import { 
  Box, 
  TextField, 
  Button, 
  Stack, 
  Alert, 
  Snackbar, 
  Typography, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState, useMemo, useEffect } from 'react';
import { 
  Badge,
  LocalShipping,
  Assignment,
  CheckCircle,
  Error,
  Schedule,
  AutoAwesome
} from '@mui/icons-material';
import { generatePDF, type CertificateData } from '../utils/pdfGenerator';
import { useCertificateContext } from '../hooks/useCertificateContext';
import { useAuthReal } from '../hooks/useAuthReal';
import dayjs from 'dayjs';

// Tipos para el estado del certificado
type CertificateStatus = 'draft' | 'in-process' | 'completed';

// Tipos para las opciones de validez
type ValidityOption = 'option-a' | 'option-b' | 'option-c';

export function Form() {
  const { 
    folio, setFolio,
    remolque, setRemolque,
    placas, setPlacas,
    fechaInicio, setFechaInicio,
    fechaFinal, setFechaFinal
  } = useCertificateContext();
  
  const { user, isAuthenticated } = useAuthReal();
  
  const [alert, setAlert] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  
  // Obtener el siguiente folio al cargar el componente
  useEffect(() => {
    const obtenerSiguienteFolio = async () => {
      if (folio) return; // Si ya tiene folio, no obtener otro
      
      try {
        const response = await fetch('/.netlify/functions/get-next-folio');
        const data = await response.json();
        
        if (data.success && data.nextFolio) {
          setFolio(data.nextFolio.toString());
        } else {
          console.warn('No se pudo obtener el folio, usando 10100 por defecto');
          setFolio('10100');
        }
      } catch (error) {
        console.error('Error obteniendo folio:', error);
        setFolio('10100'); // Fallback
      }
    };

    obtenerSiguienteFolio();
  }, [folio, setFolio]); // Incluir dependencias
  
  // Estados para las nuevas funcionalidades
  const [validityOption, setValidityOption] = useState<ValidityOption | ''>('');
  const [certificateStatus, setCertificateStatus] = useState<CertificateStatus>('draft');
  const [customValidityDays, setCustomValidityDays] = useState<number>(30);

  // Efecto para cambiar el estado del certificado basado en el progreso del formulario
  useEffect(() => {
    const completedFields = [folio, remolque, placas, fechaInicio, fechaFinal].filter(Boolean).length;
    
    if (completedFields === 0) {
      setCertificateStatus('draft');
    } else if (completedFields < 5) {
      setCertificateStatus('in-process');
    } else {
      setCertificateStatus('completed');
    }
  }, [folio, remolque, placas, fechaInicio, fechaFinal]);

  // Función para calcular fecha de expiración automáticamente
  const calculateExpirationDate = (startDate: dayjs.Dayjs | null, days: number = 30) => {
    if (!startDate) return null;
    return startDate.add(days, 'day');
  };

  // Efecto para Opción A: Calcular automáticamente la fecha de expiración
  useEffect(() => {
    if (validityOption === 'option-a' && fechaInicio) {
      const newExpiration = calculateExpirationDate(fechaInicio, 30);
      setFechaFinal(newExpiration);
    }
  }, [validityOption, fechaInicio, setFechaFinal]);

  // Efecto para Opción C: Calcular fecha basada en días seleccionados
  useEffect(() => {
    if (validityOption === 'option-c' && fechaInicio) {
      const newExpiration = calculateExpirationDate(fechaInicio, customValidityDays);
      setFechaFinal(newExpiration);
    }
  }, [validityOption, fechaInicio, customValidityDays, setFechaFinal]);

  // Validación para Opción B: Exactamente 30 días
  const is30DaysValid = useMemo(() => {
    if (validityOption !== 'option-b' || !fechaInicio || !fechaFinal) return true;
    const diffDays = fechaFinal.diff(fechaInicio, 'day');
    return diffDays === 30;
  }, [validityOption, fechaInicio, fechaFinal]);

  // Validar que la fecha final no sea anterior a la fecha de inicio
  const isDateRangeValid = useMemo(() => {
    if (!fechaInicio || !fechaFinal) return true;
    return fechaFinal.isAfter(fechaInicio) || fechaFinal.isSame(fechaInicio, 'day');
  }, [fechaInicio, fechaFinal]);

  // Función para obtener el color del estado
  const getStatusColor = (status: CertificateStatus) => {
    switch (status) {
      case 'draft': return 'default';
      case 'in-process': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status: CertificateStatus) => {
    switch (status) {
      case 'draft': return <Assignment />;
      case 'in-process': return <Schedule />;
      case 'completed': return <CheckCircle />;
      default: return <Assignment />;
    }
  };

  const handleGeneratePDF = async () => {
    setShowValidation(true);
    
    if (!isFormValid) {
      setAlert({
        message: 'Por favor completa todos los campos obligatorios',
        severity: 'error'
      });
      return;
    }

    if (validityOption === 'option-b' && !is30DaysValid) {
      setAlert({
        message: 'El certificado debe tener una validez de exactamente 30 días',
        severity: 'error'
      });
      return;
    }

    setIsGenerating(true);
    setAlert(null);

    try {
      // Reservar el folio antes de generar el PDF
      const folioResponse = await fetch('/.netlify/functions/reserve-folio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const folioData = await folioResponse.json();
      let finalFolio = folio;
      
      if (folioData.success && folioData.folio) {
        finalFolio = folioData.folio.toString();
        setFolio(finalFolio); // Actualizar el folio en el formulario
      } else {
        console.warn('No se pudo reservar folio, usando el actual:', folio);
      }

      const data: CertificateData = {
        folio: finalFolio,
        remolque,
        placas,
        fechaInicio: fechaInicio?.format('DD/MM/YYYY') || '',
        fechaFinal: fechaFinal?.format('DD/MM/YYYY') || '',
      };

      const result = await generatePDF(data);

      if (result.success) {
        // Registrar el certificado usando el contexto de autenticación
        try {
          console.log('🔍 Usuario autenticado:', !!user);
          console.log('🔍 Estado de autenticación:', isAuthenticated);
          console.log('🔍 ID del usuario:', user?.id);
          
          const token = localStorage.getItem('authToken');
          console.log('🔍 Token encontrado:', !!token);
          
          if (token && user?.id) {
            console.log('📤 Enviando datos de certificado:', { folio: finalFolio, placas: placas, userId: user.id });
            
            const trackResponse = await fetch('/.netlify/functions/track-certificate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                folio: finalFolio,
                placas: placas
              })
            });

            if (trackResponse.ok) {
              const trackResult = await trackResponse.json();
              console.log('✅ Certificado registrado exitosamente:', trackResult);
            } else {
              const trackError = await trackResponse.json();
              console.error('❌ Error en respuesta del tracking:', trackError);
            }
          } else {
            console.warn('⚠️ No se puede registrar certificado:', {
              hasToken: !!token,
              hasUser: !!user,
              hasUserId: !!user?.id
            });
          }
        } catch (err) {
          console.error('⚠️ Error registrando certificado:', err);
          // No afectar el flujo principal si falla el registro
        }

        setAlert({
          message: `PDF generado exitosamente con folio ${finalFolio}: ${result.fileName || 'certificado.pdf'}`,
          severity: 'success'
        });
        
        // Limpiar el formulario y obtener el siguiente folio
        setRemolque('');
        setPlacas('');
        setFechaInicio(null);
        setFechaFinal(null);
        
        // Obtener el siguiente folio para el próximo certificado
        try {
          const nextFolioResponse = await fetch('/.netlify/functions/get-next-folio');
          const nextFolioData = await nextFolioResponse.json();
          if (nextFolioData.success && nextFolioData.nextFolio) {
            setFolio(nextFolioData.nextFolio.toString());
          }
        } catch (err) {
          console.warn('Error obteniendo siguiente folio:', err);
        }
      } else {
        setAlert({
          message: `Error al generar PDF: ${result.error || 'Error desconocido'}`,
          severity: 'error'
        });
      }
    } catch (err) {
      setAlert({
        message: `Error inesperado: ${String(err)}`,
        severity: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = folio && remolque && placas && fechaInicio && fechaFinal && isDateRangeValid && (validityOption !== 'option-b' || is30DaysValid);

  return (
    <Box component="form" noValidate autoComplete="off" sx={{ maxWidth: '100%' }}>
      {/* Header ultra-compacto */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Certificado de Fumigación
        </Typography>
        <Chip
          icon={getStatusIcon(certificateStatus)}
          label={
            certificateStatus === 'draft' ? 'Borrador' :
            certificateStatus === 'in-process' ? 'En Proceso' : 'Completado'
          }
          color={getStatusColor(certificateStatus)}
          variant="outlined"
          size="small"
          sx={{ fontSize: '0.75rem' }}
        />
      </Box>

      {/* Opciones de validez mejoradas */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
          Tipo de Validez
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: validityOption === 'option-c' ? '2fr 1fr' : '1fr' }, 
          gap: 1.5,
          mb: 1
        }}>
          <FormControl size="small" fullWidth variant="outlined">
            <InputLabel>Seleccionar tipo</InputLabel>
            <Select
              value={validityOption}
              label="Seleccionar tipo"
              onChange={(e) => setValidityOption(e.target.value as ValidityOption | '')}
              sx={{ 
                bgcolor: 'background.paper',
                '& .MuiSelect-select': { 
                  fontSize: '0.875rem',
                  py: 1
                }
              }}
            >
              <MenuItem value="">
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  Seleccionar una opción...
                </Typography>
              </MenuItem>
              <MenuItem value="option-a">
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    🤖 Automática (30 días)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    Se calcula automáticamente
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="option-b">
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    ⚖️ Validación Estricta (30 días)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    Ambas fechas editables, exactamente 30 días
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="option-c">
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    🔧 Personalizada
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    Seleccionar días específicos
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {validityOption === 'option-c' && (
            <FormControl size="small" variant="outlined">
              <InputLabel>Días</InputLabel>
              <Select
                value={customValidityDays}
                label="Días"
                onChange={(e) => setCustomValidityDays(e.target.value as number)}
                sx={{ 
                  bgcolor: 'background.paper',
                  '& .MuiSelect-select': { 
                    fontSize: '0.875rem',
                    py: 1
                  }
                }}
              >
                <MenuItem value={15}>15 días</MenuItem>
                <MenuItem value={30}>30 días</MenuItem>
                <MenuItem value={45}>45 días</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Info visual mejorada - solo aparece cuando se selecciona un tipo */}
        {validityOption && (
          <Box sx={{ 
            p: 1.5, 
            bgcolor: 'rgba(102, 187, 106, 0.04)', 
            border: '1px solid', 
            borderColor: 'rgba(102, 187, 106, 0.2)',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AutoAwesome sx={{ color: 'primary.main', fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'success.main', lineHeight: 1.4, fontWeight: 400 }}>
              {validityOption === 'option-a' && 
                'La fecha de expiración se calculará automáticamente 30 días después del inicio.'
              }
              {validityOption === 'option-b' && 
                'Puedes editar ambas fechas, pero deben estar exactamente 30 días separadas.'
              }
              {validityOption === 'option-c' && 
                `La expiración se calculará automáticamente ${customValidityDays} días después del inicio.`
              }
            </Typography>
          </Box>
        )}
      </Box>

      <Stack spacing={1.5}>
        {/* Datos básicos en grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
          <Tooltip title="Número de folio generado automáticamente" arrow>
            <TextField 
              label="Folio (Automático)" 
              value={folio} 
              fullWidth 
              required
              size="small"
              disabled={true}
              error={showValidation && !folio}
              helperText={folio ? 'Folio generado automáticamente' : 'Cargando folio...'}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start"><Badge sx={{ fontSize: '1rem' }} /></InputAdornment>,
              }}
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontSize: '0.875rem', 
                  color: 'text.primary'
                }, 
                '& .MuiInputLabel-root': { 
                  fontSize: '0.875rem'
                }
              }}
            />
          </Tooltip>

          <Tooltip title="ID del remolque" arrow>
            <TextField 
              label="Remolque" 
              value={remolque} 
              onChange={(e) => setRemolque(e.target.value)} 
              fullWidth 
              required
              size="small"
              error={showValidation && !remolque}
              helperText={showValidation && !remolque ? 'Requerido' : ''}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LocalShipping sx={{ fontSize: '1rem' }} /></InputAdornment>,
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' }, '& .MuiInputLabel-root': { fontSize: '0.875rem' } }}
            />
          </Tooltip>

          <Tooltip title="Placas del vehículo" arrow>
            <TextField 
              label="Placas" 
              value={placas} 
              onChange={(e) => setPlacas(e.target.value)} 
              fullWidth 
              required
              size="small"
              error={showValidation && !placas}
              helperText={showValidation && !placas ? 'Requerido' : ''}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Assignment sx={{ fontSize: '1rem' }} /></InputAdornment>,
              }}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' }, '& .MuiInputLabel-root': { fontSize: '0.875rem' } }}
            />
          </Tooltip>
        </Box>

        {/* Fechas compactas */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Tooltip title="Fecha de inicio" arrow>
            <DatePicker
              label="Inicio"
              value={fechaInicio}
              onChange={(newValue) => setFechaInicio(newValue)}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  required: true,
                  size: 'small',
                  error: showValidation && !fechaInicio,
                  helperText: showValidation && !fechaInicio ? 'Requerido' : '',
                  sx: { '& .MuiInputBase-input': { fontSize: '0.875rem' }, '& .MuiInputLabel-root': { fontSize: '0.875rem' } }
                }
              }}
            />
          </Tooltip>
          
          <Tooltip 
            title={
              validityOption === 'option-a' || validityOption === 'option-c' 
                ? 'Calculada automáticamente' 
                : 'Debe ser exactamente 30 días después'
            } 
            arrow
          >
            <DatePicker
              label="Expiración"
              value={fechaFinal}
              onChange={(newValue) => setFechaFinal(newValue)}
              format="DD/MM/YYYY"
              disabled={validityOption === 'option-a' || validityOption === 'option-c'}
              slotProps={{
                textField: {
                  required: true,
                  size: 'small',
                  error: showValidation && (!fechaFinal || !isDateRangeValid || (validityOption === 'option-b' && !is30DaysValid)),
                  helperText: 
                    showValidation && !fechaFinal 
                      ? 'Requerido' 
                      : showValidation && validityOption === 'option-b' && !is30DaysValid
                        ? 'Debe ser 30 días'
                        : validityOption === 'option-a' || validityOption === 'option-c'
                          ? 'Auto'
                          : '',
                  sx: { '& .MuiInputBase-input': { fontSize: '0.875rem' }, '& .MuiInputLabel-root': { fontSize: '0.875rem' } }
                }
              }}
            />
          </Tooltip>
        </Box>

        {/* Info de duración compacta */}
        {fechaInicio && fechaFinal && (
          <Alert 
            severity={is30DaysValid ? 'success' : 'warning'}
            icon={is30DaysValid ? <CheckCircle sx={{ fontSize: '1rem' }} /> : <Error sx={{ fontSize: '1rem' }} />}
            sx={{ py: 0.5, fontSize: '0.75rem', '& .MuiAlert-message': { fontSize: '0.75rem' } }}
          >
            Duración: {fechaFinal.diff(fechaInicio, 'day')} días
            {validityOption === 'option-b' && !is30DaysValid && ' ⚠️ Debe ser 30'}
          </Alert>
        )}
        
        <Button 
          variant="contained" 
          onClick={handleGeneratePDF}
          disabled={!isFormValid || isGenerating}
          fullWidth
          size="small"
          sx={{ 
            mt: 1.5,
            py: 1,
            fontSize: '0.875rem',
            fontWeight: 600,
            minHeight: '36px'
          }}
        >
          {isGenerating ? 'Generando...' : 'Generar PDF'}
        </Button>
      </Stack>

      <Snackbar
        open={!!alert}
        autoHideDuration={4000}
        onClose={() => setAlert(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAlert(null)}
          severity={alert?.severity}
          sx={{ width: '100%', fontSize: '0.875rem' }}
        >
          {alert?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
