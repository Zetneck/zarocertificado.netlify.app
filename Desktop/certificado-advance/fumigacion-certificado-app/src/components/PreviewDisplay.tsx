import { useCertificateContext } from '../hooks/useCertificateContext';
import { CertificatePreview } from './CertificatePreview';

export function PreviewDisplay() {
  const { folio, remolque, placas, fechaInicio, fechaFinal } = useCertificateContext();

  return (
    <CertificatePreview
      folio={folio}
      remolque={remolque}
      placas={placas}
      fechaInicio={fechaInicio?.format('DD/MM/YYYY') || ''}
      fechaFinal={fechaFinal?.format('DD/MM/YYYY') || ''}
    />
  );
}
