import { WorkflowEventConfidence, workflowEngine } from './workflow-engine';
import { automationService } from './automation-service';
import { validateEmailResponseDraft, canTransitionEmailDraftStatus } from './email-draft-validator';
import { evaluateOfferSendReadiness } from './offer-send-validator';
import { evaluateInvoiceSendReadiness } from './invoice-send-validator';
import { crmLookupService } from './crm-lookup-service';

export type CaseStatus = 
  | 'Draft'
  | 'Analyzing'
  | 'Waiting for Customer'
  | 'Waiting for Offer'
  | 'Offer Created'
  | 'Waiting for Confirmation'
  | 'Planning'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Archived';

export type TaskStatus = 'Open' | 'Waiting' | 'In Progress' | 'Completed' | 'Cancelled';
export type TaskCategory = 'CRM' | 'Communication' | 'Offer' | 'Viewing' | 'Schedule' | 'Document' | 'Invoice' | 'Organization' | 'Other' | 'Planning' | 'Review';

export interface CaseTask {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  source: string;
  workflowId: string;
  suggestionId?: string; // Links to a specific action type or suggestion ID
  referenceType?: string;
  referenceId?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface CaseHealth {
  score: number;
  checklist: ChecklistItem[];
  nextStep: string;
}

export interface CaseTimelineEntry {
  id: string;
  caseId: string;
  workflowId?: string;
  eventId?: string;
  timestamp: string;
  type: string;
  category: string;
  source: string;
  title: string;
  description: string;
  user?: string;
  confidence?: WorkflowEventConfidence;
  metadata?: any;
}

export interface CaseDecision {
  suggestionId: string;
  workflowEventId: string;
  caseId: string;
  decision: 'accepted' | 'rejected' | 'edited';
  timestamp: string;
  originalSuggestion: any;
  confidence?: WorkflowEventConfidence;
}

export interface IntegrationMetadata {
  outlook?: {
    initializedAt?: string;
    lastSuccessfulMailSyncAt?: string;
    processedMessageIds: string[];
  };
}

import { CustomerDraft, CustomerMatchReview, CustomerFieldComparison, EmailResponseDraft, OfferDraft, OfferResponseReview, PlanningReview, DispatchReview, CalendarPlanningReview, TourPlanningReview, OperationPreparationReview, OperationExecutionReview, CaseReminder, InvoiceDraft, Receivable, EmailTriageRecord, WorkflowException } from './types';
import { CaseRepository, FirestoreCaseRepository, LocalCaseRepository, RepositorySyncStatus, CaseRepositoryMetadata } from './case-repository';

export interface Case {
  id: string;
  status: CaseStatus;
  customerDraft?: CustomerDraft;
  customerMatchReview?: CustomerMatchReview;
  emailTriageRecords?: EmailTriageRecord[];
  emailDrafts?: EmailResponseDraft[];
  offerDrafts?: OfferDraft[];
  offerResponseReviews?: OfferResponseReview[];
  planningReviews?: PlanningReview[];
  dispatchReviews?: DispatchReview[];
  calendarPlanningReviews?: CalendarPlanningReview[];
  tourPlanningReviews?: TourPlanningReview[];
  operationPreparationReviews?: OperationPreparationReview[];
  operationExecutionReviews?: OperationExecutionReview[];
  invoiceDrafts?: InvoiceDraft[];
  receivables?: Receivable[];
  reminders?: CaseReminder[];
  workflowExceptions?: WorkflowException[];
  createdAt: string;
  updatedAt: string;
  source: string;
  priority: 'low' | 'medium' | 'high';
  confidence: WorkflowEventConfidence;
  customerId?: string;
  customerDraftId?: string;
  assignedUser?: string;
  tags: string[];
  notes: string;
  workflowIds: string[]; // Reference to linked workflow events
  title: string;
  health?: CaseHealth;
  tasks: CaseTask[];
  timeline: CaseTimelineEntry[];
  decisions: Record<string, CaseDecision>;
  schemaVersion: number;
  version?: number;
  updatedBy?: string;
  externalReferences?: {
    outlook?: {
      graphMessageIds: string[];
      internetMessageIds: string[];
      conversationIds: string[];
    }
  };
}

const STORAGE_KEY_V1 = 'app_cases_v1';
const STORAGE_KEY_V2 = 'app_cases_v2';

export class CaseService {
  private cases: Case[] = [];
  private repository: CaseRepository;
  private integrationMetadata: IntegrationMetadata = {
    outlook: { processedMessageIds: [] }
  };
  private processingMessageIds = new Set<string>();
  private draftSendingLocks = new Set<string>();
  private saveTimeout: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();
  private isSavingLocally = false;

  private repoUnsubscribe: (() => void) | null = null;

  constructor(repository?: CaseRepository) {
    this.repository = repository || new FirestoreCaseRepository();
    this.cases = this.repository.getAllCasesSync ? this.repository.getAllCasesSync().map(c => this.migrateCase(c, true)) : [];
    this.initRepository();
  }

  public getRepository(): CaseRepository {
    return this.repository;
  }

  public reset(): void {
    if (this.repoUnsubscribe) {
      this.repoUnsubscribe();
      this.repoUnsubscribe = null;
    }
    this.cases = [];
    this.listeners.clear();
    this.processingMessageIds.clear();
    this.draftSendingLocks.clear();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  public setRepository(repo: CaseRepository): void {
    if (this.repoUnsubscribe) {
      this.repoUnsubscribe();
      this.repoUnsubscribe = null;
    }
    this.repository = repo;
    this.initRepository();
  }

  public getSyncStatus(): RepositorySyncStatus {
    return this.repository.getSyncStatus();
  }

  public async saveCase(caseItem: Case, immediate: boolean = false): Promise<void> {
    const index = this.cases.findIndex(c => c.id === caseItem.id);
    if (index >= 0) {
      this.cases[index] = caseItem;
    } else {
      this.cases.push(caseItem);
    }
    this.evaluateCaseHealth(caseItem);
    if (immediate) {
      await this.repository.saveCase(caseItem);
      this.notifyListeners();
    } else {
      this.persistAllCases(false);
    }
  }

  private async initRepository(): Promise<void> {
    await this.repository.initialize();
    const cases = await this.repository.getAllCases();
    const repoCases = cases.map(c => this.migrateCase(c, true));
    const repoMap = new Map(repoCases.map(c => [c.id, c]));
    for (const localCase of this.cases) {
      if (!repoMap.has(localCase.id)) {
        repoMap.set(localCase.id, localCase);
      }
    }
    this.cases = Array.from(repoMap.values());
    this.repoUnsubscribe = this.repository.subscribe(remoteCases => {
      if (this.isSavingLocally) return;
      const remoteMap = new Map(remoteCases.map(c => [c.id, this.migrateCase(c, false)]));
      for (const localCase of this.cases) {
        if (!remoteMap.has(localCase.id)) {
          remoteMap.set(localCase.id, localCase);
        }
      }
      this.cases = Array.from(remoteMap.values());
      this.notifyListeners();
    });
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    queueMicrotask(() => {
      this.listeners.forEach(cb => {
        try { cb(); } catch (e) { console.error('Error in caseService listener', e); }
      });
    });
  }

  getCases(): Case[] {
    return this.getAllCases();
  }

  private migrateCase(c: any, isInitialBoot: boolean = false): Case {
    // Schema version 1 (Base schema)
    const emailDrafts = (c.emailDrafts || []).map((d: any) => {
      if (isInitialBoot && d.status === 'sending') {
        return {
          ...d,
          status: 'failed',
          errorMessage: 'Der Versand wurde durch einen Seiten-Reload unterbrochen. Bitte erneut prüfen und bestätigen.'
        };
      }
      return d;
    });

    let migrated = {
      ...c,
      tasks: c.tasks || [],
      timeline: c.timeline || [],
      decisions: c.decisions || {},
      emailDrafts,
      offerDrafts: c.offerDrafts || [],
      offerResponseReviews: c.offerResponseReviews || [],
      planningReviews: c.planningReviews || [],
      dispatchReviews: c.dispatchReviews || [],
      calendarPlanningReviews: c.calendarPlanningReviews || [],
      tourPlanningReviews: c.tourPlanningReviews || [],
      schemaVersion: c.schemaVersion || 1,
      version: c.version || 1
    };

    return migrated as Case;
  }

  private async persistAllCases(immediate: boolean = false): Promise<void> {
    const wasSavingLocally = this.isSavingLocally;
    this.isSavingLocally = true;
    try {
      if (this.repository.saveCasesSync) {
        this.repository.saveCasesSync(this.cases);
      }
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      const doSave = async () => {
        // Repository adapters notify subscribers while persisting. Keep those
        // local echoes from replacing newer in-memory mutations with the older
        // snapshot currently being written.
        const wasSavingDuringFlush = this.isSavingLocally;
        this.isSavingLocally = true;
        try {
          await this.repository.saveCases(this.cases);
          const meta = await this.repository.getMetadata();
          meta.processedMessageIds = this.integrationMetadata.outlook?.processedMessageIds || [];
          meta.lastSuccessfulMailSyncAt = this.integrationMetadata.outlook?.lastSuccessfulMailSyncAt;
          await this.repository.saveMetadata(meta);
          this.notifyListeners();
        } catch (e) {
          console.error("Failed to save cases via repository", e);
        } finally {
          this.isSavingLocally = wasSavingDuringFlush;
        }
      };

      if (immediate) {
        await doSave();
      } else {
        this.saveTimeout = setTimeout(doSave, 300);
      }
    } finally {
      this.isSavingLocally = wasSavingLocally;
    }
  }

  flushPersistence() {
    if (this.repository.saveCasesSync) {
      this.repository.saveCasesSync(this.cases);
    }
    this.persistAllCases(true);
  }

  saveCases() {
    this.flushPersistence();
  }

  createCase(initialData: Partial<Case>): Case {
    const newCase: Case = {
      id: crypto.randomUUID(),
      status: initialData.status || 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: initialData.source || 'System',
      priority: initialData.priority || 'medium',
      confidence: initialData.confidence || 'medium',
      customerId: initialData.customerId,
      customerDraftId: initialData.customerDraftId,
      assignedUser: initialData.assignedUser,
      tags: initialData.tags || [],
      notes: initialData.notes || '',
      workflowIds: initialData.workflowIds || [],
      title: initialData.title || 'Neuer Vorgang',
      tasks: initialData.tasks || [],
      timeline: initialData.timeline || [],
      decisions: initialData.decisions || {},
      schemaVersion: 2,
      customerDraft: initialData.customerDraft,
      externalReferences: initialData.externalReferences
    };
    
    this.evaluateCaseHealth(newCase);
    this.cases.push(newCase);
    this.persistAllCases(true);
    return newCase;
  }

  getCase(id: string): Case | undefined {
    return this.cases.find(c => c.id === id);
  }

  // --- Outlook Integration Deduplication & References ---

  hasProcessedOutlookMessage(graphMessageId: string): boolean {
    if (this.processingMessageIds.has(graphMessageId)) return true;
    const ids = this.integrationMetadata.outlook?.processedMessageIds || [];
    return ids.includes(graphMessageId);
  }

  markOutlookMessageProcessing(graphMessageId: string) {
    this.processingMessageIds.add(graphMessageId);
  }

  unmarkOutlookMessageProcessing(graphMessageId: string) {
    this.processingMessageIds.delete(graphMessageId);
  }

  registerProcessedOutlookMessage(graphMessageId: string) {
    if (!this.integrationMetadata.outlook) {
      this.integrationMetadata.outlook = { processedMessageIds: [] };
    }
    if (!this.integrationMetadata.outlook.processedMessageIds.includes(graphMessageId)) {
      this.integrationMetadata.outlook.processedMessageIds.push(graphMessageId);
    }
    this.processingMessageIds.delete(graphMessageId);
    this.persistAllCases();
  }

  getOutlookSyncMetadata() {
    return this.integrationMetadata.outlook || { processedMessageIds: [] };
  }

  updateOutlookSyncMetadata(updates: Partial<NonNullable<IntegrationMetadata['outlook']>>) {
    if (!this.integrationMetadata.outlook) {
      this.integrationMetadata.outlook = { processedMessageIds: [] };
    }
    this.integrationMetadata.outlook = { ...this.integrationMetadata.outlook, ...updates };
    this.persistAllCases();
  }

  addOutlookReferenceToCase(caseId: string, ref: { graphMessageId?: string, internetMessageId?: string, conversationId?: string }) {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return;

    if (!caseItem.externalReferences) caseItem.externalReferences = {};
    if (!caseItem.externalReferences.outlook) caseItem.externalReferences.outlook = { graphMessageIds: [], internetMessageIds: [], conversationIds: [] };
    
    const outlook = caseItem.externalReferences.outlook;
    
    if (ref.graphMessageId && !outlook.graphMessageIds.includes(ref.graphMessageId)) {
      outlook.graphMessageIds.push(ref.graphMessageId);
    }
    if (ref.internetMessageId && !outlook.internetMessageIds.includes(ref.internetMessageId)) {
      outlook.internetMessageIds.push(ref.internetMessageId);
    }
    if (ref.conversationId && !outlook.conversationIds.includes(ref.conversationId)) {
      outlook.conversationIds.push(ref.conversationId);
    }
    
    this.persistAllCases();
  }

  // -----------------------------------------------------

  getAllCases(): Case[] {
    return [...this.cases];
  }

  updateCustomerDraft(caseId: string, draft: Partial<CustomerDraft>): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;
    
    if (caseItem.customerDraft) {
      caseItem.customerDraft = { ...caseItem.customerDraft, ...draft };
    } else {
      caseItem.customerDraft = draft as CustomerDraft;
    }
    this.persistAllCases();
    return caseItem;
  }

  updateEmailDraft(caseId: string, updatedDraft: EmailResponseDraft): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;

    if (!caseItem.emailDrafts) caseItem.emailDrafts = [];
    const index = caseItem.emailDrafts.findIndex(d => d.id === updatedDraft.id);
    if (index !== -1) {
      caseItem.emailDrafts[index] = { ...caseItem.emailDrafts[index], ...updatedDraft, updatedAt: new Date().toISOString() };
    } else {
      caseItem.emailDrafts.push(updatedDraft);
    }

    workflowEngine.emitEvent('EMAIL_RESPONSE_DRAFT_UPDATED', 'User', { caseId, draftId: updatedDraft.id });
    this.persistAllCases();
    return caseItem;
  }

  addOfferDraft(caseId: string, draft: OfferDraft): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;

    if (!caseItem.offerDrafts) caseItem.offerDrafts = [];
    const index = caseItem.offerDrafts.findIndex(d => d.id === draft.id);
    if (index !== -1) {
      caseItem.offerDrafts[index] = draft;
    } else {
      caseItem.offerDrafts.push(draft);
    }

    this.evaluateCaseHealth(caseItem);
    this.persistAllCases();
    return caseItem;
  }

  updateOfferDraft(caseId: string, draft: OfferDraft): Case | undefined {
    return this.addOfferDraft(caseId, draft);
  }

  createOfferDraft(caseId: string): OfferDraft | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;
    const draft: OfferDraft = {
      id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      caseId,
      customerId: caseItem.customerId || '',
      offerType: 'binding',
      currency: 'EUR',
      status: 'draft',
      items: [],
      subtotalNet: 0,
      discountValue: 0,
      surchargeValue: 0,
      netTotal: 0,
      vatRate: 0.20,
      grossTotal: 0,
      vatAmount: 0,
      corrections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.addOfferDraft(caseId, draft);
    return draft;
  }

  createInvoiceDraft(caseId: string): InvoiceDraft | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;
    const draft: InvoiceDraft = {
      id: `inv_draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      caseId,
      operationExecutionReviewId: '',
      status: 'draft',
      invoiceType: 'standard',
      invoiceDate: new Date().toISOString().split('T')[0],
      serviceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      billingAddress: {},
      items: [],
      subtotalNet: 0,
      discountValue: 0,
      surchargeValue: 0,
      netTotal: 0,
      vatRate: 0.20,
      vatAmount: 0,
      grossTotal: 0,
      depositPaid: 0,
      otherPayments: 0,
      outstandingAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.addInvoiceDraft(caseId, draft);
    return draft;
  }

  async confirmEmailDraftSend(
    caseId: string,
    draftId: string,
    options?: { token?: string; fetchFn?: typeof fetch }
  ): Promise<{ success: boolean; error?: string; messageId?: string; warning?: string }> {
    if (this.draftSendingLocks.has(draftId)) {
      return { success: false, error: 'Versandvorgang läuft bereits.' };
    }

    const caseItem = this.getCase(caseId);
    if (!caseItem || !caseItem.emailDrafts) {
      return { success: false, error: 'Vorgang oder E-Mail-Entwurf nicht gefunden.' };
    }

    const draftIndex = caseItem.emailDrafts.findIndex(d => d.id === draftId);
    if (draftIndex === -1) {
      return { success: false, error: 'E-Mail-Entwurf nicht gefunden.' };
    }

    const draft = caseItem.emailDrafts[draftIndex];

    // Status transition check
    if (!canTransitionEmailDraftStatus(draft.status, 'sending')) {
      return { success: false, error: `Ungültiger Statusübergang: Status "${draft.status}" darf nicht nach "sending" gewechselt werden.` };
    }

    // Validation check before dispatch
    const validation = validateEmailResponseDraft(draft);
    if (!validation.valid) {
      return { success: false, error: `Validierung fehlgeschlagen: ${validation.errors.join('; ')}` };
    }

    // Additional Offer Readiness Check for offer_delivery
    if (draft.purpose === 'offer_delivery' || draft.offerDraftId) {
      const offerDraft = caseItem.offerDrafts?.find(o => o.id === draft.offerDraftId || o.status === 'pdf_created' || o.status === 'ready_to_send');
      const customer = crmLookupService.findCustomerForCase(caseItem);
      const sendReadiness = evaluateOfferSendReadiness(caseItem, offerDraft, null, customer);
      if (!sendReadiness.ready) {
        return { success: false, error: `Angebots-Versandbereitschaft nicht erfüllt: ${sendReadiness.errors.join('; ')}` };
      }
    }

    // Additional Invoice Readiness Check for invoice_delivery
    if (draft.purpose === 'invoice_delivery' || draft.invoiceDraftId) {
      const invoiceDraft = caseItem.invoiceDrafts?.find(i => i.id === draft.invoiceDraftId || i.status === 'pdf_created' || i.status === 'open');
      const sendReadiness = evaluateInvoiceSendReadiness(caseItem, invoiceDraft, draft);
      if (!sendReadiness.ready) {
        return { success: false, error: `Rechnungs-Versandbereitschaft nicht erfüllt: ${sendReadiness.errors.join('; ')}` };
      }
    }

    // Check lock
    if (this.draftSendingLocks.has(draftId)) {
      return { success: false, error: 'Ein Versand für diesen Entwurf läuft bereits.' };
    }

    // Set lock
    this.draftSendingLocks.add(draftId);

    try {
      // Mark status as approved, then sending
      draft.status = 'approved';
      draft.approvedAt = new Date().toISOString();
      draft.updatedAt = new Date().toISOString();

      workflowEngine.emitEvent('EMAIL_RESPONSE_DRAFT_APPROVED', 'User', { caseId, draftId });
      workflowEngine.emitEvent('EMAIL_SEND_STARTED', 'System', { caseId, draftId });

      draft.status = 'sending';
      this.persistAllCases(true);

      // Execute sending via AutomationService
      const sendResult = await automationService.executeApprovedEmailDraft(draft, caseId, options);

      if (sendResult.success) {
        draft.status = 'sent';
        draft.sentAt = new Date().toISOString();
        draft.outlookDraftMessageId = sendResult.messageId;
        draft.updatedAt = new Date().toISOString();

        // Emit EMAIL_SENT
        workflowEngine.emitEvent('EMAIL_SENT', 'AutomationService', {
          caseId,
          draftId,
          messageId: sendResult.messageId,
          recipients: draft.recipients
        });

        // Timeline entry
        const tlId = `tl-email-sent-${draft.id}`;
        if (!caseItem.timeline.some(t => t.id === tlId)) {
          caseItem.timeline.push({
            id: tlId,
            caseId,
            workflowId: draft.sourceEventId,
            timestamp: new Date().toISOString(),
            type: 'EMAIL_SENT',
            category: 'Communication',
            source: 'User Action',
            title: draft.purpose === 'offer_delivery' ? 'Angebot per E-Mail versendet' : 'E-Mail-Antwort versendet',
            description: `E-Mail an ${draft.recipients.map(r => r.email).join(', ')} wurde erfolgreich versendet.`,
            user: 'Aktueller Benutzer'
          });
        }

        // Complete review task
        this.completeTaskByReference(caseId, 'EMAIL_RESPONSE_DRAFT_REVIEW', draftId);

        // If purpose was offer_delivery, update linked offer draft, tasks, events, and case status
        if (draft.purpose === 'offer_delivery' || draft.offerDraftId) {
          const targetOffer = caseItem.offerDrafts?.find(o => o.id === draft.offerDraftId || o.status === 'pdf_created' || o.status === 'ready_to_send');
          if (targetOffer) {
            targetOffer.status = 'sent';
            targetOffer.updatedAt = new Date().toISOString();

            workflowEngine.emitEvent('OFFER_SENT', 'AutomationService', {
              caseId,
              draftId,
              offerDraftId: targetOffer.id,
              documentId: targetOffer.documentId
            });
          }

          // Complete "Angebot versenden" task if exists
          caseItem.tasks.forEach(t => {
            if (t.title.includes('Angebot versenden') && t.status !== 'Completed') {
              t.status = 'Completed';
              t.completedAt = new Date().toISOString();
            }
          });

          // Add task "Auf Angebotsbestätigung warten"
          const waitingTaskTitle = 'Auf Angebotsbestätigung warten';
          if (!caseItem.tasks.some(t => t.title === waitingTaskTitle && t.status === 'Waiting')) {
            this.addTask(caseId, {
              title: waitingTaskTitle,
              description: 'Warten auf die Bestätigung oder Rückmeldung des Kunden zum versendeten Angebot.',
              category: 'Offer',
              status: 'Waiting',
              priority: 'medium',
              source: 'System',
              caseId,
              workflowId: draft.sourceEventId
            });
          }

          caseItem.status = 'Waiting for Confirmation';
        } else if (draft.purpose === 'invoice_delivery' || draft.invoiceDraftId) {
          const targetInvoice = caseItem.invoiceDrafts?.find(i => i.id === draft.invoiceDraftId || i.status === 'pdf_created' || i.status === 'open');
          if (targetInvoice) {
            targetInvoice.sentAt = new Date().toISOString();
            targetInvoice.updatedAt = new Date().toISOString();

            workflowEngine.emitEvent('INVOICE_SENT', 'AutomationService', {
              caseId,
              draftId,
              invoiceDraftId: targetInvoice.id,
              invoiceId: targetInvoice.invoiceId,
              invoiceNumber: targetInvoice.invoiceNumber,
              messageId: sendResult.messageId
            });
          }

          // Complete "Rechnung versenden" task
          caseItem.tasks.forEach(t => {
            if (t.title.includes('Rechnung versenden') && t.status !== 'Completed') {
              t.status = 'Completed';
              t.completedAt = new Date().toISOString();
            }
          });

          // Ensure "Zahlung überwachen" task is in Waiting state
          caseItem.tasks.forEach(t => {
            if (t.title.includes('Zahlung überwachen') && t.status !== 'Completed') {
              t.status = 'Waiting';
            }
          });

          // Timeline entry
          this.addTimelineEntry(caseId, {
            type: 'status_change',
            title: 'Rechnung per E-Mail versendet',
            description: `Rechnung ${targetInvoice?.invoiceNumber || ''} an ${draft.recipients.map(r => r.email).join(', ')} wurde erfolgreich per E-Mail versendet.`,
            category: 'Invoice',
            source: 'User Action',
            timestamp: new Date().toISOString(),
            user: 'Aktueller Benutzer',
            metadata: {
              invoiceNumber: targetInvoice?.invoiceNumber,
              documentId: targetInvoice?.documentId,
              messageId: sendResult.messageId
            }
          });
        } else if (draft.purpose === 'request_missing_information') {
          caseItem.tasks.forEach(t => {
            if (t.category === 'Communication' && t.title.startsWith('Information anfordern') && t.status === 'Open') {
              t.status = 'Waiting';
            }
          });
          caseItem.status = 'Waiting for Customer';
        } else {
          caseItem.status = 'Waiting for Customer';
        }

        this.evaluateCaseHealth(caseItem);

        try {
          this.persistAllCases(true);
        } catch (pErr) {
          draft.status = 'reconciliation_required';
          return { success: true, messageId: sendResult.messageId, warning: 'E-Mail wurde versendet, aber die lokale Persistenz schlug fehl.' };
        }

        return { success: true, messageId: sendResult.messageId };
      } else {
        draft.status = 'failed';
        draft.errorMessage = sendResult.error;
        draft.updatedAt = new Date().toISOString();

        workflowEngine.emitEvent('EMAIL_SEND_FAILED', 'AutomationService', {
          caseId,
          draftId,
          error: sendResult.error
        });

        if (draft.purpose === 'invoice_delivery' || draft.invoiceDraftId) {
          workflowEngine.emitEvent('INVOICE_SEND_FAILED', 'AutomationService', {
            caseId,
            draftId,
            invoiceDraftId: draft.invoiceDraftId,
            error: sendResult.error
          });
        }

        this.persistAllCases(true);
        return { success: false, error: sendResult.error };
      }
    } finally {
      this.draftSendingLocks.delete(draftId);
    }
  }

  rejectEmailDraft(caseId: string, draftId: string): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem || !caseItem.emailDrafts) return undefined;

    const draft = caseItem.emailDrafts.find(d => d.id === draftId);
    if (draft) {
      draft.status = 'rejected';
      draft.updatedAt = new Date().toISOString();

      this.cancelTaskByReference(caseId, 'EMAIL_RESPONSE_DRAFT_REVIEW', draftId);

      const tlId = `tl-draft-rejected-${draftId}`;
      if (!caseItem.timeline.some(t => t.id === tlId)) {
        caseItem.timeline.push({
          id: tlId,
          caseId,
          timestamp: new Date().toISOString(),
          type: 'EMAIL_RESPONSE_DRAFT_REJECTED',
          category: 'Communication',
          source: 'User Action',
          title: 'E-Mail-Entwurf verworfen',
          description: 'Der vorbereitete Antwortentwurf wurde vom Benutzer verworfen.',
          user: 'Aktueller Benutzer'
        });
      }

      workflowEngine.emitEvent('EMAIL_RESPONSE_DRAFT_REJECTED', 'User', { caseId, draftId });
      this.persistAllCases();
    }
    return caseItem;
  }

  updateCase(id: string, updates: Partial<Case>): Case | undefined {
    const caseIndex = this.cases.findIndex(c => c.id === id);
    if (caseIndex === -1) return undefined;

    this.cases[caseIndex] = {
      ...this.cases[caseIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.evaluateCaseHealth(this.cases[caseIndex]);
    this.persistAllCases();
    return this.cases[caseIndex];
  }

  deleteCase(id: string) {
    this.cases = this.cases.filter(c => c.id !== id);
    this.persistAllCases();
  }

  saveDecision(caseId: string, suggestionId: string, workflowEventId: string, decision: 'accepted' | 'rejected' | 'edited', originalSuggestion: any) {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return;

    if (!caseItem.decisions) {
      caseItem.decisions = {};
    }

    caseItem.decisions[suggestionId] = {
      suggestionId,
      workflowEventId,
      caseId,
      decision,
      timestamp: new Date().toISOString(),
      originalSuggestion
    };
    this.persistAllCases();
  }

  attachWorkflowEvent(caseId: string, eventId: string): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;

    if (!caseItem.workflowIds.includes(eventId)) {
      return this.updateCase(caseId, {
        workflowIds: [...caseItem.workflowIds, eventId]
      });
    }
    return caseItem;
  }

  // Find a matching case based on flexible criteria
  lookupCase(criteria: {
    customerId?: string;
    email?: string; // Could be extended in future to search notes/tags for email
    workflowId?: string;
    conversationId?: string;
    internetMessageId?: string;
    // other lookup criteria
  }): Case | undefined {
    // 1. Prioritize direct workflowId match
    if (criteria.workflowId) {
      const match = this.cases.find(c => c.workflowIds.includes(criteria.workflowId!));
      if (match) return match;
    }

    // 2. Prioritize conversationId or internetMessageId from externalReferences or associated timeline events
    if (criteria.conversationId || criteria.internetMessageId) {
      // Only match against open/active cases
      const activeCases = this.cases.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled' && c.status !== 'Archived');
      
      for (const c of activeCases) {
        const outlookRefs = c.externalReferences?.outlook;
        if (outlookRefs) {
          if (criteria.conversationId && outlookRefs.conversationIds.includes(criteria.conversationId)) return c;
          if (criteria.internetMessageId && outlookRefs.internetMessageIds.includes(criteria.internetMessageId)) return c;
        }

        for (const entry of c.timeline) {
          if (criteria.conversationId && entry.metadata?.conversationId === criteria.conversationId) {
            return c;
          }
          if (criteria.internetMessageId && entry.metadata?.internetMessageId === criteria.internetMessageId) {
            return c;
          }
        }
      }
    }

    // 3. Fallback to customerId, but ONLY if it unambiguously points to exactly one active Case
    if (criteria.customerId) {
      const activeCasesForCustomer = this.cases.filter(c => 
        c.customerId === criteria.customerId && 
        c.status !== 'Completed' && c.status !== 'Cancelled' && c.status !== 'Archived'
      );
      if (activeCasesForCustomer.length === 1) {
        return activeCasesForCustomer[0];
      }
    }

    return undefined;
  }


  // --- Customer Draft & Tasks Helper Methods ---
  
  createCustomerDraft(caseId: string, draft: CustomerDraft): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;
    caseItem.customerDraft = draft;
    this.persistAllCases();
    return caseItem;
  }
  
  rejectCustomerDraft(caseId: string): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem || !caseItem.customerDraft) return undefined;
    caseItem.customerDraft.status = 'rejected';
    caseItem.customerDraft.updatedAt = new Date().toISOString();
    this.persistAllCases();
    return caseItem;
  }
  
  convertCustomerDraft(caseId: string, customerId: string): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem || !caseItem.customerDraft) return undefined;
    caseItem.customerDraft.status = 'converted';
    caseItem.customerDraft.convertedCustomerId = customerId;
    caseItem.customerDraft.updatedAt = new Date().toISOString();
    caseItem.customerId = customerId;
    this.persistAllCases();
    return caseItem;
  }
  
  addTimelineEntry(caseId: string, entry: Omit<CaseTimelineEntry, 'id' | 'caseId'>): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;
    if (!caseItem.timeline) caseItem.timeline = [];
    caseItem.timeline.push({
      ...entry,
      id: crypto.randomUUID(),
      caseId: caseId
    });
    this.persistAllCases();
    return caseItem;
  }
  
  findTaskByReference(caseId: string, referenceType: string, referenceId?: string): CaseTask | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;
    return caseItem.tasks.find(t => t.referenceType === referenceType && (!referenceId || t.referenceId === referenceId));
  }
  
  completeTaskByReference(caseId: string, referenceType: string, referenceId?: string): void {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return;
    const tasks = caseItem.tasks.filter(t => t.referenceType === referenceType && (!referenceId || t.referenceId === referenceId) && t.status !== 'Completed');
    tasks.forEach(t => {
      t.status = 'Completed';
      t.completedAt = new Date().toISOString();
    });
    if (tasks.length > 0) this.persistAllCases();
  }

  completeTaskByTitlePattern(caseId: string, titlePattern: string): void {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return;
    const tasks = caseItem.tasks.filter(t => t.title.includes(titlePattern) && t.status !== 'Completed');
    tasks.forEach(t => {
      t.status = 'Completed';
      t.completedAt = new Date().toISOString();
    });
    if (tasks.length > 0) this.persistAllCases();
  }
  
  cancelTaskByReference(caseId: string, referenceType: string, referenceId?: string): void {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return;
    const tasks = caseItem.tasks.filter(t => t.referenceType === referenceType && (!referenceId || t.referenceId === referenceId) && t.status !== 'Cancelled');
    tasks.forEach(t => {
      t.status = 'Cancelled';
      t.completedAt = new Date().toISOString();
    });
    if (tasks.length > 0) this.persistAllCases();
  }

  updateCustomerMatchReview(caseId: string, review: CustomerMatchReview): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;

    caseItem.customerMatchReview = review;
    caseItem.updatedAt = new Date().toISOString();

    this.evaluateCaseHealth(caseItem);
    this.persistAllCases();
    return caseItem;
  }

  confirmCustomerMatch(caseId: string, customerId: string): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;

    caseItem.customerId = customerId;
    caseItem.updatedAt = new Date().toISOString();

    if (caseItem.customerMatchReview) {
      caseItem.customerMatchReview.status = 'confirmed';
      caseItem.customerMatchReview.selectedCustomerId = customerId;
      caseItem.customerMatchReview.updatedAt = new Date().toISOString();
    }

    this.completeTaskByReference(caseId, 'CUSTOMER_MATCH_REVIEW', caseItem.customerMatchReview?.id);

    // Add timeline entry idempotently
    const tlId = `tl-match-confirmed-${caseId}-${customerId}`;
    if (!caseItem.timeline.some(t => t.id === tlId)) {
      caseItem.timeline.push({
        id: tlId,
        caseId,
        timestamp: new Date().toISOString(),
        type: 'CUSTOMER_MATCH_CONFIRMED',
        category: 'CRM',
        source: 'User Action',
        title: 'Kundenzuordnung bestätigt',
        description: `Der Vorgang wurde erfolgreich dem bestehenden Kunden (${customerId}) zugeordnet.`,
        user: 'Aktueller Benutzer'
      });
    }

    this.evaluateCaseHealth(caseItem);
    this.persistAllCases();
    return caseItem;
  }

  rejectCustomerMatch(caseId: string): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;

    delete caseItem.customerId;
    caseItem.updatedAt = new Date().toISOString();

    if (caseItem.customerMatchReview) {
      caseItem.customerMatchReview.status = 'rejected';
      caseItem.customerMatchReview.updatedAt = new Date().toISOString();
    }

    this.cancelTaskByReference(caseId, 'CUSTOMER_MATCH_REVIEW', caseItem.customerMatchReview?.id);

    // Add timeline entry idempotently
    const tlId = `tl-match-rejected-${caseId}`;
    if (!caseItem.timeline.some(t => t.id === tlId)) {
      caseItem.timeline.push({
        id: tlId,
        caseId,
        timestamp: new Date().toISOString(),
        type: 'CUSTOMER_MATCH_REJECTED',
        category: 'CRM',
        source: 'User Action',
        title: 'Kundenzuordnung verworfen',
        description: 'Die vorgeschlagene Kundenzuordnung wurde verworfen. Wechsel zum Kundenentwurf-Prozess.',
        user: 'Aktueller Benutzer'
      });
    }

    // Create CustomerDraft if not existing
    if (!caseItem.customerDraft) {
      const sourceEvent = workflowEngine.getEvents().find(e => caseItem.workflowIds.includes(e.id));
      const extracted = sourceEvent?.payload?.extractedData || sourceEvent?.payload || {};

      const createDraftField = (val: any, conf: string = 'medium', src: string = 'AI') => ({
        value: val || null,
        recognized: !!val,
        confidence: conf as any,
        source: src
      });

      const draft: CustomerDraft = {
        id: crypto.randomUUID(),
        caseId: caseItem.id,
        sourceEventId: sourceEvent?.id || 'manual',
        source: 'AI',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confidence: 'medium',
        fields: {
          name: createDraftField(extracted.senderName?.value || extracted.name?.value),
          email: createDraftField(extracted.email?.value),
          phone: createDraftField(extracted.phone?.value),
          company: createDraftField(extracted.company?.value),
          pickupAddress: {
            raw: createDraftField(extracted.pickupAddress?.value || extracted.sourceAddress?.value)
          },
          destinationAddress: {
            raw: createDraftField(extracted.destinationAddress?.value)
          },
          moveDate: createDraftField(extracted.moveDate?.value),
          apartmentSize: createDraftField(extracted.volumeEstimate?.value),
          notes: createDraftField('')
        },
        originalExtractedData: extracted,
        corrections: []
      };

      caseItem.customerDraft = draft;

      const existingDraftTask = this.findTaskByReference(caseId, 'CUSTOMER_DRAFT_REVIEW', draft.id);
      if (!existingDraftTask) {
        this.addTask(caseId, {
          title: 'Kundenentwurf prüfen',
          description: 'Es konnte kein eindeutiger Kunde zugeordnet werden. Bitte Kundenentwurf prüfen.',
          category: 'CRM',
          status: 'Open',
          priority: 'high',
          source: 'System',
          workflowId: sourceEvent?.id || 'manual',
          caseId,
          referenceType: 'CUSTOMER_DRAFT_REVIEW',
          referenceId: draft.id
        });
      }
    }

    this.evaluateCaseHealth(caseItem);
    this.persistAllCases();
    return caseItem;
  }

  completeCustomerMatchReviewWithUpdate(caseId: string, customerId: string, updatedFields: CustomerFieldComparison[]): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;

    caseItem.customerId = customerId;
    caseItem.updatedAt = new Date().toISOString();

    if (caseItem.customerMatchReview) {
      caseItem.customerMatchReview.status = 'updated';
      caseItem.customerMatchReview.selectedCustomerId = customerId;
      caseItem.customerMatchReview.fieldComparisons = updatedFields;
      caseItem.customerMatchReview.updatedAt = new Date().toISOString();
    }

    this.completeTaskByReference(caseId, 'CUSTOMER_MATCH_REVIEW', caseItem.customerMatchReview?.id);

    const updatedNames = updatedFields.filter(f => f.selectedForUpdate).map(f => f.label).join(', ');
    const tlId = `tl-match-updated-${caseId}-${customerId}`;

    if (!caseItem.timeline.some(t => t.id === tlId)) {
      caseItem.timeline.push({
        id: tlId,
        caseId,
        timestamp: new Date().toISOString(),
        type: 'CUSTOMER_UPDATED',
        category: 'CRM',
        source: 'User Action',
        title: 'Kundendaten im CRM aktualisiert',
        description: `Bestehende Kundendaten (${customerId}) wurden mit ausgewählten Feldern aktualisiert: ${updatedNames || 'keine Änderungen'}.`,
        user: 'Aktueller Benutzer'
      });
    }

    this.evaluateCaseHealth(caseItem);
    this.persistAllCases();
    return caseItem;
  }

  addTask(caseId: string, task: Omit<CaseTask, 'id' | 'createdAt'>): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;
    
    if (task.referenceType && task.referenceId) {
      const existing = caseItem.tasks.find(
        t => t.referenceType === task.referenceType && t.referenceId === task.referenceId
      );
      if (existing) {
        return caseItem;
      }
    }

    caseItem.tasks.push({
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    });
    
    this.persistAllCases();
    return caseItem;
  }

  updateTask(caseId: string, taskId: string, updates: Partial<CaseTask>): Case | undefined {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return undefined;

    const taskIndex = caseItem.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      caseItem.tasks[taskIndex] = { ...caseItem.tasks[taskIndex], ...updates };
      if (updates.status === 'Completed' || updates.status === 'Cancelled') {
        caseItem.tasks[taskIndex].completedAt = new Date().toISOString();
      }
      this.evaluateCaseHealth(caseItem);
      this.persistAllCases();
    }
    return caseItem;
  }

  private generateTasks(caseItem: Case) {
    const events = workflowEngine.getEvents().filter(e => caseItem.workflowIds.includes(e.id));

    events.forEach(event => {
      if (event.type === 'SUGGESTION_CREATED' && event.payload?.actions) {
        // Create tasks from suggested actions
        event.payload.actions.forEach((action: any) => {
          const existing = caseItem.tasks.find(t => t.workflowId === event.id && t.suggestionId === action.actionType);
          if (!existing) {
            let category: TaskCategory = 'Other';
            if (action.actionType.includes('OFFER')) category = 'Offer';
            else if (action.actionType.includes('CUSTOMER')) category = 'CRM';
            else if (action.actionType.includes('VIEWING')) category = 'Viewing';
            else if (action.actionType.includes('CONTACT') || action.actionType.includes('REPLY')) category = 'Communication';
            else if (action.actionType.includes('DATA') || action.actionType.includes('COMPARE')) category = 'Organization';

            caseItem.tasks.push({
              id: crypto.randomUUID(),
              caseId: caseItem.id,
              title: action.label,
              description: `Automatisch aus Vorschlag generiert.`,
              category,
              priority: event.confidence === 'high' ? 'medium' : 'high',
              status: 'Open',
              createdAt: new Date().toISOString(),
              source: 'DecisionEngine',
              workflowId: event.id,
              suggestionId: action.actionType
            });
          }
        });

        // Create tasks for missing information
        const extractedData = event.payload.actions[0]?.data?.extractedData;
        if (extractedData?.missingOrUnknown?.value?.length > 0) {
          extractedData.missingOrUnknown.value.forEach((missingItem: string) => {
            const taskTitle = `Information anfordern: ${missingItem}`;
            const existing = caseItem.tasks.find(t => t.workflowId === event.id && t.title === taskTitle);
            if (!existing) {
              caseItem.tasks.push({
                id: crypto.randomUUID(),
                caseId: caseItem.id,
                title: taskTitle,
                description: `Fehlende Information aus der KI-Analyse.`,
                category: 'Communication',
                priority: 'medium',
                status: 'Open',
                createdAt: new Date().toISOString(),
                source: 'AI Analysis',
                workflowId: event.id
              });
            }
          });
        }
      }
    });
  }

  private generateTimeline(caseItem: Case) {
    const events = workflowEngine.getEvents().filter(e => caseItem.workflowIds.includes(e.id));
    
    // Create timeline entries from events
    events.forEach(event => {
      const existingId = `tl-${event.id}`;
      if (caseItem.timeline.some(e => e.id === existingId)) return;

      let title = 'Systemereignis';
      let category = 'System';
      let description = 'Ein Systemereignis ist aufgetreten.';

      switch (event.type) {
        case 'EMAIL_RECEIVED':
          title = 'E-Mail empfangen';
          category = 'Communication';
          description = `E-Mail von ${event.payload?.senderName?.value || 'Unbekannt'} eingegangen.`;
          break;
        case 'CUSTOMER_CREATED':
          title = 'Kunde erstellt';
          category = 'CRM';
          description = 'Ein neuer Kunde wurde im System angelegt.';
          break;
        case 'OFFER_CREATED':
          title = 'Angebot erstellt';
          category = 'Offer';
          description = 'Ein Angebot wurde für diesen Vorgang generiert.';
          break;
        case 'SUGGESTION_CREATED':
          title = 'KI Analyse abgeschlossen';
          category = 'AI Analysis';
          description = 'Handlungsempfehlungen wurden generiert.';
          break;
        case 'SUGGESTION_DECISION_MADE':
          title = 'Benutzerentscheidung';
          category = 'User Action';
          description = `Vorschlag wurde ${event.payload?.decision === 'accepted' ? 'übernommen' : event.payload?.decision === 'rejected' ? 'abgelehnt' : 'bearbeitet'}.`;
          break;
        case 'EVENT_CREATED':
          title = 'Termin geplant';
          category = 'Schedule';
          description = 'Ein neuer Termin wurde vereinbart.';
          break;
        case 'INVOICE_CREATED':
          title = 'Rechnung erstellt';
          category = 'Invoice';
          description = 'Eine Rechnung wurde generiert.';
          break;
        default:
          title = event.type;
      }

      caseItem.timeline.push({
        id: existingId,
        caseId: caseItem.id,
        workflowId: event.id,
        eventId: event.id,
        timestamp: event.timestamp,
        type: event.type,
        category,
        source: event.source,
        title,
        description,
        user: event.source === 'User' ? 'Aktueller Benutzer' : undefined,
        confidence: event.confidence,
        metadata: event.payload
      });
    });

    // Add case creation event
    const caseCreatedEntry = caseItem.timeline.find(e => e.id === `tl-case-created-${caseItem.id}`);
    if (!caseCreatedEntry) {
      caseItem.timeline.push({
        id: `tl-case-created-${caseItem.id}`,
        caseId: caseItem.id,
        timestamp: caseItem.createdAt,
        type: 'CASE_CREATED',
        category: 'System',
        source: 'System',
        title: 'Vorgang erstellt',
        description: `Der Vorgang "${caseItem.title}" wurde initialisiert.`,
      });
    }

    // Also add task completion/cancellation events if not already represented
    caseItem.tasks.forEach(task => {
      if ((task.status === 'Completed' || task.status === 'Cancelled') && task.completedAt) {
        const existingEntry = caseItem.timeline.find(e => e.id === `tl-task-${task.id}-${task.status}`);
        if (!existingEntry) {
          caseItem.timeline.push({
            id: `tl-task-${task.id}-${task.status}`,
            caseId: caseItem.id,
            timestamp: task.completedAt,
            type: `TASK_${task.status.toUpperCase()}`,
            category: 'Task',
            source: 'User Action',
            title: `Aufgabe ${task.status === 'Completed' ? 'erledigt' : 'abgebrochen'}`,
            description: `Die Aufgabe "${task.title}" wurde ${task.status === 'Completed' ? 'erledigt' : 'abgebrochen'}.`,
            user: 'Aktueller Benutzer'
          });
        }
      }
    });

    // Sort descending by timestamp
    caseItem.timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  evaluateCaseHealth(caseItem: Case) {
    this.generateTasks(caseItem);
    this.generateTimeline(caseItem);

    const events = workflowEngine.getEvents().filter(e => caseItem.workflowIds.includes(e.id));
    
    let hasCustomer = !!caseItem.customerId;
    let hasEmail = false;
    let hasPhone = false;
    let hasPickup = false;
    let hasDest = false;
    let hasDate = false;
    let hasSize = false;
    let viewingRequested = false;
    let offerCreated = false;
    let offerConfirmed = false;
    let scheduled = false;
    let invoiced = false;
    let invoicePaid = false;

    // Analyze extracted data from suggestions or specific events
    for (const event of events) {
      if (event.type === 'SUGGESTION_CREATED' && event.payload?.actions) {
        for (const action of event.payload.actions) {
          if (action.data?.extractedData) {
            const data = action.data.extractedData;
            if (data.email?.recognized) hasEmail = true;
            if (data.phone?.recognized) hasPhone = true;
            if (data.pickupAddress?.recognized) hasPickup = true;
            if (data.destinationAddress?.recognized) hasDest = true;
            if (data.moveDate?.recognized) hasDate = true;
            if (data.apartmentSize?.recognized) hasSize = true;
            if (data.viewingRequested?.value) viewingRequested = true;
          }
        }
      }
      if (event.type === 'OFFER_CREATED') offerCreated = true;
      if (event.type === 'CUSTOMER_CREATED') hasCustomer = true;
      if (event.type === 'INVOICE_CREATED') invoiced = true;
      if (event.type === 'EVENT_CREATED') scheduled = true; // or calendar scheduled
    }

    if ((caseItem.offerDrafts || []).some(d => d.status === 'pdf_created' || d.status === 'ready_to_send' || d.status === 'sent')) {
      offerCreated = true;
    }

    const checklist: ChecklistItem[] = [
      { id: 'customer', label: 'Kunde identifiziert', completed: hasCustomer },
      { id: 'contact', label: 'Kontaktdaten vorhanden', completed: hasEmail || hasPhone },
      { id: 'pickup', label: 'Abholadresse vorhanden', completed: hasPickup },
      { id: 'dest', label: 'Zieladresse vorhanden', completed: hasDest },
      { id: 'date', label: 'Umzugstermin vorhanden', completed: hasDate },
      { id: 'size', label: 'Wohnungsdaten vollständig', completed: hasSize },
    ];

    if (viewingRequested) {
      checklist.push({ id: 'viewing', label: 'Besichtigung durchgeführt', completed: false }); // Placeholder logic for now
    }
    
    checklist.push({ id: 'offer', label: 'Angebot erstellt', completed: offerCreated });
    checklist.push({ id: 'confirmed', label: 'Angebot bestätigt', completed: offerConfirmed });
    checklist.push({ id: 'scheduled', label: 'Termin geplant', completed: scheduled });
    checklist.push({ id: 'invoiced', label: 'Rechnung erstellt', completed: invoiced });
    checklist.push({ id: 'paid', label: 'Rechnung bezahlt', completed: invoicePaid });

    // Health Score based on Tasks
    const totalTasks = caseItem.tasks.length;
    const completedTasks = caseItem.tasks.filter(t => t.status === 'Completed' || t.status === 'Cancelled').length;
    const score = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    let nextStep = 'Vorgang abschließen';
    const openTasks = caseItem.tasks.filter(t => t.status === 'Open' || t.status === 'Waiting' || t.status === 'In Progress');
    
    if (openTasks.length > 0) {
      // Find highest priority open task
      const highPriorityTask = openTasks.find(t => t.priority === 'high');
      nextStep = highPriorityTask ? highPriorityTask.title : openTasks[0].title;
    } else if (totalTasks === 0 && checklist.some(c => !c.completed)) {
       // Fallback to checklist if no tasks generated yet
       nextStep = 'Informationen vervollständigen';
       if (!hasCustomer) nextStep = 'Kunden identifizieren oder anlegen';
       else if (!hasPickup || !hasDest || !hasDate || !hasSize) nextStep = 'Kunde kontaktieren für fehlende Daten';
       else if (viewingRequested && !offerCreated) nextStep = 'Besichtigung vereinbaren';
       else if (!offerCreated) nextStep = 'Angebot erstellen';
       else if (!offerConfirmed) nextStep = 'Auf Kundenbestätigung warten';
       else if (!scheduled) nextStep = 'Umzug planen';
    }

    caseItem.health = {
      score,
      checklist,
      nextStep
    };
  }

  // Für zukünftige KI-Lernprozesse
  getCaseTimeline(caseId: string): CaseTimelineEntry[] {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return [];
    
    // Ensure the timeline is up-to-date
    this.generateTimeline(caseItem);
    return [...caseItem.timeline];
  }

  // Invoice Draft Helpers
  getInvoiceDrafts(caseId: string): InvoiceDraft[] {
    const caseItem = this.getCase(caseId);
    return caseItem?.invoiceDrafts || [];
  }

  addInvoiceDraft(caseId: string, draft: InvoiceDraft): InvoiceDraft {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return draft;
    if (!caseItem.invoiceDrafts) caseItem.invoiceDrafts = [];
    
    const existingIndex = caseItem.invoiceDrafts.findIndex(d => d.id === draft.id);
    if (existingIndex >= 0) {
      caseItem.invoiceDrafts[existingIndex] = draft;
    } else {
      caseItem.invoiceDrafts.push(draft);
    }
    
    this.evaluateCaseHealth(caseItem);
    this.flushPersistence();
    return draft;
  }

  updateInvoiceDraft(caseId: string, draft: InvoiceDraft): InvoiceDraft | null {
    const caseItem = this.getCase(caseId);
    if (!caseItem || !caseItem.invoiceDrafts) return null;
    
    const index = caseItem.invoiceDrafts.findIndex(d => d.id === draft.id);
    if (index === -1) return null;
    
    caseItem.invoiceDrafts[index] = draft;
    this.evaluateCaseHealth(caseItem);
    this.flushPersistence();
    return draft;
  }

  // Receivable Helpers
  getReceivables(caseId: string): Receivable[] {
    const caseItem = this.getCase(caseId);
    return caseItem?.receivables || [];
  }

  addReceivable(caseId: string, receivable: Receivable): Receivable {
    const caseItem = this.getCase(caseId);
    if (!caseItem) return receivable;
    if (!caseItem.receivables) caseItem.receivables = [];
    
    const existingIndex = caseItem.receivables.findIndex(r => r.id === receivable.id);
    if (existingIndex >= 0) {
      caseItem.receivables[existingIndex] = receivable;
    } else {
      caseItem.receivables.push(receivable);
    }
    
    this.flushPersistence();
    return receivable;
  }

  resetForTesting(repo?: CaseRepository): void {
    this.cases = [];
    this.repository = repo || new LocalCaseRepository();
    this.cases = this.repository.getAllCasesSync ? this.repository.getAllCasesSync().map(c => this.migrateCase(c, true)) : [];
    this.initRepository();
  }
}

export const caseService = new CaseService();
