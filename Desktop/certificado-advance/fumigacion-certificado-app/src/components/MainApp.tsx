import { CssBaseline, Container, Paper, Typography, Box, Fab, Drawer } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useState } from 'react';
import { Form } from './Form';
import { ThemeToggle } from '../themes/ThemeToggle';
import { lightTheme, darkTheme } from '../themes/theme';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { CertificateProvider } from '../context/CertificateContext';
import { RightSidebar } from './RightSidebar';
import { UserMenu } from './UserMenu';
import { Info } from '@mui/icons-material';
import 'dayjs/locale/es';

export function MainApp() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  
  const theme = mode === 'light' ? lightTheme : darkTheme;

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <ThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <CertificateProvider>
        {/* Contenedor principal con fondo moderno - SIN SCROLL GLOBAL */}
        <Box
          data-theme={mode}
          sx={{
            height: '100vh', // Altura fija, NO minHeight
            overflow: 'hidden', // Sin scroll global
            background: mode === 'dark' 
              ? `
                linear-gradient(135deg, 
                  #0f172a 0%, 
                  #1e293b 25%, 
                  #334155 50%, 
                  #1e293b 75%, 
                  #0f172a 100%
                ),
                radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
              `
              : `
                linear-gradient(135deg, 
                  #f8fafc 0%, 
                  #e2e8f0 25%, 
                  #cbd5e1 50%, 
                  #e2e8f0 75%, 
                  #f8fafc 100%
                ),
                radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
              `,
            backgroundAttachment: 'fixed',
            position: 'relative',
            // Efectos de modernización
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: mode === 'dark'
                ? 'linear-gradient(45deg, transparent 0%, rgba(99, 102, 241, 0.02) 50%, transparent 100%)'
                : 'linear-gradient(45deg, transparent 0%, rgba(99, 102, 241, 0.01) 50%, transparent 100%)',
              zIndex: 0,
              pointerEvents: 'none'
            }
          }}
        >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          {/* Layout principal responsive */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            height: '100vh',
            overflow: 'hidden'
          }}>
            {/* Columna izquierda - Formulario con altura exacta */}
            <Box sx={{ 
              width: { xs: '100%', lg: '55%' }, // Incrementé de 50% a 55% en pantallas grandes
              height: '100vh', // Altura exacta del viewport
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden' // Sin scroll en este nivel
            }}>
              <Container 
                maxWidth="md" // Cambio de "sm" a "md" para más ancho
                sx={{ 
                  py: { xs: 1, sm: 1.5, lg: 2 }, 
                  px: { xs: 1, sm: 2, md: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start', // Cambiar de center a flex-start
                  height: '100vh', // Altura exacta, NO minHeight
                  overflow: 'auto' // Scroll interno solo si es necesario
                }}
              >
                {/* Header con toggle de tema y menú de usuario */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: { xs: 0.5, sm: 1 },
                  mb: { xs: 0.5, sm: 1 },
                  position: { xs: 'sticky', lg: 'static' },
                  top: { xs: 0, lg: 'auto' },
                  zIndex: 10,
                  backgroundColor: { xs: 'rgba(0,0,0,0.1)', lg: 'transparent' },
                  backdropFilter: { xs: 'blur(10px)', lg: 'none' },
                  borderRadius: { xs: 2, lg: 0 },
                  p: { xs: 0.5, lg: 0 }
                }}>
                  <UserMenu />
                  <ThemeToggle mode={mode} toggleMode={toggleMode} />
                </Box>
                
                {/* Título moderno responsive - más compacto */}
                <Box sx={{ 
                  textAlign: 'center', 
                  mt: { xs: 0.5, sm: 1, lg: 1 }, 
                  mb: { xs: 1, sm: 1.5, lg: 2 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: { xs: 0.5, sm: 0.5, lg: 1 }
                }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '1.2rem', sm: '1.6rem', md: '2rem', lg: '2.2rem' }, // Reducido
                      letterSpacing: '-0.02em',
                      background: mode === 'dark'
                        ? 'linear-gradient(45deg, #818cf8, #22d3ee, #34d399)'
                        : 'linear-gradient(45deg, #6366f1, #06b6d4, #10b981)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: mode === 'dark' ? '0 0 30px rgba(129, 140, 248, 0.4)' : 'none',
                      mb: { xs: 0.5, sm: 0.5 },
                      animation: 'gradientShift 3s ease-in-out infinite alternate',
                      '@keyframes gradientShift': {
                        '0%': { 
                          backgroundPosition: '0% 50%' 
                        },
                        '100%': { 
                          backgroundPosition: '100% 50%' 
                        }
                      }
                    }}
                  >
                    Generador de Certificados
                  </Typography>
                  
                  {/* Logo de Zaro - más compacto con filtro de inversión corregido */}
                  <Box
                    component="img"
                    src="/Logo-Zaro.png"
                    alt="Logo Zaro"
                    sx={{
                      height: { xs: 40, sm: 50, md: 60 }, // Reducido
                      width: 'auto',
                      maxWidth: '250px', // Reducido
                      objectFit: 'contain',
                      filter: mode === 'dark' 
                        ? 'brightness(1.1) drop-shadow(0 0 20px rgba(129, 140, 248, 0.4)) invert(0) contrast(1.1) saturate(1.2)' 
                        : 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.2)) invert(1) contrast(1) saturate(1)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', // Transición más suave
                      '&:hover': {
                        transform: 'scale(1.05)',
                        filter: mode === 'dark' 
                          ? 'brightness(1.2) drop-shadow(0 0 25px rgba(129, 140, 248, 0.6)) invert(0) contrast(1.2) saturate(1.3)' 
                          : 'drop-shadow(0 4px 16px rgba(99, 102, 241, 0.3)) invert(1) contrast(1.1) saturate(1.1)'
                      }
                    }}
                    onError={(e) => {
                      // Fallback si no se encuentra la imagen
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      // Mostrar texto como fallback
                      const fallbackText = document.createElement('div');
                      fallbackText.innerHTML = 'ZARO';
                      fallbackText.style.fontSize = '2rem';
                      fallbackText.style.fontWeight = '300';
                      fallbackText.style.color = mode === 'dark' ? '#818cf8' : '#6366f1';
                      fallbackText.style.letterSpacing = '0.1em';
                      fallbackText.style.textTransform = 'uppercase';
                      target.parentNode?.appendChild(fallbackText);
                    }}
                  />
                </Box>

                <Paper sx={{ 
                  p: { xs: 2, sm: 3, lg: 4 }, // Incrementé el padding
                  mt: { xs: 0.5, sm: 0.5 }, 
                  borderRadius: 3,
                  backgroundColor: mode === 'dark' 
                    ? 'rgba(30, 41, 59, 0.95)' 
                    : 'rgba(248, 250, 252, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: mode === 'dark'
                    ? '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(129, 140, 248, 0.2)'
                    : '0 25px 50px rgba(99, 102, 241, 0.1), 0 0 0 1px rgba(99, 102, 241, 0.1)',
                  border: mode === 'dark'
                    ? '1px solid rgba(129, 140, 248, 0.2)'
                    : '1px solid rgba(99, 102, 241, 0.1)',
                  // Mejoras específicas para móviles
                  maxWidth: { xs: '100%', sm: '100%' },
                  mx: { xs: 0, sm: 'auto' },
                  // IMPORTANTE: flex-shrink para evitar overflow
                  flex: '0 1 auto', // No crecer, pero sí encogerse si es necesario
                  maxHeight: { xs: 'calc(100vh - 160px)', sm: 'calc(100vh - 180px)', lg: 'calc(100vh - 200px)' }, // Altura máxima
                  overflow: 'auto' // Scroll interno si el formulario es muy largo
                }}>
                  <Form />
                </Paper>
              </Container>
            </Box>

            {/* Columna derecha - Sidebar completo (solo en pantallas grandes) */}
            <Box sx={{ 
              width: '45%', // Ajustado de 50% a 45% para dar más espacio al formulario
              height: '100vh', // Altura exacta
              display: { xs: 'none', lg: 'block' },
              p: 2, // Padding reducido
              backgroundColor: mode === 'dark' 
                ? 'rgba(15, 23, 42, 0.4)' 
                : 'rgba(248, 250, 252, 0.4)',
              backdropFilter: 'blur(10px)',
              borderLeft: mode === 'dark' 
                ? '1px solid rgba(129, 140, 248, 0.2)' 
                : '1px solid rgba(99, 102, 241, 0.2)',
              overflow: 'hidden' // Sin scroll en este nivel
            }}>
              <Box sx={{ 
                height: '100%', // Altura completa
                overflow: 'auto' // Scroll interno solo si es necesario
              }}>
                <RightSidebar />
              </Box>
            </Box>
          </Box>

          {/* Drawer móvil para el sidebar */}
          <Drawer
            anchor="right"
            open={mobileDrawerOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Mejor rendimiento en móviles
            }}
            sx={{
              display: { xs: 'block', lg: 'none' },
              '& .MuiDrawer-paper': {
                width: '85vw',
                maxWidth: 400,
                backgroundColor: mode === 'dark' 
                  ? 'rgba(15, 23, 42, 0.95)' 
                  : 'rgba(248, 250, 252, 0.95)',
                backdropFilter: 'blur(20px)',
                borderLeft: mode === 'dark' 
                  ? '1px solid rgba(129, 140, 248, 0.3)' 
                  : '1px solid rgba(99, 102, 241, 0.3)'
              }
            }}
          >
            <Box sx={{ 
              p: 2,
              height: '100%',
              overflow: 'auto'
            }}>
              <RightSidebar />
            </Box>
          </Drawer>

          {/* Botón flotante para abrir sidebar en móviles */}
          <Fab
            color="primary"
            onClick={handleDrawerToggle}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              display: { xs: 'flex', lg: 'none' },
              zIndex: 1000,
              backgroundColor: mode === 'dark' 
                ? theme.palette.primary.dark 
                : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: mode === 'dark' 
                  ? theme.palette.primary.main 
                  : theme.palette.primary.dark,
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease-in-out',
              boxShadow: mode === 'dark'
                ? '0 8px 32px rgba(129, 140, 248, 0.4)'
                : '0 8px 32px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Info />
          </Fab>
        </LocalizationProvider>
      </Box>
      </CertificateProvider>
    </ThemeProvider>
  );
}
