import { useContext } from 'react';
import { CertificateContext } from '../context/CertificateContextDefinition';

export function useCertificateContext() {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error(
      'useCertificateContext debe ser usado dentro de un CertificateProvider. ' +
      'Asegúrate de que el componente esté envuelto en <CertificateProvider>.'
    );
  }
  return context;
}
