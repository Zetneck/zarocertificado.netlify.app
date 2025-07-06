import { IconButton, Box } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ThemeToggleFloatingProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export function ThemeToggleFloating({ mode, toggleMode }: ThemeToggleFloatingProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1000
      }}
    >
      <IconButton
        onClick={toggleMode}
        sx={{
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(30, 41, 59, 0.9)' 
            : 'rgba(248, 250, 252, 0.9)',
          backdropFilter: 'blur(10px)',
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(129, 140, 248, 0.3)'
            : '1px solid rgba(99, 102, 241, 0.3)',
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(30, 41, 59, 1)' 
              : 'rgba(248, 250, 252, 1)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.3s ease-in-out',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(129, 140, 248, 0.3)'
            : '0 8px 32px rgba(99, 102, 241, 0.2)'
        }}
      >
        {mode === 'light' ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Box>
  );
}
