import { createContext } from 'react';
import type { AlertColor } from '@mui/material';

interface NotificationAction {
  label: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  onClick: () => void;
}

interface NotificationOptions {
  title?: string;
  duration?: number;
  actions?: NotificationAction[];
  showProgress?: boolean;
  metadata?: {
    folio?: string;
    placas?: string;
    fileName?: string;
    timestamp?: Date;
  };
}

export interface NotificationContextType {
  showNotification: (
    message: string, 
    severity?: AlertColor, 
    options?: NotificationOptions
  ) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
