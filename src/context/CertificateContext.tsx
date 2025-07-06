import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Dayjs } from 'dayjs';
import { CertificateContext } from './CertificateContextDefinition';

export function CertificateProvider({ children }: { children: ReactNode }) {
  const [folio, setFolio] = useState('');
  const [remolque, setRemolque] = useState('');
  const [placas, setPlacas] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFinal, setFechaFinal] = useState<Dayjs | null>(null);

  return (
    <CertificateContext.Provider value={{
      folio, setFolio,
      remolque, setRemolque,
      placas, setPlacas,
      fechaInicio, setFechaInicio,
      fechaFinal, setFechaFinal
    }}>
      {children}
    </CertificateContext.Provider>
  );
}
