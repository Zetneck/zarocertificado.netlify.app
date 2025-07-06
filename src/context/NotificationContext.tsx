import { createContext } from 'react';
import type { AlertColor } from '@mui/material';

export interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor, duration?: number) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
