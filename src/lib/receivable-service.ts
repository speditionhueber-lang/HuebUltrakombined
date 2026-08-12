import {
  Receivable,
  ReceivableStatus,
  PaymentRecord,
  ReceivableDueState,
  PaymentReminderReadiness,
  EmailResponseDraft,
  ReceivableReminderHistory
} from './types';
import { caseService, Case } from './case-service';
import { emailDraftService } from './email-draft-service';
import { automationService } from './automation-service';
import { workflowEngine } from './workflow-engine';

const sendingLocks = new Set<string>();

/**
 * Normalizes date input to YYYY-MM-DD string in local/Vienna context
 */
export function formatViennaDateString(dateInput?: string | Date | number): string {
  if (!dateInput) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof dateInput === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      return dateInput.slice(0, 10);
    }
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateInput;
  }
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Central determination of Receivable Status according to spec:
 * - disputed, cancelled, written_off are sticky
 * - outstandingAmount <= 0 -> paid
 * - now > dueDate & outstanding > 0 -> overdue
 * - paidAmount > 0 & outstanding > 0 -> partially_paid
 * - else -> open
 */
export function evaluateReceivableStatus(
  receivable: Partial<Receivable>,
  nowDate?: string
): ReceivableStatus {
  if (
    receivable.status === 'disputed' ||
    receivable.status === 'cancelled' ||
    receivable.status === 'written_off'
  ) {
    return receivable.status;
  }

  const originalAmount = Math.round((receivable.originalAmount || 0) * 100) / 100;
  const paidAmount = Math.round((receivable.paidAmount || 0) * 100) / 100;
  const outstandingAmount = Math.max(0, Math.round((originalAmount - paidAmount) * 100) / 100);

  if (outstandingAmount <= 0) {
    return 'paid';
  }

  const todayStr = formatViennaDateString(nowDate);
  const dueStr = receivable.dueDate ? formatViennaDateString(receivable.dueDate) : todayStr;

  if (todayStr > dueStr) {
    return 'overdue';
  }

  if (paidAmount > 0) {
    return 'partially_paid';
  }

  return 'open';
}

/**
 * Calculates confirmed balance and status for a Receivable without duplicating math.
 */
export function calculateReceivableBalance(
  receivable: Receivable,
  nowDate?: string
): Receivable {
  const confirmedPayments = (receivable.payments || []).filter(p => p.amount > 0);
  const sum = confirmedPayments.reduce((acc, p) => acc + p.amount, 0);

  const originalAmount = Math.round((receivable.originalAmount || 0) * 100) / 100;
  const paidAmount = Math.round(sum * 100) / 100;
  const outstandingAmount = Math.max(0, Math.round((originalAmount - paidAmount) * 100) / 100);

  const updatedReceivable: Receivable = {
    ...receivable,
    originalAmount,
    paidAmount,
    outstandingAmount
  };

  const status = evaluateReceivableStatus(updatedReceivable, nowDate);
  updatedReceivable.status = status;

  if (status === 'paid' && !updatedReceivable.paidAt) {
    updatedReceivable.paidAt = new Date().toISOString();
  }

  return updatedReceivable;
}

/**
 * Evaluates internal urgency / overdue state level for reminders and UI badges.
 */
export function evaluateReceivableDueState(
  receivable: Receivable,
  nowDate?: string
): ReceivableDueState {
  if (receivable.status === 'paid' || receivable.outstandingAmount <= 0) {
    return 'paid';
  }

  if (
    receivable.status === 'disputed' ||
    receivable.status === 'cancelled' ||
    receivable.status === 'written_off'
  ) {
    return 'blocked';
  }

  const todayStr = formatViennaDateString(nowDate);
  const dueStr = formatViennaDateString(receivable.dueDate);

  if (todayStr < dueStr) {
    return 'not_due';
  }

  if (todayStr === dueStr) {
    return 'due_today';
  }

  const todayTime = new Date(todayStr).getTime();
  const dueTime = new Date(dueStr).getTime();
  const diffDays = Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    return 'overdue_1_7_days';
  }
  if (diffDays <= 14) {
    return 'overdue_8_14_days';
  }

  return 'overdue_over_14_days';
}

/**
 * Evaluates readiness for creating or sending a payment reminder email.
 */
export function evaluatePaymentReminderReadiness(
  caseItem: Case,
  receivable: Receivable,
  emailDraft?: EmailResponseDraft | null
): PaymentReminderReadiness {
  const reasons: string[] = [];

  if (!receivable || !receivable.id) {
    return { status: 'missing_invoice', ready: false, reasons: ['Keine gültige Forderung gefunden.'] };
  }

  if (receivable.status === 'paid' || receivable.outstandingAmount <= 0) {
    return { status: 'already_paid', ready: false, reasons: ['Rechnung ist bereits vollständig bezahlt.'] };
  }

  if (
    receivable.status === 'disputed' ||
    receivable.status === 'cancelled' ||
    receivable.status === 'written_off'
  ) {
    return {
      status: 'disputed',
      ready: false,
      reasons: [`Forderungsstatus ist "${receivable.status}". Keine automatische Erinnerung erlaubt.`]
    };
  }

  const dueState = evaluateReceivableDueState(receivable);
  if (dueState === 'not_due') {
    return {
      status: 'not_due',
      ready: false,
      reasons: [`Zahlungsziel (${receivable.dueDate}) ist noch nicht erreicht.`]
    };
  }

  // Recipient email check
  const recipientEmail =
    emailDraft?.recipients?.[0]?.email ||
    caseItem.customerDraft?.fields?.email?.value ||
    '';

  if (!recipientEmail || recipientEmail.trim().length === 0) {
    return {
      status: 'missing_recipient',
      ready: false,
      reasons: ['Keine Kunden-E-Mail-Adresse für den Versand vorhanden.']
    };
  }

  // Check if reminder was already sent or active draft exists for this receivable
  const existingActiveDraft = (caseItem.emailDrafts || []).find(d =>
    d.receivableId === receivable.id &&
    d.purpose === 'payment_reminder' &&
    (d.status === 'draft' || d.status === 'edited' || d.status === 'approved' || d.status === 'sending')
  );

  const sentReminder = (receivable.reminders || []).find(r => r.status === 'sent');

  if (existingActiveDraft && emailDraft?.id !== existingActiveDraft.id) {
    return {
      status: 'already_reminded',
      ready: false,
      reasons: ['Es existiert bereits ein aktiver Entwurf für diese Zahlungserinnerung.']
    };
  }

  if (sentReminder && !existingActiveDraft) {
    return {
      status: 'already_reminded',
      ready: false,
      reasons: ['Eine Zahlungserinnerung wurde für diese Stufe bereits versendet.']
    };
  }

  reasons.push('Forderung ist überfällig und bereit für eine Zahlungserinnerung.');
  return { status: 'ready', ready: true, reasons };
}

export class ReceivableService {
  public resetForTesting(): void {
    sendingLocks.clear();
  }

  getReceivables(): Receivable[] {
    const cases = caseService.getCases();
    const list: Receivable[] = [];
    for (const c of cases) {
      if (c.receivables) {
        list.push(...c.receivables);
      }
    }
    return list;
  }

  createReceivable(params: {
    caseId: string;
    invoiceId: string;
    invoiceNumber?: string;
    customerName?: string;
    grossAmount: number;
    dueDate: string;
    status?: ReceivableStatus;
  }): Receivable {
    return this.createReceivableFromInvoice({
      invoiceId: params.invoiceId,
      invoiceNumber: params.invoiceNumber || params.invoiceId,
      caseId: params.caseId,
      customerName: params.customerName,
      totalAmount: params.grossAmount,
      dueDate: params.dueDate,
    });
  }

  createReceivableFromInvoice(params: {
    invoiceId: string;
    invoiceNumber: string;
    caseId: string;
    customerName?: string;
    totalAmount: number;
    dueDate: string;
  }): Receivable {
    const caseItem = caseService.getCase(params.caseId) || caseService.createCase({ id: params.caseId, title: 'Case for Receivable' });
    if (!caseItem.receivables) {
      caseItem.receivables = [];
    }
    const rec: Receivable = {
      id: `rec_${params.invoiceId}`,
      caseId: params.caseId,
      customerId: caseItem.customerId || 'cust_default',
      invoiceId: params.invoiceId,
      invoiceDraftId: `draft_${params.invoiceId}`,
      invoiceNumber: params.invoiceNumber,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: params.dueDate,
      originalAmount: params.totalAmount,
      paidAmount: 0,
      outstandingAmount: params.totalAmount,
      status: 'open',
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    caseItem.receivables.push(rec);
    this.syncReceivableTasks(caseItem, rec);
    caseService.saveCases();
    return rec;
  }

  markDisputed(
    caseIdOrReceivableId: string,
    receivableIdOrReason?: string,
    reason?: string
  ): { success: boolean; receivable?: Receivable; error?: string } {
    let caseId = caseIdOrReceivableId;
    let recId = receivableIdOrReason;
    let disReason = reason;

    if (!reason && (!recId || !caseService.getCase(caseId))) {
      // Called with (receivableId, reason)
      recId = caseIdOrReceivableId;
      disReason = receivableIdOrReason;
      const foundCase = caseService.getCases().find(c => (c.receivables || []).some(r => r.id === recId));
      if (foundCase) {
        caseId = foundCase.id;
      }
    }

    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.receivables) {
      return { success: false, error: 'Akte oder Forderungen nicht gefunden.' };
    }

    const rIdx = caseItem.receivables.findIndex(r => r.id === recId);
    if (rIdx === -1) return { success: false, error: 'Forderung nicht gefunden.' };

    let receivable = caseItem.receivables[rIdx];
    receivable.status = 'disputed';
    receivable.disputedAt = new Date().toISOString();
    receivable.disputeReason = disReason;

    caseService.addTimelineEntry(caseId, {
      type: 'receivable_disputed',
      category: 'Finance',
      source: 'ReceivableService',
      timestamp: new Date().toISOString(),
      title: 'Forderung als strittig markiert',
      description: `Rechnung ${receivable.invoiceNumber} ist strittig. Grund: ${disReason || 'Keine Angabe'}. Mahnstopp aktiviert.`
    });

    workflowEngine.emitEvent('RECEIVABLE_STATUS_CHANGED', 'ReceivableService', {
      caseId,
      receivableId: receivable.id,
      status: 'disputed',
      reason: disReason
    });

    this.syncReceivableTasks(caseItem, receivable);
    caseService.saveCases();

    return { success: true, receivable };
  }
  /**
   * Records a manual payment entry.
   */
  recordPayment(
    caseId: string,
    receivableId: string,
    paymentData: {
      amount: number;
      date: string;
      method?: 'bank_transfer' | 'cash' | 'card' | 'deposit' | 'other';
      source?: 'manual' | 'bank_import' | 'deposit' | 'credit_note';
      reference?: string;
      notes?: string;
      confirmedBy?: string;
    },
    options?: { allowOverpayment?: boolean }
  ): { success: boolean; receivable?: Receivable; payment?: PaymentRecord; error?: string } {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) {
      return { success: false, error: `Akte mit ID ${caseId} nicht gefunden.` };
    }

    if (!caseItem.receivables) {
      caseItem.receivables = [];
    }

    const receivableIndex = caseItem.receivables.findIndex(r => r.id === receivableId);
    if (receivableIndex === -1) {
      return { success: false, error: `Forderung mit ID ${receivableId} nicht gefunden.` };
    }

    let receivable = caseItem.receivables[receivableIndex];

    if (receivable.status === 'cancelled' || receivable.status === 'written_off') {
      return {
        success: false,
        error: `Zahlung kann nicht verbucht werden, da die Forderung den Status "${receivable.status}" hat.`
      };
    }

    if (!paymentData.amount || paymentData.amount <= 0 || isNaN(paymentData.amount)) {
      return { success: false, error: 'Zahlungsbetrag muss größer als 0 Euro sein.' };
    }

    if (!paymentData.date || isNaN(new Date(paymentData.date).getTime())) {
      return { success: false, error: 'Ungültiges Zahlungsdatum.' };
    }

    const amount = Math.round(paymentData.amount * 100) / 100;
    const currentPaid = receivable.paidAmount || 0;
    const newTotalPaid = currentPaid + amount;

    if (newTotalPaid > receivable.originalAmount + 0.01 && !options?.allowOverpayment) {
      return {
        success: false,
        error: `Überzahlung erkannt: Der Gesamtbetrag (${newTotalPaid.toFixed(2)} €) übersteigt den Rechnungsbetrag (${receivable.originalAmount.toFixed(2)} €). Bitte bestätigen Sie die Überzahlung ausdrücklich.`
      };
    }

    // Deduplication check: prevent identical payment added twice in short succession
    const isDuplicate = (receivable.payments || []).some(p =>
      p.amount === amount &&
      formatViennaDateString(p.date) === formatViennaDateString(paymentData.date) &&
      (p.reference || '') === (paymentData.reference || '') &&
      (p.notes || '') === (paymentData.notes || '')
    );

    if (isDuplicate) {
      return {
        success: false,
        error: 'Identischer Zahlungseintrag wurde bereits erfasst (Duplikatschutz).'
      };
    }

    const newPayment: PaymentRecord = {
      id: crypto.randomUUID(),
      amount,
      date: formatViennaDateString(paymentData.date),
      method: paymentData.method || 'bank_transfer',
      source: paymentData.source || 'manual',
      reference: paymentData.reference,
      notes: paymentData.notes,
      confirmedBy: paymentData.confirmedBy || 'Benutzer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    receivable.payments = [...(receivable.payments || []), newPayment];
    receivable = calculateReceivableBalance(receivable);
    caseItem.receivables[receivableIndex] = receivable;

    // Timeline entry
    const isFull = receivable.outstandingAmount <= 0;
    caseService.addTimelineEntry(caseId, {
      type: isFull ? 'payment_completed' : 'payment_recorded',
      category: 'Finance',
      source: 'ReceivableService',
      timestamp: new Date().toISOString(),
      title: isFull ? 'Rechnung vollständig bezahlt' : 'Zahlungseingang verbucht',
      description: `Zahlung von ${amount.toFixed(2)} € am ${formatViennaDateString(paymentData.date)} für Rechnung ${receivable.invoiceNumber} erfasst. Offener Restbetrag: ${receivable.outstandingAmount.toFixed(2)} €.`
    });

    // Workflow events
    workflowEngine.emitEvent('PAYMENT_RECORDED', 'ReceivableService', {
      caseId,
      receivableId: receivable.id,
      paymentId: newPayment.id,
      amount,
      outstandingAmount: receivable.outstandingAmount,
      status: receivable.status
    });

    if (isFull) {
      workflowEngine.emitEvent('INVOICE_PAID', 'ReceivableService', {
        caseId,
        receivableId: receivable.id,
        invoiceNumber: receivable.invoiceNumber,
        paidAt: receivable.paidAt
      });
    }

    this.syncReceivableTasks(caseItem, receivable);
    caseService.saveCases();

    return { success: true, receivable, payment: newPayment };
  }

  /**
   * Updates an existing payment record.
   */
  updatePayment(
    caseId: string,
    receivableId: string,
    paymentId: string,
    updates: Partial<PaymentRecord>,
    options?: { allowOverpayment?: boolean }
  ): { success: boolean; receivable?: Receivable; error?: string } {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.receivables) {
      return { success: false, error: 'Akte oder Forderungen nicht gefunden.' };
    }

    const rIdx = caseItem.receivables.findIndex(r => r.id === receivableId);
    if (rIdx === -1) return { success: false, error: 'Forderung nicht gefunden.' };

    let receivable = caseItem.receivables[rIdx];
    const pIdx = (receivable.payments || []).findIndex(p => p.id === paymentId);
    if (pIdx === -1) return { success: false, error: 'Zahlungseintrag nicht gefunden.' };

    const oldPayment = receivable.payments[pIdx];
    const updatedPayment: PaymentRecord = {
      ...oldPayment,
      ...updates,
      amount: updates.amount !== undefined ? Math.round(updates.amount * 100) / 100 : oldPayment.amount,
      updatedAt: new Date().toISOString()
    };

    if (updatedPayment.amount <= 0) {
      return { success: false, error: 'Zahlungsbetrag muss größer als 0 € sein.' };
    }

    const tempPayments = [...receivable.payments];
    tempPayments[pIdx] = updatedPayment;
    const tempSum = tempPayments.reduce((acc, p) => acc + p.amount, 0);

    if (tempSum > receivable.originalAmount + 0.01 && !options?.allowOverpayment) {
      return {
        success: false,
        error: `Überzahlung erkannt: Korrigierter Gesamtbetrag (${tempSum.toFixed(2)} €) übersteigt den Rechnungsbetrag (${receivable.originalAmount.toFixed(2)} €).`
      };
    }

    receivable.payments = tempPayments;
    receivable = calculateReceivableBalance(receivable);
    caseItem.receivables[rIdx] = receivable;

    caseService.addTimelineEntry(caseId, {
      type: 'payment_updated',
      category: 'Finance',
      source: 'ReceivableService',
      timestamp: new Date().toISOString(),
      title: 'Zahlungseintrag korrigiert',
      description: `Zahlung ${paymentId} für Rechnung ${receivable.invoiceNumber} angepasst auf ${updatedPayment.amount.toFixed(2)} €.`
    });

    workflowEngine.emitEvent('PAYMENT_UPDATED', 'ReceivableService', {
      caseId,
      receivableId: receivable.id,
      paymentId
    });

    this.syncReceivableTasks(caseItem, receivable);
    caseService.saveCases();

    return { success: true, receivable };
  }

  /**
   * Removes a payment record.
   */
  deletePayment(
    caseId: string,
    receivableId: string,
    paymentId: string
  ): { success: boolean; receivable?: Receivable; error?: string } {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.receivables) {
      return { success: false, error: 'Akte oder Forderungen nicht gefunden.' };
    }

    const rIdx = caseItem.receivables.findIndex(r => r.id === receivableId);
    if (rIdx === -1) return { success: false, error: 'Forderung nicht gefunden.' };

    let receivable = caseItem.receivables[rIdx];
    receivable.payments = (receivable.payments || []).filter(p => p.id !== paymentId);
    receivable = calculateReceivableBalance(receivable);
    caseItem.receivables[rIdx] = receivable;

    caseService.addTimelineEntry(caseId, {
      type: 'payment_deleted',
      category: 'Finance',
      source: 'ReceivableService',
      timestamp: new Date().toISOString(),
      title: 'Zahlungseintrag gelöscht',
      description: `Zahlungseintrag für Rechnung ${receivable.invoiceNumber} wurde entfernt. Neuberechneter Restbetrag: ${receivable.outstandingAmount.toFixed(2)} €.`
    });

    workflowEngine.emitEvent('PAYMENT_UPDATED', 'ReceivableService', {
      caseId,
      receivableId: receivable.id,
      paymentId
    });

    this.syncReceivableTasks(caseItem, receivable);
    caseService.saveCases();

    return { success: true, receivable };
  }

  /**
   * Marks a receivable as disputed (strittig).
   */
  markReceivableDisputed(
    caseId: string,
    receivableId: string,
    reason: string
  ): { success: boolean; receivable?: Receivable; error?: string } {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.receivables) {
      return { success: false, error: 'Akte oder Forderungen nicht gefunden.' };
    }

    const rIdx = caseItem.receivables.findIndex(r => r.id === receivableId);
    if (rIdx === -1) return { success: false, error: 'Forderung nicht gefunden.' };

    let receivable = caseItem.receivables[rIdx];
    receivable.status = 'disputed';
    receivable.disputedAt = new Date().toISOString();
    receivable.disputeReason = reason;

    caseService.addTimelineEntry(caseId, {
      type: 'receivable_disputed',
      category: 'Finance',
      source: 'ReceivableService',
      timestamp: new Date().toISOString(),
      title: 'Forderung als strittig markiert',
      description: `Rechnung ${receivable.invoiceNumber} ist strittig. Grund: ${reason || 'Keine Angabe'}. Mahnstopp aktiviert.`
    });

    workflowEngine.emitEvent('RECEIVABLE_STATUS_CHANGED', 'ReceivableService', {
      caseId,
      receivableId: receivable.id,
      status: 'disputed',
      reason
    });

    this.syncReceivableTasks(caseItem, receivable);
    caseService.saveCases();

    return { success: true, receivable };
  }

  preparePaymentReminderDraft(
    caseId: string,
    receivableId: string
  ): { success: boolean; emailDraft?: EmailResponseDraft; draft?: EmailResponseDraft; error?: string } {
    const res = this.preparePaymentReminder(caseId, receivableId);
    return { ...res, draft: res.emailDraft };
  }

  /**
   * Prepares a controlled payment reminder draft.
   */
  preparePaymentReminder(
    caseId: string,
    receivableId: string
  ): { success: boolean; emailDraft?: EmailResponseDraft; error?: string } {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.receivables) {
      return { success: false, error: 'Akte oder Forderungen nicht gefunden.' };
    }

    const receivable = caseItem.receivables.find(r => r.id === receivableId);
    if (!receivable) {
      return { success: false, error: 'Forderung nicht gefunden.' };
    }

    const readiness = evaluatePaymentReminderReadiness(caseItem, receivable);
    if (!readiness.ready) {
      return { success: false, error: readiness.reasons.join(' ') };
    }

    const draft = emailDraftService.createDraftForCase(caseId, {
      purpose: 'payment_reminder',
      docNumber: receivable.invoiceNumber,
      grossTotal: receivable.originalAmount,
      paidAmount: receivable.paidAmount,
      outstandingAmount: receivable.outstandingAmount,
      dueDate: receivable.dueDate,
      receivableId: receivable.id,
      invoiceDraftId: receivable.invoiceDraftId,
      invoiceId: receivable.invoiceId,
      forceNew: true,
      createdBy: 'rule'
    });

    if (!draft) {
      return { success: false, error: 'Fehler beim Erstellen des E-Mail-Entwurfs.' };
    }

    caseService.addTimelineEntry(caseId, {
      type: 'payment_reminder_prepared',
      category: 'Finance',
      source: 'ReceivableService',
      timestamp: new Date().toISOString(),
      title: 'Zahlungserinnerung vorbereitet',
      description: `E-Mail-Entwurf für Rechnung ${receivable.invoiceNumber} mit offenem Betrag von ${receivable.outstandingAmount.toFixed(2)} € wurde im Activity Center erstellt.`
    });

    workflowEngine.emitEvent('PAYMENT_REMINDER_DRAFT_CREATED', 'ReceivableService', {
      caseId,
      receivableId: receivable.id,
      emailDraftId: draft.id,
      outstandingAmount: receivable.outstandingAmount
    });

    this.syncReceivableTasks(caseItem, receivable);
    caseService.saveCases();

    return { success: true, emailDraft: draft };
  }

  /**
   * Executes controlled sending of a payment reminder over Outlook with runtime lock.
   */
  async sendPaymentReminder(
    caseId: string,
    receivableId: string,
    emailDraftId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (sendingLocks.has(emailDraftId)) {
      return { success: false, error: 'Versandvorgang läuft bereits (Sperre aktiv).' };
    }

    sendingLocks.add(emailDraftId);

    try {
      const caseItem = caseService.getCase(caseId);
      if (!caseItem || !caseItem.receivables || !caseItem.emailDrafts) {
        return { success: false, error: 'Akte, Forderung oder E-Mail-Entwürfe nicht gefunden.' };
      }

      const receivable = caseItem.receivables.find(r => r.id === receivableId);
      if (!receivable) {
        return { success: false, error: 'Forderung nicht gefunden.' };
      }

      const draft = caseItem.emailDrafts.find(d => d.id === emailDraftId);
      if (!draft) {
        return { success: false, error: 'E-Mail-Entwurf nicht gefunden.' };
      }

      // Re-evaluate readiness
      if (receivable.status === 'paid' || receivable.outstandingAmount <= 0) {
        return { success: false, error: 'Rechnung ist bereits vollständig bezahlt. Versand abgebrochen.' };
      }

      if (receivable.status === 'disputed') {
        return { success: false, error: 'Forderung ist als strittig markiert. Versand abgebrochen.' };
      }

      // Ensure approved
      draft.status = 'approved';
      draft.approvedAt = new Date().toISOString();
      caseService.saveCases();

      // Execute send via automation service
      draft.status = 'sending';
      const sendResult = await automationService.executeApprovedEmailDraft(draft, caseId);

      if (sendResult.success) {
        draft.status = 'sent';
        draft.sentAt = new Date().toISOString();

        const reminderRecord: ReceivableReminderHistory = {
          id: crypto.randomUUID(),
          emailDraftId: draft.id,
          reminderLevel: 'payment_reminder',
          createdAt: draft.createdAt,
          sentAt: draft.sentAt,
          outstandingAmountAtSend: receivable.outstandingAmount,
          status: 'sent'
        };

        receivable.reminders = [...(receivable.reminders || []), reminderRecord];

        caseService.addTimelineEntry(caseId, {
          type: 'payment_reminder_sent',
          category: 'Finance',
          source: 'ReceivableService',
          timestamp: new Date().toISOString(),
          title: 'Zahlungserinnerung versendet',
          description: `Zahlungserinnerung für Rechnung ${receivable.invoiceNumber} erfolgreich über Microsoft Outlook an ${draft.recipients?.[0]?.email || 'Kunde'} versendet.`
        });

        workflowEngine.emitEvent('PAYMENT_REMINDER_SENT', 'ReceivableService', {
          caseId,
          receivableId: receivable.id,
          emailDraftId: draft.id,
          messageId: sendResult.messageId
        });

        this.syncReceivableTasks(caseItem, receivable);
        caseService.saveCases();

        return { success: true };
      } else {
        draft.status = 'failed';
        draft.errorMessage = sendResult.error;

        const reminderRecord: ReceivableReminderHistory = {
          id: crypto.randomUUID(),
          emailDraftId: draft.id,
          reminderLevel: 'payment_reminder',
          createdAt: draft.createdAt,
          outstandingAmountAtSend: receivable.outstandingAmount,
          status: 'failed'
        };

        receivable.reminders = [...(receivable.reminders || []), reminderRecord];

        caseService.addTimelineEntry(caseId, {
          type: 'payment_reminder_failed',
          category: 'Finance',
          source: 'ReceivableService',
          timestamp: new Date().toISOString(),
          title: 'Versand der Zahlungserinnerung fehlgeschlagen',
          description: `Fehler beim Versenden der Zahlungserinnerung für Rechnung ${receivable.invoiceNumber}: ${sendResult.error}`
        });

        workflowEngine.emitEvent('PAYMENT_REMINDER_FAILED', 'ReceivableService', {
          caseId,
          receivableId: receivable.id,
          emailDraftId: draft.id,
          error: sendResult.error
        });

        caseService.saveCases();
        return { success: false, error: sendResult.error || 'Fehler beim E-Mail-Versand.' };
      }
    } finally {
      sendingLocks.delete(emailDraftId);
    }
  }

  /**
   * Synchronizes Tasks for the Case based on Receivable State.
   */
  syncReceivableTasks(caseItem: Case, receivable: Receivable): void {
    if (!caseItem.tasks) {
      caseItem.tasks = [];
    }

    const invNum = receivable.invoiceNumber;
    const isPaid = receivable.status === 'paid' || receivable.outstandingAmount <= 0;
    const isDisputed = receivable.status === 'disputed';
    const isOverdue = receivable.status === 'overdue';
    const isPartial = receivable.status === 'partially_paid';

    // Find or create "Zahlung überwachen" task
    let monitorTask = caseItem.tasks.find(
      t => t.category === 'Invoice' && t.workflowId === `wf-invoice-monitor-${receivable.id}`
    );

    if (!monitorTask) {
      monitorTask = {
        id: crypto.randomUUID(),
        caseId: caseItem.id,
        title: `Zahlung überwachen (${invNum})`,
        description: `Warten auf Zahlungseingang für Rechnung ${invNum}. Offen: ${(receivable.outstandingAmount ?? 0).toFixed(2)} €`,
        category: 'Invoice',
        priority: 'medium',
        status: isPaid ? 'Completed' : 'Waiting',
        createdAt: new Date().toISOString(),
        source: 'ReceivableService',
        workflowId: `wf-invoice-monitor-${receivable.id}`,
        referenceType: 'receivable',
        referenceId: receivable.id
      };
      caseItem.tasks.push(monitorTask);
    }

    if (isPaid) {
      monitorTask.status = 'Completed';
      monitorTask.completedAt = new Date().toISOString();
    } else if (isPartial) {
      monitorTask.title = `Restzahlung überwachen (${invNum})`;
      monitorTask.description = `Teilzahlung erhalten. Offener Restbetrag: ${(receivable.outstandingAmount ?? 0).toFixed(2)} €`;
      monitorTask.status = 'Waiting';
    }

    // Reminder Task
    let reminderTask = caseItem.tasks.find(
      t => t.category === 'Invoice' && t.workflowId === `wf-invoice-reminder-${receivable.id}`
    );

    if (isOverdue && !isDisputed && !isPaid) {
      if (!reminderTask) {
        reminderTask = {
          id: crypto.randomUUID(),
          caseId: caseItem.id,
          title: `Zahlungserinnerung prüfen (${invNum})`,
          description: `Rechnung ${invNum} ist seit ${receivable.dueDate} überfällig. Entwurf prüfen und freigeben.`,
          category: 'Invoice',
          priority: 'high',
          status: 'Open',
          createdAt: new Date().toISOString(),
          source: 'ReceivableService',
          workflowId: `wf-invoice-reminder-${receivable.id}`,
          referenceType: 'receivable',
          referenceId: receivable.id
        };
        caseItem.tasks.push(reminderTask);
      } else if (reminderTask.status === 'Waiting') {
        reminderTask.status = 'Open';
      }
    } else if (reminderTask) {
      if (isPaid) {
        reminderTask.status = 'Completed';
        reminderTask.completedAt = new Date().toISOString();
      } else if (isDisputed) {
        reminderTask.status = 'Cancelled';
      }
    }

    // Dispute Task
    let disputeTask = caseItem.tasks.find(
      t => t.category === 'Invoice' && t.workflowId === `wf-invoice-dispute-${receivable.id}`
    );

    if (isDisputed) {
      if (!disputeTask) {
        disputeTask = {
          id: crypto.randomUUID(),
          caseId: caseItem.id,
          title: `Forderung klären (${invNum})`,
          description: `Rechnung ${invNum} ist als strittig markiert. Grund: ${receivable.disputeReason || 'Ungeklärt'}.`,
          category: 'Invoice',
          priority: 'high',
          status: 'Open',
          createdAt: new Date().toISOString(),
          source: 'ReceivableService',
          workflowId: `wf-invoice-dispute-${receivable.id}`,
          referenceType: 'receivable',
          referenceId: receivable.id
        };
        caseItem.tasks.push(disputeTask);
      }
    } else if (disputeTask && isPaid) {
      disputeTask.status = 'Completed';
      disputeTask.completedAt = new Date().toISOString();
    }
  }
}

export const receivableService = new ReceivableService();
