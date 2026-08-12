import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const createJsPDFInstance = (...args: any[]) => {
  const ctor = (jsPDF as any).default || (jsPDF as any).jsPDF || jsPDF;
  return new ctor(...args);
};
import QRCode from 'qrcode';
import type { OfferItem } from '@/contexts/offer-context';
import type { Customer, Job } from '@/src/lib/types';
import { companyData } from '@/src/lib/company-data';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { uploadFileToDriveAction } from '@/src/app/actions';
import { logoBase64 as defaultLogoBase64 } from './logo-data';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatQuantity = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    return String(parseFloat(rounded.toFixed(1)));
};

const parseDateSafe = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  
  // Try parsing directly
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d;
  }
  
  // Try German format parsing: DD.MM.YYYY
  const parts = String(dateStr).split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
  }
  
  return new Date();
};

const addHeaderAndAddress = (doc: jsPDF, customer: Customer, logoBase64: string | null, docType?: string) => {
  const activeLogo = logoBase64 || defaultLogoBase64;
  if (activeLogo) {
    try {
      const logoWidth = 39 * 1.15;
      const imageProps = doc.getImageProperties(activeLogo);
      const logoHeight = (imageProps.height * logoWidth) / imageProps.width;
      const format = activeLogo.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(activeLogo, format, 20, 15, logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo to PDF.", e);
      doc.text('Logo', 20, 20);
    }
  } else {
     doc.text('Logo', 20, 20);
  }

  const companyDetails = [
    companyData.name,
    companyData.street,
    `${companyData.zip} ${companyData.city}`,
    `${companyData.email} | ${companyData.phone}`,
  ];
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(companyDetails, 190, 38, { align: 'right'});

  let finalAddress: string[] = [];
  const hasRechnungsadresse = customer.zusatzoptionen?.adresseNr1 || customer.zusatzoptionen?.adresseNr2;
  const isInvoice = docType && (docType.includes('Rechnung') || docType === 'Lieferschein' || docType.includes('Anzahlung'));
  
  if (isInvoice && hasRechnungsadresse) {
    finalAddress = [
      customer.zusatzoptionen?.adresseNr1 || '',
      customer.zusatzoptionen?.adresseNr2 || '',
      customer.zusatzoptionen?.adresseNr3 || '',
      customer.zusatzoptionen?.adresseNr4 || ''
    ];
  } else if (isInvoice && customer.zieladresse?.strasse) {
    finalAddress = [
      customer.name,
      customer.zieladresse.strasse,
    ];
  } else if (isInvoice && customer.abholadresse?.strasse) {
    finalAddress = [
      customer.name,
      customer.abholadresse.strasse,
    ];
  } else {
    finalAddress = [
      customer.name,
      customer.address?.street || '',
      `${customer.address?.zip || ''} ${customer.address?.city || ''}`,
      customer.address?.country || '',
    ];
  }

  const customerAddress = finalAddress.filter(line => line.trim());

  doc.setFontSize(8);
  doc.text('Empfänger', 20, 75);
  doc.setFontSize(10);
  doc.text(customerAddress, 20, 80);
};

const addDocumentDetails = (doc: jsPDF, type: string, number: string, leistungsdatum: string, customer: Customer, startTime?: string, endTime?: string, docDate?: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    let numLabel = 'Rechnungsnummer:';
    if (type === 'Orientierungsangebot') numLabel = 'Angebotsnummer:';
    if (type === 'Storno-Rechnung') numLabel = 'Storno-Rechnungsnummer:';
    if (type === 'Storno-Anzahlungsrechnung') numLabel = 'Storno-Anzahlungs-Nr.:';
    if (type === 'Anzahlung Rechnung') numLabel = 'Anzahlungsrechnungs-Nr.:';
    if (type === 'Lieferschein') numLabel = 'Lieferschein-Nr.:';

    const dateLabel = 'Datum:';

    const finalDocDate = docDate || format(new Date(), 'dd.MM.yyyy', { locale: de });

    const details = [
        { label: numLabel, value: number },
        { label: dateLabel, value: finalDocDate },
        { label: 'Leistungsdatum:', value: leistungsdatum },
        { label: 'Kundennummer:', value: customer.kundenNummer || customer.id.substring(0, 10) },
    ];
    
    if (startTime && endTime && type === 'Lieferschein') {
        details.splice(3, 0, { label: 'Zeit:', value: `${startTime} - ${endTime}` });
    }

    let yPos = 65;
    details.forEach(detail => {
        doc.text(detail.label, 190, yPos, { align: 'right' });
        doc.text(detail.value, 190, yPos + 4, { align: 'right' });
        yPos += 10;
    });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(type, 20, 120);
};

const addItemsTable = (doc: jsPDF, items: OfferItem[]) => {
    const tableColumn = ["POS", "Leistung", "Menge", "Tarif", "Gesamt"];
    const tableRows: any[][] = [];
    
    let subtotal = 0;

    items.forEach((item, index) => {
      const itemData = [
        index + 1,
        item.description,
        formatQuantity(item.quantity),
        formatCurrency(item.unitPrice),
        formatCurrency(item.total),
      ];
      tableRows.push(itemData);
      subtotal += item.total;
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 130,
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 220, 220],
        textColor: 0,
        fontStyle: 'bold',
      },
      styles: {
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      tableWidth: 170,
      margin: { left: 20 },
      columnStyles: {
          0: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right' },
      }
    });
    
    return subtotal;
};

const addTotals = async (doc: jsPDF, subtotal: number, startY: number, anzahlung: number, restbetrag: number, docNumber: string, docType: string) => {
    const vat = subtotal * 0.20;
    const total = subtotal + vat;
    const isAnzahlungRechnung = docType === 'Anzahlung Rechnung';
    const isOrientierungsangebot = docType === 'Orientierungsangebot';
    
    let totals: any[][] = [
        ['Netto', formatCurrency(subtotal)],
        ['zzgl. 20% MwSt.', formatCurrency(vat)],
        ['Brutto', formatCurrency(total)],
    ];
    
    if (anzahlung > 0 && !isOrientierungsangebot) {
        if (isAnzahlungRechnung) {
            totals.push(['zu zahlender Betrag', formatCurrency(anzahlung)]);
        } else {
            totals.push(['abzüglich Anzahlung', formatCurrency(-anzahlung)]);
            totals.push(['Restbetrag', formatCurrency(restbetrag)]);
        }
    }

    autoTable(doc, {
        body: totals,
        startY: startY,
        tableWidth: 80,
        margin: { left: 110 },
        theme: 'plain',
        styles: {
            fontStyle: 'bold',
            fontSize: 10,
        },
        columnStyles: {
            1: { halign: 'right' }
        },
        didParseCell: (data: any) => {
             const isBruttoRow = data.row.index === 2;
             const isLastRow = data.row.index === data.table.body.length - 1;

            if (isBruttoRow) {
                 data.cell.styles.textColor = 255;
                 data.cell.styles.fillColor = [105, 105, 105];
            }
             if (isLastRow && anzahlung > 0 && !isOrientierungsangebot) {
                 data.cell.styles.fontStyle = 'bold';
                 data.cell.styles.fontSize = 11;
             }
        }
    });

    return (doc as any).lastAutoTable.finalY;
};

const addFooter = (doc: jsPDF, finalY: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    const col1 = [`FN: ${companyData.companyRegistryNumber}`, `Landesgericht Innsbruck`, `UID: ${companyData.uidNumber}`];
    const col2 = ['Bankverbindung:', `IBAN: ${companyData.iban}`, `BIC: ${companyData.bic}`];
    const col3 = ['Sitz der Gesellschaft:', `${companyData.street},`, `${companyData.zip} ${companyData.city} Österreich`];
    
    const footerYPos = pageHeight - 30;
    doc.setLineWidth(0.1);
    doc.line(20, footerYPos - 5, 190, footerYPos - 5);

    doc.text(col1, 20, footerYPos);
    doc.text(col2, 80, footerYPos);
    doc.text(col3, 140, footerYPos);
  };

type OutputType = 'download' | 'send' | 'save' | 'blob';

const generateEPCQRCode = async (amount: number, reference: string, recipientName: string, iban: string, bic: string) => {
  const payload = [
    'BCD',
    '002',
    '1',
    'SCT',
    bic,
    recipientName,
    iban.replace(/\s/g, ''),
    `EUR${amount.toFixed(2)}`,
    '',
    reference,
    '',
    '',
  ].join('\n');
  
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 4
    });
  } catch (err) {
    console.error('QR-Code-Erstellung fehlgeschlagen:', err);
    return null;
  }
};

const defaultUpload = async (filename: string, buffer: ArrayBuffer, folderId: string) => {
  try {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
    const result = await uploadFileToDriveAction(folderId, filename, base64, 'application/pdf');
    if (result.error) {
      console.warn("Drive upload returned error:", result.error);
    }
  } catch (error) {
    console.warn("defaultUpload skipped or failed (expected in node test CLI context):", error);
  }
};

const generatePDF = async (
  type: 'Rechnung' | 'Anzahlung Rechnung' | 'Storno-Rechnung' | 'Storno-Anzahlungsrechnung' | 'Orientierungsangebot',
  customer: Customer,
  items: OfferItem[],
  logoBase64: string | null,
  outputType: OutputType,
  paymentTerms: string | null = null,
  docNumber: string,
  totalM3: number,
  leistungsdatum: string | undefined,
  anzahlung: number,
  restbetrag: number,
  handleUpload?: (filename: string, buffer: ArrayBuffer, folderId: string) => Promise<void>,
  driveFolderId?: string,
  docDate?: string
) => {
  const doc = createJsPDFInstance();
  const finalLeistungsdatum = leistungsdatum || format(new Date(), 'dd.MM.yyyy', { locale: de });

  addHeaderAndAddress(doc, customer, logoBase64, type);
  addDocumentDetails(doc, type, docNumber, finalLeistungsdatum, customer, undefined, undefined, docDate);

  const subtotal = addItemsTable(doc, items);
  const tableEndY = (doc as any).lastAutoTable.finalY;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const startY = tableEndY + 10;
  const rightBlockY = await addTotals(doc, subtotal, startY, anzahlung, restbetrag, docNumber, type);
  
  let infoBlockY = startY;

  const zeitwert = totalM3 > 0 ? (totalM3 / 4) * 1090 : 0;
  let infoText: string[] = [];

  if (type === 'Storno-Rechnung' || type === 'Storno-Anzahlungsrechnung') {
      infoText = [
          'Gutschrift / Stornierung der ursprünglichen Abrechnung.',
          'Sämtliche aufgeführte Beträge wurden storniert bzw. gutgeschrieben.'
      ];
  } else if (type === 'Orientierungsangebot') {
      infoText = [
          `Zeitwert (Versicherung): ${formatCurrency(zeitwert)}`,
          'Das Angebot basiert auf den vom Kunden bereitgestellten Informationen.',
          'Das Angebot basiert auf realistischen Erfahrungswerten.',
          'Dieses Angebot ist unverbindlich.'
      ];
  } else {
      infoText = [
          `Zeitwert (Versicherung): ${formatCurrency(zeitwert)}`,
          'Die Abrechnung basiert auf den vom Kunden bereitgestellten Informationen.',
          'Diese Abrechnung basiert auf realistischen Erfahrungswerten.',
      ];
  }

  if (paymentTerms && type !== 'Orientierungsangebot') {
      infoText.push(paymentTerms);
  }
  doc.text(infoText, 20, infoBlockY, {
      maxWidth: 80,
      lineHeightFactor: 1.5,
  });
  infoBlockY += infoText.length * 5 + 10;

  if (type === 'Anzahlung Rechnung') {
    const signatureY = Math.max(rightBlockY, infoBlockY) + 10;
    doc.setLineWidth(0.2);
    doc.line(110, signatureY, 190, signatureY);
    doc.text('(Unterschrift Kunde) nach Erhalt der Rechnung', 150, signatureY + 5, { align: 'center'});
  }

  addFooter(doc, rightBlockY);
  
  if ((type === 'Rechnung' || type === 'Anzahlung Rechnung') && subtotal > 0) {
    doc.addPage();
    const isAnzahlungRechnung = type === 'Anzahlung Rechnung';
    const finalAmount = isAnzahlungRechnung ? anzahlung : (anzahlung > 0 ? restbetrag : subtotal * 1.2);
    const qrCodeDataUrl = await generateEPCQRCode(finalAmount, docNumber, 'Mag.Harald Hueber', companyData.iban, companyData.bic);

    if (qrCodeDataUrl) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Einfach bezahlen per QR-Code', 105, 30, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Scannen Sie diesen QR-Code mit Ihrer Banking-App, um die Überweisung automatisch auszufüllen.', 105, 40, { align: 'center', maxWidth: 160 });

        const qrWidth = 80;
        const qrX = (doc.internal.pageSize.getWidth() - qrWidth) / 2;
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, 50, qrWidth, qrWidth);

        const detailsY = 140;
        doc.text(`Empfänger: Mag.Harald Hueber`, qrX, detailsY);
        doc.text(`IBAN: ${companyData.iban}`, qrX, detailsY + 7);
        doc.text(`BIC: ${companyData.bic}`, qrX, detailsY + 14);
        doc.text(`Betrag: ${formatCurrency(finalAmount)}`, qrX, detailsY + 21);
        doc.text(`Verwendungszweck: ${docNumber}`, qrX, detailsY + 28);
    }
  }

  let filename;
  if (type === 'Orientierungsangebot') {
    filename = `OA-${customer.name}.pdf`;
  } else {
    filename = `${type.replace(/ /g, '_')}-${docNumber}-${customer.name}.pdf`;
  }

  if (driveFolderId) {
      try {
          const uploadFn = handleUpload || defaultUpload;
          const pdfBuffer = doc.output('arraybuffer');
          await uploadFn(filename, pdfBuffer, driveFolderId);
          console.log(`Successfully uploaded ${filename} to Google Drive.`);
      } catch (e) {
          console.error(`Failed to upload ${filename} to Google Drive.`, e);
      }
  }

  if (outputType === 'download' || outputType === 'save') {
    if (typeof window !== 'undefined' && typeof (window as any).document !== 'undefined') {
      try {
        doc.save(filename);
      } catch (err) {
        console.warn('doc.save skipped in non-browser env:', err);
      }
    }
    const dataUrl = doc.output('dataurlstring');
  if (typeof window !== 'undefined') {
    (window as any).pdfDataUrls = (window as any).pdfDataUrls || {};
    (window as any).pdfDataUrls[docNumber] = dataUrl;
  }
  return { pdfOutput: null, filename, dataUrl };
  } else {
    const dataUrl = doc.output('dataurlstring');
  if (typeof window !== 'undefined') {
    (window as any).pdfDataUrls = (window as any).pdfDataUrls || {};
    (window as any).pdfDataUrls[docNumber] = dataUrl;
  }
  return { pdfOutput: doc.output('blob' as any), filename, dataUrl };
  }
};

export const generateOfferPDF = async (customer: Customer, items: OfferItem[], logoBase64: string | null, outputType: OutputType, paymentTerms: string | null = null, docId: string, totalM3: number, leistungsdatum?: string, anzahlung?: number, restbetrag?: number, handleUpload?: any, docDate?: string) => {
  const folderId = customer.driveFolderId || '1DRoWMJnfwVkSzqSisJl62Plx3c6B7VoC';
  return generatePDF('Anzahlung Rechnung', customer, items, logoBase64, outputType, paymentTerms, docId, totalM3, leistungsdatum, anzahlung || 0, restbetrag || 0, handleUpload, folderId, docDate);
};

export const generateOrientierungsangebotPDF = async (customer: Customer, items: OfferItem[], logoBase64: string | null, outputType: OutputType, docId: string, totalM3: number, leistungsdatum?: string, handleUpload?: any, docDate?: string) => {
    const folderId = customer.driveFolderId || '1DRoWMJnfwVkSzqSisJl62Plx3c6B7VoC';
    return generatePDF('Orientierungsangebot', customer, items, logoBase64, outputType, 'Dieses Angebot ist unverbindlich.', docId, totalM3, leistungsdatum, 0, 0, handleUpload, folderId, docDate);
};

export const generateInvoicePDF = async (customer: Customer, items: OfferItem[], logoBase64: string | null, outputType: OutputType, docId: string, totalM3: number, leistungsdatum?: string, anzahlung?: number, restbetrag?: number, handleUpload?: any, docDate?: string) => {
  const folderId = customer.driveFolderId || '18ST7pxnx3d42R2wrqk9l1ElJXwJLfIXX';
  const type = items.every(item => item.total <= 0) ? 'Storno-Rechnung' : 'Rechnung';
  return generatePDF(type, customer, items, logoBase64, outputType, null, docId, totalM3, leistungsdatum, anzahlung || 0, restbetrag || 0, handleUpload, folderId, docDate);
};

export const generateStornoInvoicePDF = async (customer: Customer, items: OfferItem[], logoBase64: string | null, outputType: OutputType, docId: string, totalM3: number, leistungsdatum?: string, anzahlung?: number, restbetrag?: number, handleUpload?: any, docDate?: string) => {
  const folderId = customer.driveFolderId || '18ST7pxnx3d42R2wrqk9l1ElJXwJLfIXX';
  const stornoItems = items.map(item => ({
    ...item,
    unitPrice: -Math.abs(item.unitPrice),
    total: -Math.abs(item.total)
  }));
  return generatePDF('Storno-Rechnung', customer, stornoItems, logoBase64, outputType, 'Stornierung / Gutschrift zur Rechnung.', docId, totalM3, leistungsdatum, 0, 0, handleUpload, folderId, docDate);
};

export const generateStornoAnzahlungsrechnungPDF = async (customer: Customer, items: OfferItem[], logoBase64: string | null, outputType: OutputType, docId: string, totalM3: number, leistungsdatum?: string, anzahlung?: number, restbetrag?: number, handleUpload?: any, docDate?: string) => {
  const folderId = customer.driveFolderId || '1DRoWMJnfwVkSzqSisJl62Plx3c6B7VoC';
  const stornoItems = items.map(item => ({
    ...item,
    unitPrice: -Math.abs(item.unitPrice),
    total: -Math.abs(item.total)
  }));
  return generatePDF('Storno-Anzahlungsrechnung', customer, stornoItems, logoBase64, outputType, 'Stornierung / Gutschrift zur Anzahlungsrechnung.', docId, totalM3, leistungsdatum, 0, 0, handleUpload, folderId, docDate);
};

export const generateLieferscheinPDF = async (
  customer: Customer,
  job: Job,
  gegenstaende: { name: string; count: string, isNew?: boolean, montage?: boolean }[],
  workers: string[],
  note: string,
  logoBase64: string | null,
  outputType: 'save' | 'blob',
  docNumber: string,
  totalM3: number,
  startTime: string,
  endTime: string,
  handleUpload?: (filename: string, buffer: ArrayBuffer, folderId: string) => Promise<void>,
  driveFolderId?: string,
  lieferscheinData?: {
    gesamtgewicht?: string;
    fahrzeuge?: string;
    fahrer?: string;
    monteure?: string;
    moebeltraeger?: string;
    verpacker?: string;
  }
) => {
    const doc = createJsPDFInstance();
    const leistungsdatum = format(parseDateSafe(job.scheduledAt), 'dd.MM.yyyy', { locale: de });

    const leftMargin = 20;
    const rightMargin = 20;
    const contentWidth = doc.internal.pageSize.getWidth() - leftMargin - rightMargin;
    const halfContentWidth = contentWidth / 2;
    const midPoint = leftMargin + halfContentWidth;

    addHeaderAndAddress(doc, customer, logoBase64, 'Lieferschein');
    addDocumentDetails(doc, 'Lieferschein', docNumber, leistungsdatum, customer, startTime, endTime);

    let finalY = 130;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Kundenkontakt:', leftMargin, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Telefon: ${customer.phone || 'Keine Angabe'}`, leftMargin + 35, finalY);
    
    finalY += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Abholadresse:', leftMargin, finalY, { maxWidth: halfContentWidth - 5 });
    doc.setFont('helvetica', 'normal');
    let abholLines = [job.abholadresse?.strasse || ''];
    if (job.abholadresse?.stockwerk) abholLines.push(`Stockwerk: ${job.abholadresse.stockwerk}`);
    if (job.abholadresse?.aufzug) abholLines.push(`Lift: ${job.abholadresse.aufzug}`);
    doc.text(abholLines, leftMargin, finalY + 5, { maxWidth: halfContentWidth - 5 });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Zieladresse:', midPoint, finalY, { maxWidth: halfContentWidth - 5 });
    doc.setFont('helvetica', 'normal');
    let zielLines = [job.zieladresse?.strasse || ''];
    if (job.zieladresse?.stockwerk) zielLines.push(`Stockwerk: ${job.zieladresse.stockwerk}`);
    if (job.zieladresse?.aufzug) zielLines.push(`Lift: ${job.zieladresse.aufzug}`);
    doc.text(zielLines, midPoint, finalY + 5, { maxWidth: halfContentWidth - 5 });
    
    finalY += 25;
    
    doc.setLineWidth(0.1);
    doc.line(leftMargin, finalY, leftMargin + contentWidth, finalY);
    finalY += 10;
    
    let leftY = finalY;
    let rightY = finalY;

    if (lieferscheinData) {
        doc.setFont('helvetica', 'bold');
        doc.text('Einsatzdetails:', leftMargin, leftY);
        leftY += 5;
        doc.setFont('helvetica', 'normal');
        if (lieferscheinData.gesamtgewicht) { doc.text(`Gesamtgewicht: ${lieferscheinData.gesamtgewicht}`, leftMargin, leftY); leftY += 5; }
        if (lieferscheinData.fahrzeuge) { doc.text(`Fahrzeug(e): ${lieferscheinData.fahrzeuge}`, leftMargin, leftY); leftY += 5; }
        if (lieferscheinData.fahrer) { doc.text(`Fahrer: ${lieferscheinData.fahrer}`, leftMargin, leftY); leftY += 5; }
        if (lieferscheinData.monteure) { doc.text(`Monteure: ${lieferscheinData.monteure}`, leftMargin, leftY); leftY += 5; }
        if (lieferscheinData.moebeltraeger) { doc.text(`Möbelträger: ${lieferscheinData.moebeltraeger}`, leftMargin, leftY); leftY += 5; }
        if (lieferscheinData.verpacker) { doc.text(`Verpacker: ${lieferscheinData.verpacker}`, leftMargin, leftY); leftY += 5; }
        leftY += 2;
    } else if (workers.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Eingeteilte Mitarbeiter:', leftMargin, leftY, { maxWidth: halfContentWidth - 5 });
        leftY += 5;
        doc.setFont('helvetica', 'normal');
        const workerLines = doc.splitTextToSize(workers.join(', '), halfContentWidth - 5);
        doc.text(workerLines, leftMargin, leftY);
        leftY += workerLines.length * 5;
    }
    
    if (totalM3 > 0) {
      const zeitwert = (totalM3 / 4) * 1090;
      doc.setFont('helvetica', 'bold');
      doc.text('Gesamtvolumen & Zeitwert:', leftMargin, leftY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${totalM3.toFixed(2)} m³ | Zeitwert (Versicherung): ${formatCurrency(zeitwert)}`, leftMargin, leftY + 10);
      leftY += 15;
    }

    const hasDistinctNote = note && note.trim() !== (customer.anmerkungen || '').trim() && note !== 'Bitte vorsichtig transportieren.';

    if (hasDistinctNote) {
        doc.setFont('helvetica', 'bold');
        doc.text('Wichtige Hinweise für das Team:', midPoint, rightY, { maxWidth: halfContentWidth - 5 });
        rightY += 5;
        doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(note, halfContentWidth - 5);
        doc.text(noteLines, midPoint, rightY);
        rightY += noteLines.length * 5;
    }
    
    let tableStartY = Math.max(leftY, rightY) + 5;
    
    const displayAnmerkungen = customer.anmerkungen || (note && !hasDistinctNote ? note : '');
    if (displayAnmerkungen) {
        doc.setFont('helvetica', 'bold');
        doc.text('Anmerkungen & Umzugsdetails:', leftMargin, tableStartY);
        tableStartY += 5;
        doc.setFont('helvetica', 'normal');
        const anmerkungenLines = doc.splitTextToSize(displayAnmerkungen, contentWidth);
        doc.text(anmerkungenLines, leftMargin, tableStartY);
        tableStartY += anmerkungenLines.length * 5 + 5;
    }

    const itemTableRows = gegenstaende.map(item => {
        let nameCell: any = item.name;
        let extraText: string[] = [];
        if (item.isNew) extraText.push("zusätzlich hinzugefügt");
        if (item.montage) extraText.push("Montage");
        
        if (extraText.length > 0) {
            nameCell = {
                content: `${item.name} (${extraText.join(', ')})`,
                styles: { textColor: [255, 0, 0] }
            };
        }
        return [nameCell, item.count];
    });

    autoTable(doc, {
        head: [['Gegenstand', 'Anzahl']],
        body: itemTableRows,
        startY: tableStartY,
        theme: 'grid',
        margin: { left: leftMargin, right: rightMargin },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: 0,
            fontStyle: 'bold',
        },
        columnStyles: {
            1: { halign: 'right' },
        },
    });

    const tableEndY = (doc as any).lastAutoTable.finalY;
    const signatureY = Math.max(tableEndY + 20, 230);

    doc.setLineWidth(0.2);
    doc.line(30, signatureY, 90, signatureY);
    doc.text('Unterschrift (Übergebend)', 60, signatureY + 5, { align: 'center' });

    doc.line(120, signatureY, 180, signatureY);
    doc.text('Unterschrift (Übernehmend)', 150, signatureY + 5, { align: 'center' });

    const filename = `Lieferschein-${docNumber}-${customer.name}.pdf`;
    const folderId = driveFolderId || customer.driveFolderId;

    if (folderId) {
        try {
            const uploadFn = handleUpload || defaultUpload;
            const pdfBuffer = doc.output('arraybuffer');
            await uploadFn(filename, pdfBuffer, folderId);
        } catch (e) {
            console.error(`Failed to automatically upload Lieferschein to Drive.`, e);
        }
    }

    if (outputType === 'blob') {
        const dataUrl = doc.output('dataurlstring');
  if (typeof window !== 'undefined') {
    (window as any).pdfDataUrls = (window as any).pdfDataUrls || {};
    (window as any).pdfDataUrls[docNumber] = dataUrl;
  }
  return { pdfOutput: doc.output('blob' as any), filename, dataUrl };
    } else {
        doc.save(filename);
        const dataUrl = doc.output('dataurlstring');
  if (typeof window !== 'undefined') {
    (window as any).pdfDataUrls = (window as any).pdfDataUrls || {};
    (window as any).pdfDataUrls[docNumber] = dataUrl;
  }
  return { pdfOutput: null, filename, dataUrl };
    }
};
