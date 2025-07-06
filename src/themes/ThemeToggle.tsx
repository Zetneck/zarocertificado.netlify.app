import { IconButton } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export const ThemeToggle = ({ mode, toggleMode }: { mode: string, toggleMode: () => void }) => (
  <IconButton onClick={toggleMode} color="inherit">
    {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
  </IconButton>
);
