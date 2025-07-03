import { createContext } from 'react';
import type { Dayjs } from 'dayjs';

export interface CertificateContextType {
  folio: string;
  setFolio: (value: string) => void;
  remolque: string;
  setRemolque: (value: string) => void;
  placas: string;
  setPlacas: (value: string) => void;
  fechaInicio: Dayjs | null;
  setFechaInicio: (value: Dayjs | null) => void;
  fechaFinal: Dayjs | null;
  setFechaFinal: (value: Dayjs | null) => void;
}

export const CertificateContext = createContext<CertificateContextType | undefined>(undefined);
