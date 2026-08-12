import { Case } from './case-service';
import { documentService } from './document-service';
import { AppDocument, Customer, OfferDraft } from './types';

export interface OfferSendReadinessResult {
  ready: boolean;
  errors: string[];
  warnings: string[];
}

/**
  Evaluates whether an offer is ready to be sent via email with PDF attachment.
 */
export function evaluateOfferSendReadiness(
  caseItem?: Case | null,
  offerDraft?: OfferDraft | null,
  document?: AppDocument | null,
  customer?: Customer | null
): OfferSendReadinessResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Offer Draft existence & status check
  if (!offerDraft) {
    errors.push('Kein Angebotsentwurf vorhanden.');
  } else {
    if (offerDraft.status === 'sent') {
      errors.push('Das Angebot wurde bereits versendet.');
    } else if (offerDraft.status !== 'pdf_created' && offerDraft.status !== 'ready_to_send') {
      errors.push(`Das Angebot hat den Status "${offerDraft.status}". Es muss im Status "pdf_created" oder "ready_to_send" sein.`);
    }

    if (!offerDraft.documentId) {
      errors.push('Keine Dokumenten-ID (documentId) im Angebotsentwurf hinterlegt.');
    }
  }

  // 2. Document existence & content check
  const targetDocId = offerDraft?.documentId;
  const docToValidate = document || (targetDocId ? documentService.getDocument(targetDocId) : null);

  if (!docToValidate) {
    errors.push('Das PDF-Dokument existiert nicht im Document Service.');
  } else {
    // Check type
    if (docToValidate.type !== 'Orientierungsangebot' && !docToValidate.docNumber.startsWith('AG') && !docToValidate.docNumber.startsWith('OA')) {
      warnings.push('Der Dokumenttyp weicht vom Standard-Angebotsschema ab.');
    }

    // Check dataUrl / downloadUrl / PDF content
    const hasDataUrl = !!docToValidate.dataUrl;
    const hasDownloadUrl = !!docToValidate.metadata?.downloadUrl;
    const isAvailable = docToValidate.metadata?.uploadStatus === 'available';

    if (!hasDataUrl && !hasDownloadUrl && !isAvailable) {
      errors.push('Das PDF-Dokument besitzt keinen Inhalt (dataUrl/downloadUrl fehlt).');
    } else if (hasDataUrl) {
      const dataUrl = docToValidate.dataUrl!;
      const isPdfHeader = dataUrl.startsWith('data:application/pdf') || dataUrl.includes('%PDF');
      if (!isPdfHeader) {
        errors.push('Das gespeicherte Dokument ist kein gültiges PDF-Format.');
      }
      
      // Check for empty dataUrl
      const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      if (!base64Part || base64Part.trim().length < 20) {
        errors.push('Das PDF-Dokument ist leer oder unvollständig.');
      }
    }
  }

  // 3. Customer & email address check
  if (!customer && !caseItem?.customerId) {
    // Check if customer draft email exists
    const draftEmail = caseItem?.customerDraft?.fields?.email?.value;
    if (!draftEmail) {
      errors.push('Es ist kein Kunde mit dem Vorgang verknüpft und keine Kunden-E-Mail vorhanden.');
    }
  }

  const recipientEmail = customer?.email || caseItem?.customerDraft?.fields?.email?.value;
  if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
    errors.push(`Gültige Empfänger-E-Mail-Adresse fehlt (aktuell: "${recipientEmail || ''}").`);
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings
  };
}
