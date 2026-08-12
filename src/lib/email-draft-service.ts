import { EmailResponseDraft, RequestedInformationField, EmailRecipient, EmailAttachmentReference } from './types';
import { caseService } from './case-service';
import { crmLookupService } from './crm-lookup-service';
import { workflowEngine } from './workflow-engine';
import { generateEmailResponseDraftText } from './email-draft-generator';

export interface CreateDraftOptions {
  purpose: EmailResponseDraft['purpose'];
  sourceEventId?: string;
  sourceMessageId?: string;
  internetMessageId?: string;
  conversationId?: string;
  requestedFields?: RequestedInformationField[];
  originalSubject?: string;
  originalSenderEmail?: string;
  originalSenderName?: string;
  forceNew?: boolean;
  createdBy?: 'rule' | 'ai' | 'user';
  customMessageText?: string;
  offerDraftId?: string;
  invoiceDraftId?: string;
  invoiceId?: string;
  receivableId?: string;
  documentId?: string;
  fileName?: string;
  offerType?: 'orientation' | 'binding';
  docNumber?: string;
  validityDate?: string;
  grossTotal?: number;
  paidAmount?: number;
  outstandingAmount?: number;
  dueDate?: string;
  attachments?: EmailAttachmentReference[];
}

export class EmailDraftService {
  createDraftForCase(caseId: string, options: CreateDraftOptions): EmailResponseDraft | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    if (!caseItem.emailDrafts) {
      caseItem.emailDrafts = [];
    }

    // 1. Idempotency Check: Don't create duplicate active drafts
    if (!options.forceNew) {
      const existingActive = caseItem.emailDrafts.find(d => 
        (d.status === 'draft' || d.status === 'edited' || d.status === 'approved' || d.status === 'sending') &&
        (d.purpose === options.purpose || (options.sourceEventId && d.sourceEventId === options.sourceEventId))
      );
      if (existingActive) {
        return existingActive;
      }
    }

    // 2. Resolve original email metadata from Workflow Event or Case if not provided directly
    let originalSenderEmail = options.originalSenderEmail || '';
    let originalSenderName = options.originalSenderName || '';
    let originalSubject = options.originalSubject || '';
    let sourceMessageId = options.sourceMessageId;
    let internetMessageId = options.internetMessageId;
    let conversationId = options.conversationId;

    if (options.sourceEventId) {
      const events = workflowEngine.getEvents();
      const event = events.find(e => e.id === options.sourceEventId);
      if (event && event.payload) {
        const payload = event.payload;
        if (!originalSenderEmail) originalSenderEmail = payload.senderEmail || payload.email || '';
        if (!originalSenderName) originalSenderName = payload.senderName || payload.name || '';
        if (!originalSubject) originalSubject = payload.subject || '';
        if (!sourceMessageId) sourceMessageId = payload.graphMessageId || payload.id;
        if (!internetMessageId) internetMessageId = payload.internetMessageId;
        if (!conversationId) conversationId = payload.conversationId;
      }
    }

    // Fallback if originalSenderEmail is still empty: try CRM customer or customerDraft
    if (!originalSenderEmail) {
      const customer = crmLookupService.findCustomerForCase(caseItem);
      originalSenderEmail = customer?.email || caseItem.customerDraft?.fields?.email?.value || '';
      if (!originalSenderName) {
        originalSenderName = customer?.name || caseItem.customerDraft?.fields?.name?.value || '';
      }
    }

    // Deduplicate requestedFields if present
    const requestedFields: RequestedInformationField[] = [];
    if (options.requestedFields && options.requestedFields.length > 0) {
      const seen = new Set<string>();
      for (const field of options.requestedFields) {
        if (!seen.has(field.field)) {
          seen.add(field.field);
          requestedFields.push(field);
        }
      }
    }

    // 3. Generate Draft Text
    const generated = generateEmailResponseDraftText({
      purpose: options.purpose,
      originalSenderName,
      originalSenderEmail,
      originalSubject,
      requestedFields,
      customMessageText: options.customMessageText,
      offerType: options.offerType,
      docNumber: options.docNumber,
      validityDate: options.validityDate,
      grossTotal: options.grossTotal,
      paidAmount: options.paidAmount,
      outstandingAmount: options.outstandingAmount,
      dueDate: options.dueDate
    });

    const primaryRecipient: EmailRecipient = {
      email: originalSenderEmail || 'kundenanfrage@example.com',
      name: originalSenderName || undefined
    };

    let attachments: EmailAttachmentReference[] | undefined = options.attachments;
    if (!attachments && options.documentId && options.fileName) {
      attachments = [{
        id: `att-${Date.now()}`,
        documentId: options.documentId,
        fileName: options.fileName,
        mimeType: 'application/pdf',
        source: 'document_service'
      }];
    }

    const draftId = crypto.randomUUID();
    const draft: EmailResponseDraft = {
      id: draftId,
      caseId: caseItem.id,
      sourceEventId: options.sourceEventId || 'system-rule',
      sourceMessageId,
      internetMessageId,
      conversationId,
      status: 'draft',
      purpose: options.purpose,
      replyMode: 'reply',
      recipients: [primaryRecipient],
      ccRecipients: [],
      subject: generated.subject,
      bodyText: generated.bodyText,
      originalSubject: originalSubject || 'Anfrage',
      originalSenderEmail: primaryRecipient.email,
      requestedFields,
      attachments,
      offerDraftId: options.offerDraftId,
      invoiceDraftId: options.invoiceDraftId,
      invoiceId: options.invoiceId,
      receivableId: options.receivableId,
      docNumber: options.docNumber,
      grossTotal: options.grossTotal,
      outstandingAmount: options.outstandingAmount,
      dueDate: options.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: options.createdBy || 'rule',
      confidence: 'high',
      corrections: []
    };

    // 4. Save to Case
    caseItem.emailDrafts.push(draft);
    caseItem.updatedAt = new Date().toISOString();

    // 5. Add Review Task
    const existingTask = caseService.findTaskByReference(caseItem.id, 'EMAIL_RESPONSE_DRAFT_REVIEW', draft.id);
    if (!existingTask) {
      const taskTitle = options.purpose === 'offer_delivery'
        ? 'Angebot versenden'
        : options.purpose === 'invoice_delivery'
          ? 'Rechnung versenden'
          : options.purpose === 'request_missing_information'
            ? 'Fehlende Informationen anfordern'
            : 'Antwortentwurf prüfen';

      caseService.addTask(caseItem.id, {
        title: taskTitle,
        description: options.purpose === 'offer_delivery'
          ? 'E-Mail-Entwurf für den Angebotsversand liegt bereit. Bitte prüfen und ausdrücklich freigeben.'
          : options.purpose === 'invoice_delivery'
            ? `E-Mail-Entwurf für die Rechnung ${options.docNumber || ''} liegt bereit. Bitte prüfen und freigeben.`
            : 'Ein E-Mail-Antwortentwurf wurde vorbereitet. Bitte prüfen und freigeben.',
        category: options.purpose === 'offer_delivery' ? 'Offer' : options.purpose === 'invoice_delivery' ? 'Invoice' : 'Communication',
        status: 'Open',
        priority: 'high',
        source: 'System',
        workflowId: options.sourceEventId || 'system-rule',
        caseId: caseItem.id,
        referenceType: 'EMAIL_RESPONSE_DRAFT_REVIEW',
        referenceId: draft.id
      });
    }

    // 6. Timeline Entry & Workflow Event
    const tlId = `tl-draft-created-${draft.id}`;
    if (!caseItem.timeline.some(t => t.id === tlId)) {
      caseItem.timeline.push({
        id: tlId,
        caseId: caseItem.id,
        workflowId: options.sourceEventId,
        timestamp: new Date().toISOString(),
        type: 'EMAIL_RESPONSE_DRAFT_CREATED',
        category: options.purpose === 'invoice_delivery' ? 'Invoice' : 'Communication',
        source: 'System',
        title: options.purpose === 'invoice_delivery' ? 'Rechnungs-E-Mail vorbereitet' : 'Antwortentwurf erstellt',
        description: `E-Mail-Antwortentwurf (${options.purpose}) wurde vorbereitet.`,
        confidence: 'high'
      });
    }

    if (options.purpose === 'invoice_delivery') {
      workflowEngine.emitEvent('INVOICE_EMAIL_DRAFT_CREATED', 'EmailDraftService', {
        caseId: caseItem.id,
        draftId: draft.id,
        invoiceDraftId: options.invoiceDraftId,
        invoiceNumber: options.docNumber
      });
    }

    workflowEngine.emitEvent('EMAIL_RESPONSE_DRAFT_CREATED', 'EmailDraftService', {
      caseId: caseItem.id,
      draftId: draft.id,
      purpose: draft.purpose
    });

    caseService.updateCase(caseItem.id, {
      emailDrafts: caseItem.emailDrafts
    });

    return draft;
  }
}

export const emailDraftService = new EmailDraftService();
