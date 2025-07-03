import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  useTheme
} from '@mui/material';
import {
  Assignment,
  LocalShipping,
  Gavel,
  Info
} from '@mui/icons-material';
import { TransportStatusPanel } from './TransportStatusPanel';
import { TransportRegulationsInfo } from './TransportRegulationsInfo';
import { PreviewDisplay } from './PreviewDisplay';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sidebar-tabpanel-${index}`}
      aria-labelledby={`sidebar-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `sidebar-tab-${index}`,
    'aria-controls': `sidebar-tabpanel-${index}`,
  };
}

export function TransportTabsContainer() {
  const [value, setValue] = useState(0);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        backgroundColor: isDark 
          ? 'rgba(30, 41, 59, 0.95)' 
          : 'rgba(248, 250, 252, 0.95)',
        backdropFilter: 'blur(10px)',
        border: isDark 
          ? '2px solid rgba(129, 140, 248, 0.3)' 
          : '2px solid rgba(99, 102, 241, 0.1)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="fullWidth"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 3
            }
          }}
        >
          <Tab 
            icon={<LocalShipping fontSize="small" />} 
            label="Estado" 
            {...a11yProps(0)}
            iconPosition="start"
          />
          <Tab 
            icon={<Assignment fontSize="small" />} 
            label="Vista Previa" 
            {...a11yProps(1)}
            iconPosition="start"
          />
          <Tab 
            icon={<Gavel fontSize="small" />} 
            label="Regulaciones" 
            {...a11yProps(2)}
            iconPosition="start"
          />
          <Tab 
            icon={<Info fontSize="small" />} 
            label="Ayuda" 
            {...a11yProps(3)}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <TabPanel value={value} index={0}>
          <TransportStatusPanel />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: theme.palette.primary.main,
              fontWeight: 700,
              fontSize: '1.1rem',
              mb: 2
            }}
          >
            <Assignment sx={{ color: theme.palette.primary.main }} />
            VISTA PREVIA DEL CERTIFICADO
          </Typography>
          <PreviewDisplay />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <TransportRegulationsInfo />
        </TabPanel>
        
        <TabPanel value={value} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              color: theme.palette.primary.main,
              fontWeight: 600,
              mb: 2
            }}>
              🚛 Guía de Transporte Internacional
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Esta aplicación está diseñada específicamente para generar certificados de fumigación 
              para vehículos de transporte terrestre que realizan operaciones de importación y exportación.
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              ¿Por qué son importantes estos certificados?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              • Previenen la propagación de plagas entre países<br />
              • Son requeridos por aduanas internacionales<br />
              • Garantizan el cumplimiento de normativas fitosanitarias<br />
              • Evitan demoras y sanciones en fronteras
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Vigencia del certificado:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Los certificados tienen una vigencia máxima de <strong>30 días</strong> desde su emisión. 
              Esto asegura que el tratamiento de fumigación sea reciente y efectivo.
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Recomendaciones:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Renovar el certificado 7 días antes del vencimiento<br />
              • Mantener copias digitales y físicas durante el viaje<br />
              • Verificar requisitos específicos del país de destino<br />
              • Contactar con PROGILSA para renovaciones
            </Typography>
          </Box>
        </TabPanel>
      </Box>
    </Paper>
  );
}
