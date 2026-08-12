import { Case } from './case-service';
import { caseService } from './case-service';
import { documentService } from './document-service';
import { crmLookupService } from './crm-lookup-service';
import type { InvoiceDraft, EmailResponseDraft } from './types';

export type InvoiceSendReadinessStatus =
  | 'ready'
  | 'missing_invoice'
  | 'missing_document'
  | 'invalid_document'
  | 'missing_recipient'
  | 'invalid_recipient'
  | 'missing_receivable'
  | 'already_sent'
  | 'sending'
  | 'cancelled'
  | 'blocked';

export interface InvoiceSendReadiness {
  status: InvoiceSendReadinessStatus;
  ready: boolean;
  errors: string[];
  warnings: string[];
}

export function evaluateInvoiceSendReadiness(
  caseItem: Case,
  invoiceDraft?: InvoiceDraft | null,
  emailDraft?: EmailResponseDraft | null
): InvoiceSendReadiness {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Invoice Draft existence check
  if (!invoiceDraft) {
    return {
      status: 'missing_invoice',
      ready: false,
      errors: ['Kein Rechnungsentwurf vorhanden.'],
      warnings
    };
  }

  // 2. Cancellation check
  if (invoiceDraft.status === 'cancelled' || invoiceDraft.status === 'storno' || (invoiceDraft.status as string) === 'rejected') {
    return {
      status: 'cancelled',
      ready: false,
      errors: ['Die Rechnung wurde storniert, abgelehnt oder storniert.'],
      warnings
    };
  }

  // 3. Already sent check
  if (invoiceDraft.sentAt || emailDraft?.status === 'sent') {
    return {
      status: 'already_sent',
      ready: false,
      errors: ['Die Rechnung wurde bereits per E-Mail versendet.'],
      warnings
    };
  }

  // 4. Currently sending check
  if (emailDraft?.status === 'sending') {
    return {
      status: 'sending',
      ready: false,
      errors: ['Der Rechnungsversand wird derzeit verarbeitet.'],
      warnings
    };
  }

  // 5. Check IDs
  if (!invoiceDraft.invoiceId) {
    errors.push('Fehlende Invoice-ID für die Rechnung.');
  }
  if (!invoiceDraft.documentId) {
    errors.push('Fehlende Dokument-ID für die Rechnungs-PDF.');
  }

  if (errors.length > 0) {
    return {
      status: 'missing_invoice',
      ready: false,
      errors,
      warnings
    };
  }

  // 6. Check PDF Document in DocumentService
  const doc = documentService.getDocument(invoiceDraft.documentId!);
  if (!doc) {
    return {
      status: 'missing_document',
      ready: false,
      errors: [`Rechnungs-PDF (Doc-ID: ${invoiceDraft.documentId}) wurde nicht im Document Service gefunden.`],
      warnings
    };
  }

  const hasDataUrl = !!doc.dataUrl && doc.dataUrl.trim().length >= 20;
  const hasDownloadUrl = !!doc.metadata?.downloadUrl;
  const isAvailable = doc.metadata?.uploadStatus === 'available';

  if (!hasDataUrl && !hasDownloadUrl && !isAvailable) {
    return {
      status: 'invalid_document',
      ready: false,
      errors: ['Das Rechnungs-PDF-Dokument ist leer oder unvollständig.'],
      warnings
    };
  }

  if (!doc.dataUrl) {
    return {
      status: 'invalid_document',
      ready: false,
      errors: ['Das Rechnungs-PDF-Dokument ist leer oder unvollständig.'],
      warnings
    };
  }

  const rawPdfData = doc.dataUrl.includes(',') ? doc.dataUrl.split(',')[1] : doc.dataUrl;
  if (!rawPdfData || rawPdfData.trim().length === 0) {
    return {
      status: 'invalid_document',
      ready: false,
      errors: ['Kein gültiger Base64-PDF-Inhalt vorhanden.'],
      warnings
    };
  }

  // 7. Check Receivable existence
  const receivables = caseService.getReceivables(caseItem.id) || [];
  const receivable = receivables.find(
    r => r.invoiceDraftId === invoiceDraft.id || r.invoiceId === invoiceDraft.invoiceId
  );
  if (!receivable) {
    return {
      status: 'missing_receivable',
      ready: false,
      errors: ['Kein offener Posten (Receivable) für diese Rechnung gefunden.'],
      warnings
    };
  }

  // 8. Check Customer and Recipient Email
  let recipientEmail = emailDraft?.recipients?.[0]?.email;
  if (!recipientEmail) {
    const customer = crmLookupService.findCustomerForCase(caseItem);
    recipientEmail = customer?.email || caseItem.customerDraft?.fields?.email?.value || undefined;
  }

  if (!recipientEmail || recipientEmail.trim().length === 0) {
    return {
      status: 'missing_recipient',
      ready: false,
      errors: ['Keine Empfänger-E-Mail-Adresse für den Rechnungsversand vorhanden.'],
      warnings
    };
  }

  if (!recipientEmail.includes('@') || recipientEmail.trim().length < 5) {
    return {
      status: 'invalid_recipient',
      ready: false,
      errors: [`Ungültige E-Mail-Adresse: "${recipientEmail}"`],
      warnings
    };
  }

  // 9. Check Invoice Number & Amounts
  if (!invoiceDraft.invoiceNumber || invoiceDraft.invoiceNumber.trim().length === 0) {
    return {
      status: 'blocked',
      ready: false,
      errors: ['Fehlende Rechnungsnummer.'],
      warnings
    };
  }

  if (typeof invoiceDraft.grossTotal !== 'number' || isNaN(invoiceDraft.grossTotal) || invoiceDraft.grossTotal < 0) {
    return {
      status: 'blocked',
      ready: false,
      errors: ['Ungültiger Rechnungsgesamtbetrag.'],
      warnings
    };
  }

  if (typeof invoiceDraft.outstandingAmount !== 'number' || isNaN(invoiceDraft.outstandingAmount) || invoiceDraft.outstandingAmount < 0) {
    return {
      status: 'blocked',
      ready: false,
      errors: ['Ungültiger offener Restbetrag.'],
      warnings
    };
  }

  return {
    status: 'ready',
    ready: true,
    errors: [],
    warnings
  };
}
