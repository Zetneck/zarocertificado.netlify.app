import jsPDF from 'jspdf';

export interface CertificateData {
  folio: string;
  remolque: string;
  placas: string;
  fechaInicio: string;
  fechaFinal: string;
}

export interface PDFResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

export const generatePDF = async (data: CertificateData): Promise<PDFResult> => {
  try {
    const { folio, remolque, placas, fechaInicio, fechaFinal } = data;
    
    // Validaciones detalladas
    const errors: string[] = [];
    if (!folio?.trim()) errors.push('Folio es requerido');
    if (!remolque?.trim()) errors.push('Remolque es requerido');
    if (!placas?.trim()) errors.push('Placas son requeridas');
    if (!fechaInicio?.trim()) errors.push('Fecha de inicio es requerida');
    if (!fechaFinal?.trim()) errors.push('Fecha final es requerida');
    
    if (errors.length > 0) {
      throw new Error(`Campos obligatorios faltantes: ${errors.join(', ')}`);
    }

    // Validar formato de fechas
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(fechaInicio)) {
      throw new Error('Formato de fecha de inicio inválido (DD/MM/YYYY)');
    }
    if (!dateRegex.test(fechaFinal)) {
      throw new Error('Formato de fecha final inválido (DD/MM/YYYY)');
    }

    // Validar que las fechas sean válidas
    const [diaInicio, mesInicio, añoInicio] = fechaInicio.split('/').map(Number);
    const [diaFinal, mesFinal, añoFinal] = fechaFinal.split('/').map(Number);
    
    const fechaInicioDate = new Date(añoInicio, mesInicio - 1, diaInicio);
    const fechaFinalDate = new Date(añoFinal, mesFinal - 1, diaFinal);
    
    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinalDate.getTime())) {
      throw new Error('Las fechas proporcionadas no son válidas');
    }
    
    if (fechaFinalDate < fechaInicioDate) {
      throw new Error('La fecha final no puede ser anterior a la fecha de inicio');
    }

    // Pre-cargar imágenes para mejor rendimiento en móvil
    const preloadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src + '?t=' + Date.now();
      });
    };

    // Intentar pre-cargar todas las imágenes
    const firmaAutorizadoSources = ['/firma-autorizado.png', './firma-autorizado.png', 'firma-autorizado.png'];
    const firmaTecnicoSources = ['/firma-tecnico.png', './firma-tecnico.png', 'firma-tecnico.png'];

    let firmaAutorizadoImg: HTMLImageElement | null = null;
    let firmaTecnicoImg: HTMLImageElement | null = null;

    // Pre-cargar firma autorizado
    for (const src of firmaAutorizadoSources) {
      try {
        firmaAutorizadoImg = await preloadImage(src);
        break;
      } catch {
        console.warn(`No se pudo cargar firma autorizado desde: ${src}`);
      }
    }

    // Pre-cargar firma técnico
    for (const src of firmaTecnicoSources) {
      try {
        firmaTecnicoImg = await preloadImage(src);
        break;
      } catch {
        console.warn(`No se pudo cargar firma técnico desde: ${src}`);
      }
    }

    // Crear PDF en orientación horizontal como en la imagen
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.width;
    const margin = 40;
    let currentY = 50;

    // Función para dibujar firma desde imagen pre-cargada
    const drawSignature = (img: HTMLImageElement | null, x: number, y: number, width: number = 100, height: number = 40) => {
      try {
        if (img) {
          // Crear un canvas con alta resolución para mejor calidad
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Usar dimensiones más altas para mejor calidad
          const scale = 3; // Aumentado para mejor calidad en móvil
          canvas.width = width * scale;
          canvas.height = height * scale;
          
          // Configurar el contexto para mejor calidad
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Fondo blanco para evitar transparencias problemáticas
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar la imagen en el canvas con alta calidad
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          
          // Convertir a data URL con máxima calidad
          const dataURL = canvas.toDataURL('image/png', 1.0);
          
          // Agregar la imagen al PDF
          doc.addImage(dataURL, 'PNG', x, y, width, height);
        }
        // Si no hay imagen, simplemente no agregar nada (líneas y texto se mantienen)
      } catch (error) {
        console.warn('Error procesando firma:', error);
        // Continuar sin la firma si hay error
      }
    };

    // Función auxiliar para dibujar líneas separadoras
    const drawSeparator = (y: number, weight: number = 1) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(weight);
      doc.line(margin, y, pageWidth - margin, y);
      return y + 15;
    };

    // Función para centrar texto
    const centerText = (text: string, y: number, fontSize: number = 12) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // CONFIGURAR TEXTO INICIAL
    doc.setTextColor(0, 0, 0);

    // ENCABEZADO - INFORMACIÓN DE LA EMPRESA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);

    // Información de la empresa
    const rightMargin = pageWidth - margin;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text('PROGILSA FUMIGACIONES S.A DE C.V', margin, currentY);
    doc.text('(81)223555354', margin, currentY + 12);
    doc.text('www.progilsafumigaciones.com', margin, currentY + 24);

    currentY += 50; // Ajustado tras retirar el logo

    // FOLIO en la esquina superior derecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const folioText = `FOLIO: ${folio}`;
    const folioWidth = doc.getTextWidth(folioText);
    doc.text(folioText, rightMargin - folioWidth, currentY);
    
    currentY += 25; // Reducido de 40

    // TÍTULO PRINCIPAL CENTRADO
    doc.setFont('helvetica', 'bold');
    centerText('CERTIFICADO DE FUMIGACIÓN', currentY, 24);
    currentY += 30; // Reducido de 40

    // SEPARADOR
    currentY = drawSeparator(currentY, 1);

    // TEXTO DE CERTIFICACIÓN CENTRADO
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    centerText('Por medio del presente se certifica la realización del servicio de fumigación', currentY);
    currentY += 20; // Reducido de 30

    // SEPARADOR
    currentY = drawSeparator(currentY, 1);

    // LAYOUT EN DOS COLUMNAS
    const leftColumnX = margin;
    const rightColumnX = pageWidth / 2 + 20;
    const startY = currentY;

    // COLUMNA IZQUIERDA
    let leftY = startY;
    
    // INFORMACIÓN DEL CLIENTE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORMACIÓN DEL CLIENTE', leftColumnX, leftY);
    leftY += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Empresa: RAM TRUCKING', leftColumnX, leftY);
    leftY += 15;
    doc.text('Empresa: RAM TRUCKING', leftColumnX, leftY);
    leftY += 20;

    doc.setFont('helvetica', 'bold');
    doc.text('DOMICILIO:', leftColumnX, leftY);
    leftY += 15;
    doc.setFont('helvetica', 'normal');
    doc.text('PRIVADA CANADÁ #65765', leftColumnX, leftY);
    leftY += 12;
    doc.text('PARQUE NEXXUS II (PATIO BRUJAS)', leftColumnX, leftY);
    leftY += 12;
    doc.text('CIÉNEGA DE FLORES, NL', leftColumnX, leftY);
    leftY += 25;

    // DATOS DEL VEHÍCULO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DATOS DE VEHÍCULO:', leftColumnX, leftY);
    leftY += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`REMOLQUE: ${remolque}`, leftColumnX, leftY);
    leftY += 15;
    doc.text(`PLACAS: ${placas}`, leftColumnX, leftY);
    leftY += 30;

    // COLUMNA DERECHA
    let rightY = startY;
    
    // DETALLES DE SERVICIO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DETALLES DE SERVICIO:', rightColumnX, rightY);
    rightY += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Tipo de servicio: Fumigación de caja seca de tráiler 53 pies', rightColumnX, rightY);
    rightY += 15;
    doc.text('Método de control: Nanotecnología', rightColumnX, rightY);
    rightY += 15;
    doc.text('Producto utilizado: PYBUTHRIN® 33', rightColumnX, rightY);
    rightY += 15;
    doc.text('Dosis y cantidad: Alta', rightColumnX, rightY);
    rightY += 15;
    doc.text('Recomendación: Realizar servicio en 30 días posteriores', rightColumnX, rightY);
    rightY += 15;
    doc.text('Áreas tratadas: Total', rightColumnX, rightY);
    rightY += 30;

    // Tomar la altura máxima de ambas columnas
    currentY = Math.max(leftY, rightY);

    // SEPARADOR
    currentY = drawSeparator(currentY, 1);

    // VIGENCIA DEL CERTIFICADO (CENTRADA EN CAJA)
    const vigenciaBoxY = currentY;
    const vigenciaBoxHeight = 40;
    const vigenciaBoxWidth = 300;
    const vigenciaBoxX = (pageWidth - vigenciaBoxWidth) / 2;

    // Dibujar caja de vigencia
    doc.setFillColor(240, 240, 240);
    doc.rect(vigenciaBoxX, vigenciaBoxY, vigenciaBoxWidth, vigenciaBoxHeight, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(vigenciaBoxX, vigenciaBoxY, vigenciaBoxWidth, vigenciaBoxHeight, 'S');

    // Texto de vigencia
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    centerText('VIGENCIA DEL CERTIFICADO', vigenciaBoxY + 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    centerText(`DEL: ${fechaInicio} AL ${fechaFinal}`, vigenciaBoxY + 30);

    currentY = vigenciaBoxY + vigenciaBoxHeight + 30;

    // SECCIÓN DE FIRMAS
    const signatureY = currentY;
    const leftSignatureX = margin + 80;
    const rightSignatureX = pageWidth - margin - 200;
    const signatureLineWidth = 120;

    // Firma izquierda - Autorizado por
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Cargar y dibujar firma del autorizado (encima de la línea)
    const firmaAutorizadoY = signatureY - 50; // Ajustado para firma más grande
    const firmaAutorizadoX = leftSignatureX + (signatureLineWidth - 120) / 2; // Centrada
    
    drawSignature(firmaAutorizadoImg, firmaAutorizadoX, firmaAutorizadoY, 120, 48);
    
    // Línea de firma izquierda
    doc.line(leftSignatureX, signatureY, leftSignatureX + signatureLineWidth, signatureY);
    
    // Centrar texto "Autorizado por" respecto a la línea
    const autorizadoText = 'Autorizado por';
    const autorizadoWidth = doc.getTextWidth(autorizadoText);
    const autorizadoX = leftSignatureX + (signatureLineWidth - autorizadoWidth) / 2;
    doc.text(autorizadoText, autorizadoX, signatureY + 15);
    
    // Centrar nombre respecto a la línea
    const nombreAutorizadoText = 'ING. XAVIER HÉCTOR CANTÚ';
    const nombreAutorizadoWidth = doc.getTextWidth(nombreAutorizadoText);
    const nombreAutorizadoX = leftSignatureX + (signatureLineWidth - nombreAutorizadoWidth) / 2;
    doc.text(nombreAutorizadoText, nombreAutorizadoX, signatureY + 28);

    // Firma derecha - Técnico responsable
    // Cargar y dibujar firma del técnico (encima de la línea)
    const firmaTecnicoY = signatureY - 45; // Ajustado para firma más grande
    const firmaTecnicoX = rightSignatureX + (signatureLineWidth - 100) / 2; // Centrada
    
    drawSignature(firmaTecnicoImg, firmaTecnicoX, firmaTecnicoY, 100, 40);
    
    doc.line(rightSignatureX, signatureY, rightSignatureX + signatureLineWidth, signatureY);
    
    // Centrar texto "Técnico responsable" respecto a la línea
    const tecnicoText = 'Técnico responsable';
    const tecnicoWidth = doc.getTextWidth(tecnicoText);
    const tecnicoX = rightSignatureX + (signatureLineWidth - tecnicoWidth) / 2;
    doc.text(tecnicoText, tecnicoX, signatureY + 15);
    
    // Centrar nombre respecto a la línea
    const nombreTecnicoText = 'JOSÉ JUAN RAMÍREZ GALVÁN';
    const nombreTecnicoWidth = doc.getTextWidth(nombreTecnicoText);
    const nombreTecnicoX = rightSignatureX + (signatureLineWidth - nombreTecnicoWidth) / 2;
    doc.text(nombreTecnicoText, nombreTecnicoX, signatureY + 28);

    currentY = signatureY + 40; // Reducido de 50

    // LICENCIA SANITARIA CENTRADA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    centerText('LICENCIA SANITARIA 18 AP 19 006 0416', currentY);
    currentY += 20; // Reducido de 25

    // NOTA FINAL
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10); // Aumentado de 9 a 10 para mejor visibilidad
    doc.setTextColor(0, 0, 0); // Color negro
    centerText('Este certificado garantiza que el vehículo ha sido fumigado según las normas establecidas', currentY);

    // Guardar el archivo
    const fileName = `certificado_fumigacion_${folio}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error generando PDF:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};
