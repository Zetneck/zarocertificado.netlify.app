import { Box, TextField, Button, Stack, Alert, Snackbar, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState, useMemo } from 'react';
import { generatePDF } from '../utils/pdfGenerator';
import type { CertificateData } from '../utils/pdfGenerator';
import { useCertificateContext } from '../hooks/useCertificateContext';
import type { Dayjs } from 'dayjs';

export function Form() {
  const { 
    folio, setFolio,
    remolque, setRemolque,
    placas, setPlacas,
    fechaInicio, setFechaInicio,
    fechaFinal, setFechaFinal
  } = useCertificateContext();
  
  const [alert, setAlert] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Sugerir fecha de vencimiento (29 días después del inicio para total de 30 días)
  const fechaSugerida = useMemo(() => {
    if (!fechaInicio) return null;
    return fechaInicio.add(29, 'day'); // 30 días de vigencia total (inclusivo)
  }, [fechaInicio]);

  // Validar que la fecha final no sea anterior a la fecha de inicio
  const isDateRangeValid = useMemo(() => {
    if (!fechaInicio || !fechaFinal) return true;
    return fechaFinal.isAfter(fechaInicio) || fechaFinal.isSame(fechaInicio, 'day');
  }, [fechaInicio, fechaFinal]);

  // Aplicar sugerencia automática cuando se selecciona fecha de inicio
  const handleFechaInicioChange = (newValue: Dayjs | null) => {
    setFechaInicio(newValue);
    if (newValue && !fechaFinal) {
      // Solo aplicar sugerencia si no hay fecha final establecida
      setFechaFinal(newValue.add(29, 'day'));
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

    setIsGenerating(true);
    setAlert(null);

    try {
      const data: CertificateData = {
        folio,
        remolque,
        placas,
        fechaInicio: fechaInicio?.format('DD/MM/YYYY') || '',
        fechaFinal: fechaFinal?.format('DD/MM/YYYY') || '',
      };

      const result = await generatePDF(data);

      if (result.success) {
        setAlert({
          message: `PDF generado exitosamente: ${result.fileName}`,
          severity: 'success'
        });
      } else {
        setAlert({
          message: `Error al generar PDF: ${result.error}`,
          severity: 'error'
        });
      }
    } catch (error) {
      setAlert({
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        severity: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = folio && remolque && placas && fechaInicio && fechaFinal && isDateRangeValid;

  return (
    <Box component="form" noValidate autoComplete="off">
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          mb: { xs: 2.5, sm: 3.5 }, // Incrementé el margen inferior
          textAlign: 'center', 
          fontWeight: 600,
          fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
        }}
      >
        Datos del Certificado
      </Typography>
      
      <Stack spacing={{ xs: 2.5, sm: 3 }}> {/* Incrementé el espaciado entre campos */}
        <TextField 
          label="Folio" 
          value={folio} 
          onChange={(e) => {
            setFolio(e.target.value);
            // Si el usuario está escribiendo, ocultar el error para ese campo
            if (e.target.value && showValidation) {
              // El error se ocultará automáticamente porque ya no cumple la condición
            }
          }} 
          fullWidth 
          required
          error={showValidation && !folio}
          helperText={showValidation && !folio ? 'El folio es obligatorio' : ''}
        />
        <TextField 
          label="Remolque" 
          value={remolque} 
          onChange={(e) => {
            setRemolque(e.target.value);
          }} 
          fullWidth 
          required
          error={showValidation && !remolque}
          helperText={showValidation && !remolque ? 'El remolque es obligatorio' : ''}
        />
        <TextField 
          label="Placas" 
          value={placas} 
          onChange={(e) => {
            setPlacas(e.target.value);
          }} 
          fullWidth 
          required
          error={showValidation && !placas}
          helperText={showValidation && !placas ? 'Las placas son obligatorias' : ''}
        />
        
        <DatePicker
          label="Fecha de Inicio"
          value={fechaInicio}
          onChange={handleFechaInicioChange}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              required: true,
              error: showValidation && !fechaInicio,
              helperText: showValidation && !fechaInicio ? 'La fecha de inicio es obligatoria' : ''
            }
          }}
        />
        
        <DatePicker
          label="Fecha de Finalización"
          value={fechaFinal}
          onChange={(newValue) => setFechaFinal(newValue)}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              required: true,
              error: showValidation && (!fechaFinal || !isDateRangeValid),
              helperText: showValidation && !fechaFinal 
                ? 'La fecha final es obligatoria' 
                : showValidation && !isDateRangeValid 
                  ? 'La fecha final debe ser igual o posterior a la fecha de inicio'
                  : ''
            }
          }}
        />
        
        {/* Mostrar sugerencia de vigencia estándar */}
        {fechaInicio && fechaSugerida && (
          <Box sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              💡 <strong>Sugerencia:</strong> Para certificados de fumigación estándar
            </Typography>
            <Typography variant="body2">
              Fecha sugerida de finalización: <strong>{fechaSugerida.format('DD/MM/YYYY')}</strong> (30 días de vigencia total)
            </Typography>
            {fechaFinal && !fechaFinal.isSame(fechaSugerida, 'day') && (
              <Button 
                size="small" 
                variant="outlined" 
                sx={{ mt: 1, color: 'inherit', borderColor: 'currentColor' }}
                onClick={() => setFechaFinal(fechaSugerida)}
              >
                Usar fecha sugerida
              </Button>
            )}
          </Box>
        )}
        
        <Button 
          variant="contained" 
          onClick={handleGeneratePDF}
          disabled={!isFormValid || isGenerating}
          fullWidth
          size="large"
          sx={{ 
            mt: { xs: 2.5, sm: 3 }, // Incrementé el margen superior
            py: { xs: 1.5, sm: 2 }, // Incrementé el padding vertical
            fontSize: { xs: '1rem', sm: '1.1rem' }, // Incrementé el tamaño de fuente
            fontWeight: 600,
            minHeight: '48px' // Tamaño mínimo recomendado para accesibilidad
          }}
          aria-label={isGenerating ? 'Generando certificado PDF...' : 'Generar certificado PDF'}
        >
          {isGenerating ? 'Generando PDF...' : 'Generar PDF'}
        </Button>
      </Stack>

      <Snackbar
        open={!!alert}
        autoHideDuration={6000}
        onClose={() => setAlert(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAlert(null)}
          severity={alert?.severity}
          sx={{ width: '100%' }}
        >
          {alert?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
