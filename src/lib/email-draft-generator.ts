import { EmailResponseDraft, RequestedInformationField } from './types';
import { companyData } from './company-data';

export interface GenerateDraftTextParams {
  purpose: EmailResponseDraft['purpose'];
  originalSenderName?: string;
  originalSenderEmail?: string;
  originalSubject?: string;
  requestedFields?: RequestedInformationField[];
  customMessageText?: string;
  incomingText?: string;
  offerType?: 'orientation' | 'binding';
  docNumber?: string;
  validityDate?: string;
  grossTotal?: number;
  paidAmount?: number;
  outstandingAmount?: number;
  dueDate?: string;
}

export interface GeneratedDraftTextResult {
  subject: string;
  bodyText: string;
  language: 'de' | 'en';
}

export function formatGermanPrice(amount: number): string {
  const rounded = Math.round((amount || 0) * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerPart},${parts[1]} €`;
}

export function formatGermanDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('de-DE');
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.slice(0, 10).split('-');
    return `${d}.${m}.${y}`;
  }
  return dateStr;
}

export function getCentralCompanySignature(): string {
  return `Freundliche Grüße\n\n${companyData.name}\n${companyData.street}, ${companyData.zip} ${companyData.city}\nTel: ${companyData.phone} | ${companyData.email}\nwww.spedition-hueber.at`;
}

export function formatReplySubject(originalSubject?: string): string {
  if (!originalSubject || originalSubject.trim().length === 0) {
    return 'Ihre Umzugsanfrage - Spedition Hueber GmbH';
  }
  const clean = originalSubject.trim();
  if (/^(re|aw|fw|fwd):\s*/i.test(clean)) {
    return clean;
  }
  return `Re: ${clean}`;
}

export function detectLanguage(text?: string): 'de' | 'en' {
  if (!text) return 'de';
  const lower = text.toLowerCase();
  const enKeywords = ['moving', 'relocation', 'quote', 'inquiry', 'regards', 'apartment', 'furniture', 'hello'];
  const deKeywords = ['umzug', 'anfrage', 'grüße', 'angebot', 'wohnung', 'möbel', 'hallo', 'guten tag'];
  
  let enCount = 0;
  let deCount = 0;

  for (const word of enKeywords) {
    if (lower.includes(word)) enCount++;
  }
  for (const word of deKeywords) {
    if (lower.includes(word)) deCount++;
  }

  return enCount > deCount && enCount >= 2 ? 'en' : 'de';
}

export function formatSalutation(name?: string, language: 'de' | 'en' = 'de'): string {
  if (!name || name.trim().length === 0 || name.toLowerCase() === 'unbekannt') {
    return language === 'en' ? 'Dear Customer,' : 'Guten Tag,';
  }

  const cleanName = name.trim();

  // Check for gender titles
  if (/^herr\b/i.test(cleanName)) {
    const lastName = cleanName.replace(/^herr\b\s*/i, '').trim();
    return language === 'en' ? `Dear Mr. ${lastName},` : `Guten Tag Herr ${lastName},`;
  }
  if (/^frau\b/i.test(cleanName)) {
    const lastName = cleanName.replace(/^frau\b\s*/i, '').trim();
    return language === 'en' ? `Dear Ms. ${lastName},` : `Guten Tag Frau ${lastName},`;
  }

  // Split name to find last name if full name like "Max Mustermann"
  const parts = cleanName.split(/\s+/);
  if (parts.length > 1) {
    return language === 'en' ? `Dear ${cleanName},` : `Guten Tag ${cleanName},`;
  }

  return language === 'en' ? `Dear ${cleanName},` : `Guten Tag ${cleanName},`;
}

export function generateEmailResponseDraftText(params: GenerateDraftTextParams): GeneratedDraftTextResult {
  const language = detectLanguage(params.incomingText);
  const isOrientation = params.offerType === 'orientation';
  const docNumStr = params.docNumber ? ` – ${params.docNumber}` : '';
  const valDateStr = params.validityDate || '14 Tagen';

  let subject = formatReplySubject(params.originalSubject);
  if (params.purpose === 'offer_delivery') {
    if (params.originalSubject && params.originalSubject.trim().length > 0) {
      subject = formatReplySubject(params.originalSubject);
    } else {
      subject = isOrientation
        ? `Ihr unverbindliches Orientierungsangebot${docNumStr}`
        : `Ihr Umzugsangebot${docNumStr}`;
    }
  } else if (params.purpose === 'invoice_delivery') {
    const invLabel = params.docNumber ? `Ihre Rechnung ${params.docNumber}` : 'Ihre Rechnung';
    if (params.originalSubject && params.originalSubject.trim().length > 0) {
      const baseSub = formatReplySubject(params.originalSubject);
      subject = params.docNumber && !baseSub.includes(params.docNumber) ? `${baseSub} - ${invLabel}` : baseSub;
    } else {
      subject = invLabel;
    }
  } else if (params.purpose === 'payment_reminder') {
    const remLabel = params.docNumber ? `Zahlungserinnerung zu Rechnung ${params.docNumber}` : 'Zahlungserinnerung';
    if (params.originalSubject && params.originalSubject.trim().length > 0) {
      const baseSub = formatReplySubject(params.originalSubject);
      subject = params.docNumber && !baseSub.includes(params.docNumber) ? `${baseSub} - ${remLabel}` : baseSub;
    } else {
      subject = remLabel;
    }
  }

  const salutation = formatSalutation(params.originalSenderName, language);
  const signature = getCentralCompanySignature();

  let bodyText = '';

  if (language === 'en') {
    // English template
    switch (params.purpose) {
      case 'offer_delivery': {
        const offerWording = isOrientation
          ? 'our non-binding orientation estimate'
          : 'our offer';
        bodyText = `${salutation}\n\nthank you for your inquiry.\n\nAttached please find ${offerWording} for your upcoming move.\n\nPlease review the details at your convenience. If you have any questions or wish to make changes, simply reply to this email.\n\nThis quote is valid until ${valDateStr}.\n\n${signature}`;
        break;
      }
      case 'invoice_delivery': {
        const invNum = params.docNumber || 'RE-2026-00000';
        const grossStr = formatGermanPrice(params.grossTotal ?? 0);
        const outStr = formatGermanPrice(params.outstandingAmount ?? 0);
        const dueStr = formatGermanDate(params.dueDate);

        let paymentParagraph = '';
        if ((params.outstandingAmount ?? 0) <= 0) {
          paymentParagraph = 'The invoice has already been settled in full.';
        } else {
          paymentParagraph = `The outstanding amount of ${outStr} is due by ${dueStr}.\nPlease state invoice number ${invNum} as payment reference.`;
        }

        bodyText = `${salutation}\n\nthank you for your order.\n\nAttached please find invoice ${invNum} amounting to ${grossStr}.\n${paymentParagraph}\n\nIf you have any questions, feel free to reply to this email.\n\n${signature}`;
        break;
      }
      case 'payment_reminder': {
        const invNum = params.docNumber || 'RE-2026-00000';
        const grossStr = formatGermanPrice(params.grossTotal ?? 0);
        const outStr = formatGermanPrice(params.outstandingAmount ?? 0);
        const paidStr = formatGermanPrice(params.paidAmount ?? 0);
        const dueStr = formatGermanDate(params.dueDate);

        let amountPhrase = `that an outstanding amount of ${outStr} remains open for invoice ${invNum}.`;
        if ((params.paidAmount ?? 0) > 0) {
          amountPhrase = `that for invoice ${invNum} (total ${grossStr}), after accounting for your partial payment of ${paidStr}, a remaining balance of ${outStr} is still open.`;
        }

        bodyText = `${salutation}\n\nwhen reviewing our open accounts, we noticed ${amountPhrase}\n\nThe payment due date was ${dueStr}.\n\nIf you have already arranged payment, please disregard this notice.\n\nIf you have any questions regarding the invoice, please feel free to reply directly to this email.\n\n${signature}`;
        break;
      }
      case 'request_missing_information': {
        const fieldsList = (params.requestedFields || [])
          .map(f => `• ${f.label}`)
          .join('\n');

        bodyText = `${salutation}\n\nthank you for your inquiry regarding your move.\n\nIn order for us to prepare a tailored offer, we kindly require the following details:\n\n${fieldsList || '• Pickup address\n• Destination address\n• Preferred move date\n• Estimated apartment size'}\n\nYou can simply reply directly to this email with the requested information.\n\n${signature}`;
        break;
      }
      case 'schedule_viewing': {
        bodyText = `${salutation}\n\nthank you for your inquiry.\n\nTo provide an accurate moving quote, we would recommend a brief inspection appointment. Please let us know your availability in the coming days.\n\n${signature}`;
        break;
      }
      case 'callback_confirmation': {
        bodyText = `${salutation}\n\nthank you for your message.\n\nWe will be happy to call you back to discuss the details of your move. Please let us know your preferred telephone number and time slot.\n\n${signature}`;
        break;
      }
      case 'acknowledgement': {
        bodyText = `${salutation}\n\nthank you for contacting Spedition Hueber. We have received your inquiry and our team is currently processing it. We will get back to you shortly.\n\n${signature}`;
        break;
      }
      case 'general_reply':
      default: {
        bodyText = `${salutation}\n\nthank you for your email.\n\n${params.customMessageText || 'We are happy to assist you with your move. Please let us know if you have any questions.'}\n\n${signature}`;
        break;
      }
    }
  } else {
    // German template
    switch (params.purpose) {
      case 'offer_delivery': {
        const offerWording = isOrientation
          ? 'unser unverbindliches Orientierungsangebot'
          : 'unser Angebot';
        bodyText = `${salutation}\n\nvielen Dank für Ihre Anfrage.\n\nIm Anhang finden Sie ${offerWording} für Ihren geplanten Umzug.\n\nBitte prüfen Sie das Angebot in Ruhe. Bei Fragen oder Änderungswünschen können Sie direkt auf diese E-Mail antworten.\n\nDas Angebot ist bis zum ${valDateStr} gültig.\n\n${signature}`;
        break;
      }
      case 'invoice_delivery': {
        const invNum = params.docNumber || 'RE-2026-00000';
        const grossStr = formatGermanPrice(params.grossTotal ?? 0);
        const outStr = formatGermanPrice(params.outstandingAmount ?? 0);
        const dueStr = formatGermanDate(params.dueDate);

        let paymentParagraph = '';
        if ((params.outstandingAmount ?? 0) <= 0) {
          paymentParagraph = 'Die Rechnung ist bereits vollständig beglichen.';
        } else {
          paymentParagraph = `Der offene Betrag von ${outStr} ist bis zum ${dueStr} zahlbar.\nBitte geben Sie bei der Überweisung die Rechnungsnummer ${invNum} als Verwendungszweck an.`;
        }

        bodyText = `${salutation}\n\nvielen Dank für Ihren Auftrag.\n\nIm Anhang finden Sie die Rechnung ${invNum} über ${grossStr}.\n${paymentParagraph}\n\nBei Fragen können Sie direkt auf diese E-Mail antworten.\n\n${signature}`;
        break;
      }
      case 'payment_reminder': {
        const invNum = params.docNumber || 'RE-2026-00000';
        const grossStr = formatGermanPrice(params.grossTotal ?? 0);
        const outStr = formatGermanPrice(params.outstandingAmount ?? 0);
        const paidStr = formatGermanPrice(params.paidAmount ?? 0);
        const dueStr = formatGermanDate(params.dueDate);

        let amountPhrase = `dass zur Rechnung ${invNum} noch ein Betrag von ${outStr} offen ist.`;
        if ((params.paidAmount ?? 0) > 0) {
          amountPhrase = `dass zur Rechnung ${invNum} (Gesamtbetrag ${grossStr}) nach Berücksichtigung Ihrer bisherigen Teilzahlung von ${paidStr} noch ein Restbetrag von ${outStr} offen ist.`;
        }

        bodyText = `${salutation}\n\nbei der Durchsicht unserer offenen Posten ist uns aufgefallen, ${amountPhrase}\n\nDas Zahlungsziel war der ${dueStr}.\n\nFalls Sie die Zahlung bereits veranlasst haben, betrachten Sie diese Nachricht bitte als gegenstandslos.\n\nBei Fragen zur Rechnung können Sie direkt auf diese E-Mail antworten.\n\n${signature}`;
        break;
      }
      case 'request_missing_information': {
        const fieldsList = (params.requestedFields || [])
          .map(f => `• ${f.label}`)
          .join('\n');

        bodyText = `${salutation}\n\nvielen Dank für Ihre Anfrage bezüglich Ihres Umzugs.\n\nDamit wir ein passendes Angebot für Sie erstellen können, benötigen wir noch folgende Angaben:\n\n${fieldsList || '• Abholadresse\n• Zieladresse\n• Gewünschter Umzugstermin\n• Ungefähre Wohnungsgröße'}\n\nSie können uns die Informationen einfach als Antwort auf diese E-Mail senden.\n\n${signature}`;
        break;
      }
      case 'schedule_viewing': {
        bodyText = `${salutation}\n\nvielen Dank für Ihre Anfrage.\n\nUm Ihnen ein präzises und verbindliches Angebot zu erstellen, empfehlen wir eine kurze Besichtigung. Bitte teilen Sie uns mit, wann ein Termin für Sie am besten passt.\n\n${signature}`;
        break;
      }
      case 'callback_confirmation': {
        bodyText = `${salutation}\n\nvielen Dank für Ihre Nachricht.\n\nGerne rufen wir Sie zurück, um alle Details Ihres Umzugs persönlich zu besprechen. Bitte teilen Sie uns Ihre Telefonnummer und Ihr gewünschtes Zeitfenster mit.\n\n${signature}`;
        break;
      }
      case 'acknowledgement': {
        bodyText = `${salutation}\n\nvielen Dank für Ihre Anfrage bei der Spedition Hueber. Wir haben Ihre Nachricht erhalten und prüfen diese umgehend. Wir melden uns in Kürze mit weiteren Details bei Ihnen.\n\n${signature}`;
        break;
      }
      case 'general_reply':
      default: {
        bodyText = `${salutation}\n\nvielen Dank für Ihre E-Mail.\n\n${params.customMessageText || 'Wir stehen Ihnen für Ihren Umzug gerne zur Verfügung. Bei Fragen können Sie sich jederzeit an uns wenden.'}\n\n${signature}`;
        break;
      }
    }
  }

  return {
    subject,
    bodyText,
    language
  };
}
