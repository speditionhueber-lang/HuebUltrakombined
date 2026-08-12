import { caseService, type Case } from './case-service';
import { crmLookupService } from './crm-lookup-service';
import { workflowEngine } from './workflow-engine';
import { generateInvoicePDF } from './pdf-generator';
import { documentService } from './document-service';
import { emailDraftService } from './email-draft-service';
import type {
  Customer,
  OfferDraft,
  OperationExecutionReview,
  InvoiceDraft,
  InvoiceDraftItem,
  InvoiceDraftTotals,
  InvoiceDraftReadiness,
  InvoiceDraftStatus,
  InvoiceDraftCorrection,
  Receivable,
  AppDocument,
  Invoice
} from './types';

// In-memory locks to prevent concurrent duplicate PDF generations
const pdfGenerationLocks = new Set<string>();

export class InvoiceDraftService {
  /**
   * Compares offer items with actual execution data and additional services
   * to construct initial invoice items.
   */
  compareOfferWithExecution(
    offerDraft?: OfferDraft | null,
    executionReview?: OperationExecutionReview | null
  ): { items: InvoiceDraftItem[]; warnings: string[]; deviations: any[] } {
    const items: InvoiceDraftItem[] = [];
    const warnings: string[] = [];
    const deviations: any[] = [];

    // 1. Process items from the accepted offer
    if (offerDraft && offerDraft.items && offerDraft.items.length > 0) {
      offerDraft.items.forEach((offerItem, index) => {
        // Check if item was completed in actual execution
        const completedResult = executionReview?.actualData?.completedServices?.find(
          s => s.id === offerItem.id || (s.label && s.label.toLowerCase() === offerItem.description.toLowerCase())
        );

        const isCompleted = completedResult ? completedResult.completed : true;

        if (!isCompleted) {
          warnings.push(`Leistung "${offerItem.description}" wurde im Angebot vereinbart, aber laut Einsatzbericht nicht vollständig ausgeführt.`);
        }

        const quantity = offerItem.quantity || 1;
        const unitPrice = offerItem.unitPrice || 0;
        const total = Math.round(quantity * unitPrice * 100) / 100;

        items.push({
          id: `item_off_${index + 1}_${Date.now()}`,
          description: offerItem.description,
          quantity,
          unit: offerItem.unit || 'Psch',
          unitPrice,
          total,
          category: offerItem.category || 'Angebotene Leistung',
          source: 'offer',
          sourceReferenceId: offerItem.id,
          selected: isCompleted, // Pre-select if performed, unselect if unperformed
          editable: true,
          billable: true,
          customerApproved: true,
          confidence: offerItem.confidence || 'high'
        });
      });
    }

    // 2. Process additional services recorded during execution
    if (executionReview?.actualData?.additionalServices && executionReview.actualData.additionalServices.length > 0) {
      executionReview.actualData.additionalServices.forEach((addSrv, index) => {
        const isApproved = addSrv.customerApproved !== false;
        const isBillable = addSrv.billable !== false;

        if (!isApproved) {
          warnings.push(`Zusatzleistung "${addSrv.description}" wurde während des Einsatzes erfasst, aber noch nicht ausdrücklich vom Kunden bestätigt.`);
        }

        const quantity = addSrv.quantity || 1;
        const unitPrice = (addSrv as any).unitPrice ?? addSrv.suggestedUnitPrice ?? 0;
        const total = (addSrv as any).total ?? Math.round(quantity * unitPrice * 100) / 100;

        items.push({
          id: `item_add_${index + 1}_${Date.now()}`,
          description: addSrv.description,
          quantity,
          unit: addSrv.unit || 'Psch',
          unitPrice,
          total,
          category: 'Zusatzleistung',
          source: 'additional_service',
          sourceReferenceId: addSrv.id,
          selected: isApproved && isBillable, // Pre-select only if confirmed & billable
          editable: true,
          billable: isBillable,
          customerApproved: isApproved,
          confidence: 'high'
        });
      });
    }

    // 3. Fallback: If no offer and no additional services, convert completed services from execution
    if (items.length === 0 && executionReview?.actualData?.completedServices) {
      executionReview.actualData.completedServices.forEach((srv, index) => {
        items.push({
          id: `item_exec_${index + 1}_${Date.now()}`,
          description: srv.label || 'Ausgeführte Leistung',
          quantity: 1,
          unit: 'Psch',
          unitPrice: 0,
          total: 0,
          category: 'Ausgeführte Leistung',
          source: 'execution',
          sourceReferenceId: srv.id,
          selected: srv.completed,
          editable: true,
          billable: true,
          customerApproved: true,
          confidence: 'medium'
        });
      });
    }

    // 4. Record deviations if present in execution review
    if (executionReview?.deviations) {
      executionReview.deviations.forEach(dev => {
        deviations.push(dev);
        if (dev.severity === 'warning' || dev.severity === 'critical') {
          warnings.push(`Einsatzabweichung: ${dev.description}`);
        }
      });
    }

    return { items, warnings, deviations };
  }

  /**
   * Centralized calculation of invoice totals, net, VAT, gross, and outstanding amount.
   */
  calculateInvoiceTotals(
    items: InvoiceDraftItem[],
    discountValue: number = 0,
    surchargeValue: number = 0,
    vatRate: number = 0.20,
    depositPaid: number = 0,
    otherPayments: number = 0
  ): InvoiceDraftTotals {
    const round = (val: number) => Math.round(val * 100) / 100;

    // Subtotal from selected billable items
    const subtotalNet = items
      .filter(item => item.selected && item.billable !== false)
      .reduce((sum, item) => sum + round(item.quantity * item.unitPrice), 0);

    const safeDiscount = Math.max(0, round(discountValue));
    const safeSurcharge = Math.max(0, round(surchargeValue));

    const netTotal = Math.max(0, round(subtotalNet - safeDiscount + safeSurcharge));
    const vatAmount = round(netTotal * vatRate);
    const grossTotal = round(netTotal + vatAmount);

    const safeDeposit = Math.max(0, round(depositPaid));
    const safePayments = Math.max(0, round(otherPayments));
    const totalPaid = round(safeDeposit + safePayments);

    const outstandingAmount = Math.max(0, round(grossTotal - totalPaid));

    return {
      subtotalNet: round(subtotalNet),
      discountValue: safeDiscount,
      surchargeValue: safeSurcharge,
      netTotal,
      vatRate,
      vatAmount,
      grossTotal,
      depositPaid: safeDeposit,
      otherPayments: safePayments,
      outstandingAmount
    };
  }

  /**
   * Validates an invoice draft for completeness and rule compliance.
   */
  validateInvoiceDraft(
    draft: InvoiceDraft,
    caseItem?: Case,
    customer?: Customer
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!draft) {
      return { valid: false, errors: ['Kein Rechnungsentwurf vorhanden.'] };
    }

    if (!draft.caseId) {
      errors.push('Case-ID fehlt im Rechnungsentwurf.');
    }

    // Billing address check
    const hasAddress =
      draft.billingAddress &&
      (draft.billingAddress.street || draft.billingAddress.line1 || draft.billingAddress.city || draft.billingAddress.name);

    if (!hasAddress) {
      errors.push('Rechnungsadresse fehlt oder ist unvollständig.');
    }

    // Selected billable items check
    const selectedItems = draft.items.filter(i => i.selected && i.billable !== false);
    if (selectedItems.length === 0) {
      errors.push('Keine abrechenbaren Positionen ausgewählt.');
    }

    // Validate individual selected items
    selectedItems.forEach(item => {
      if (!item.description || item.description.trim() === '') {
        errors.push(`Position ohne Beschreibung vorhanden.`);
      }
      if (item.quantity <= 0) {
        errors.push(`Ungültige Menge (${item.quantity}) bei Position "${item.description}".`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Ungültiger Einzelpreis (${item.unitPrice}) bei Position "${item.description}".`);
      }
    });

    // Validate totals math
    const calcTotals = this.calculateInvoiceTotals(
      draft.items,
      draft.discountValue,
      draft.surchargeValue,
      draft.vatRate,
      draft.depositPaid,
      draft.otherPayments
    );

    if (Math.abs(calcTotals.grossTotal - draft.grossTotal) > 0.05) {
      errors.push(`Berechnete Gesamtsumme (${calcTotals.grossTotal} €) weicht vom Entwurf (${draft.grossTotal} €) ab.`);
    }

    if (draft.depositPaid + draft.otherPayments > draft.grossTotal) {
      errors.push('Geleistete Zahlungen übersteigen den Gesamtrechnungsbetrag.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Evaluates readiness of the invoice draft to be approved and converted into a PDF/Invoice.
   */
  evaluateInvoiceReadiness(
    draft: InvoiceDraft,
    caseItem?: Case,
    customer?: Customer
  ): InvoiceDraftReadiness {
    const missingFields: string[] = [];
    const warnings: string[] = [];
    const blockers: string[] = [];

    if (!customer && !caseItem?.customerId) {
      missingFields.push('Kunde');
    }

    const hasAddress =
      draft.billingAddress &&
      (draft.billingAddress.street || draft.billingAddress.line1 || draft.billingAddress.city || draft.billingAddress.name);

    if (!hasAddress) {
      missingFields.push('Rechnungsadresse');
    }

    const selectedItems = draft.items.filter(i => i.selected && i.billable !== false);
    if (selectedItems.length === 0) {
      blockers.push('Keine ausgewählten Abrechnungspositionen');
    }

    // Check for unconfirmed additional services
    const unconfirmedServices = draft.items.filter(
      i => i.source === 'additional_service' && i.customerApproved === false
    );
    if (unconfirmedServices.length > 0) {
      warnings.push(`${unconfirmedServices.length} unbestätigte Zusatzleistung(en) vorhanden.`);
    }

    // Check execution follow-up
    if (caseItem?.operationExecutionReviews) {
      const exec = caseItem.operationExecutionReviews.find(r => r.id === draft.operationExecutionReviewId);
      if (exec?.followUpRequired) {
        warnings.push('Einsatz erfordert Nacharbeit.');
      }
      if (exec?.incidents && exec.incidents.some(i => !i.resolved && i.severity === 'high')) {
        warnings.push('Ungeklärte kritische Vorkommnisse im Einsatzbericht vorhanden.');
      }
    }

    // Existing invoice check
    if (draft.status === 'pdf_created' || draft.status === 'open' || draft.status === 'paid') {
      return {
        status: 'existing_invoice',
        ready: false,
        missingFields,
        warnings,
        blockers: ['Rechnung wurde bereits erzeugt & gebucht']
      };
    }

    const isReady = blockers.length === 0 && missingFields.length === 0;

    let status: InvoiceDraftReadiness['status'] = 'ready';
    if (!isReady) {
      if (missingFields.includes('Kunde')) status = 'missing_customer';
      else if (missingFields.includes('Rechnungsadresse')) status = 'missing_billing_address';
      else if (blockers.includes('Keine ausgewählten Abrechnungspositionen')) status = 'missing_invoice_items';
      else status = 'blocked';
    } else if (unconfirmedServices.length > 0) {
      status = 'unresolved_additional_services';
    }

    return {
      status,
      ready: isReady,
      missingFields,
      warnings,
      blockers
    };
  }

  /**
   * Validates state transitions for InvoiceDraft.
   */
  canTransitionInvoiceDraftStatus(
    currentStatus: InvoiceDraftStatus,
    targetStatus: InvoiceDraftStatus
  ): boolean {
    if (currentStatus === targetStatus) return true;

    const allowed: Record<InvoiceDraftStatus, InvoiceDraftStatus[]> = {
      draft: ['edited', 'approved', 'rejected', 'cancelled'],
      edited: ['edited', 'approved', 'rejected', 'cancelled'],
      approved: ['pdf_created', 'edited', 'rejected', 'cancelled'],
      pdf_created: ['open', 'storno', 'cancelled'],
      open: ['partially_paid', 'paid', 'overdue', 'storno', 'cancelled'],
      partially_paid: ['paid', 'overdue', 'storno', 'cancelled'],
      paid: ['storno'],
      overdue: ['partially_paid', 'paid', 'storno', 'cancelled'],
      rejected: ['draft', 'edited', 'cancelled'],
      cancelled: [],
      storno: [],
      failed: ['draft', 'edited', 'cancelled']
    };

    return allowed[currentStatus]?.includes(targetStatus) ?? false;
  }

  /**
   * Creates an initial InvoiceDraft from a completed OperationExecution.
   * Idempotent: Returns existing active draft if one already exists.
   */
  createInvoiceDraftForCase(
    caseId: string,
    options?: { reviewId?: string; confirmedBy?: string }
  ): InvoiceDraft | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    // Idempotency: Return active draft if one already exists
    if (caseItem.invoiceDrafts && caseItem.invoiceDrafts.length > 0) {
      const activeDraft = caseItem.invoiceDrafts.find(d => d.status !== 'rejected' && d.status !== 'cancelled');
      if (activeDraft) {
        return activeDraft;
      }
    }

    // Find completed OperationExecutionReview
    const executionReviews = caseItem.operationExecutionReviews || [];
    const executionReview = options?.reviewId
      ? executionReviews.find(r => r.id === options.reviewId)
      : executionReviews.find(r => r.status === 'completed') || executionReviews[0];

    if (!executionReview || executionReview.status !== 'completed') {
      return null; // Invoice draft can only start after OPERATION_EXECUTION_COMPLETED
    }

    // Find active offer draft
    const offerDrafts = caseItem.offerDrafts || [];
    const offerDraft = offerDrafts.find(d => d.status === 'sent' || d.status === 'approved') || offerDrafts[0];

    // Find CRM customer
    const customer = crmLookupService.findCustomerForCase(caseItem);

    // Reconcile items
    const { items: reconciledItems, warnings } = this.compareOfferWithExecution(offerDraft, executionReview);

    // Calculate deposit paid from offer or case documents
    let depositPaid = 0;
    if (offerDraft) {
      const offerTotals = offerDraft;
      // Standard deposit is 30% if anzahlungsrechnung was issued
      if (offerDraft.offerType === 'binding') {
        depositPaid = Math.round(offerTotals.grossTotal * 0.3 * 100) / 100;
      }
    }

    // Calculate initial totals
    const totals = this.calculateInvoiceTotals(reconciledItems, 0, 0, 0.20, depositPaid, 0);

    const nowIso = new Date().toISOString();
    const todayFormatted = new Date().toISOString().split('T')[0];

    // Service date (Leistungsdatum) from execution end or completed date
    let serviceDate = todayFormatted;
    if (executionReview.actualData.actualEnd) {
      serviceDate = executionReview.actualData.actualEnd.split('T')[0];
    } else if (executionReview.completedAt) {
      serviceDate = executionReview.completedAt.split('T')[0];
    }

    // Due date (Zahlungsziel): today + 14 days
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 14);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    // Assemble billing address
    const custAny = customer as any;
    const billingAddress = {
      name: customer?.name || caseItem.customerDraft?.fields?.name?.value || 'Kunde',
      street: custAny?.rechnungsadresse?.strasse || customer?.address?.street || caseItem.customerDraft?.fields?.destinationAddress?.street?.value || '',
      zip: custAny?.rechnungsadresse?.plz || customer?.address?.zip || '',
      city: custAny?.rechnungsadresse?.ort || customer?.address?.city || '',
      country: custAny?.rechnungsadresse?.land || customer?.address?.country || 'Österreich'
    };

    const draftId = `inv_draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const draft: InvoiceDraft = {
      id: draftId,
      caseId: caseItem.id,
      customerId: customer?.id || caseItem.customerId,
      operationExecutionReviewId: executionReview.id,
      offerDraftId: offerDraft?.id,
      status: 'draft',
      invoiceType: 'standard',
      invoiceDate: todayFormatted,
      serviceDate,
      dueDate,
      billingAddress,
      items: reconciledItems,
      subtotalNet: totals.subtotalNet,
      discountValue: totals.discountValue,
      surchargeValue: totals.surchargeValue,
      netTotal: totals.netTotal,
      vatRate: totals.vatRate,
      vatAmount: totals.vatAmount,
      grossTotal: totals.grossTotal,
      depositPaid: totals.depositPaid,
      otherPayments: totals.otherPayments,
      outstandingAmount: totals.outstandingAmount,
      paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
      notes: warnings.length > 0 ? `Hinweise: ${warnings.join(' ')}` : 'Rechnungsentwurf aus bestätigtem Einsatzabschluss.',
      corrections: [],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // Save to Case
    caseService.addInvoiceDraft(caseItem.id, draft);

    // Add task "Rechnungsentwurf vorbereiten" if not exists
    if (!caseItem.tasks.some(t => t.title.includes('Rechnungsentwurf vorbereiten'))) {
      caseService.addTask(caseItem.id, {
        title: 'Rechnungsentwurf vorbereiten',
        description: `Rechnungsentwurf (${draft.grossTotal} € brutto) prüfen und freigeben.`,
        category: 'Invoice',
        status: 'Open',
        priority: 'high',
        source: 'InvoiceDraftService',
        workflowId: `wf_inv_draft_${draftId}`,
        caseId: caseItem.id,
        referenceType: 'INVOICE_DRAFT',
        referenceId: draftId
      });
    }

    // Add timeline entry
    caseService.addTimelineEntry(caseItem.id, {
      type: 'status_change',
      title: 'Rechnungsentwurf erstellt',
      description: `Rechnungsentwurf (${draft.grossTotal} € brutto, Restbetrag ${draft.outstandingAmount} €) aus Einsatzabschluss generiert.`,
      category: 'Invoice',
      source: 'InvoiceDraftService',
      timestamp: nowIso,
      metadata: { draftId, grossTotal: draft.grossTotal, outstandingAmount: draft.outstandingAmount }
    });

    workflowEngine.emitEvent('INVOICE_DRAFT_CREATED', 'InvoiceDraftService', {
      caseId: caseItem.id,
      draftId: draft.id
    });

    return draft;
  }

  /**
   * Updates an existing invoice draft (e.g. items, discounts, address).
   */
  updateInvoiceDraft(
    caseId: string,
    draftId: string,
    updates: Partial<InvoiceDraft>,
    user: string = 'User'
  ): InvoiceDraft | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.invoiceDrafts) return null;

    const draft = caseItem.invoiceDrafts.find(d => d.id === draftId);
    if (!draft) return null;

    if (draft.status === 'pdf_created' || draft.status === 'paid' || draft.status === 'storno') {
      return draft; // Paid/created invoices cannot be altered
    }

    const nowIso = new Date().toISOString();
    const corrections: InvoiceDraftCorrection[] = [...(draft.corrections || [])];

    // Log corrections for top-level fields
    Object.keys(updates).forEach(key => {
      if (key !== 'corrections' && key !== 'updatedAt' && (draft as any)[key] !== (updates as any)[key]) {
        corrections.push({
          field: key,
          oldValue: (draft as any)[key],
          newValue: (updates as any)[key],
          timestamp: nowIso,
          user
        });
      }
    });

    const updatedItems = updates.items || draft.items;
    const discount = updates.discountValue !== undefined ? updates.discountValue : draft.discountValue;
    const surcharge = updates.surchargeValue !== undefined ? updates.surchargeValue : draft.surchargeValue;
    const vatRate = updates.vatRate !== undefined ? updates.vatRate : draft.vatRate;
    const depositPaid = updates.depositPaid !== undefined ? updates.depositPaid : draft.depositPaid;
    const otherPayments = updates.otherPayments !== undefined ? updates.otherPayments : draft.otherPayments;

    const totals = this.calculateInvoiceTotals(updatedItems, discount, surcharge, vatRate, depositPaid, otherPayments);

    const updatedDraft: InvoiceDraft = {
      ...draft,
      ...updates,
      items: updatedItems,
      ...totals,
      status: this.canTransitionInvoiceDraftStatus(draft.status, 'edited') ? 'edited' : draft.status,
      corrections,
      updatedAt: nowIso
    };

    caseService.updateInvoiceDraft(caseId, updatedDraft);

    workflowEngine.emitEvent('INVOICE_DRAFT_UPDATED', 'InvoiceDraftService', {
      caseId,
      draftId
    });

    return updatedDraft;
  }

  /**
   * Updates a single item within an invoice draft.
   */
  updateDraftItem(
    caseId: string,
    draftId: string,
    itemId: string,
    itemUpdates: Partial<InvoiceDraftItem>,
    user: string = 'User'
  ): InvoiceDraft | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.invoiceDrafts) return null;

    const draft = caseItem.invoiceDrafts.find(d => d.id === draftId);
    if (!draft) return null;

    const updatedItems = draft.items.map(item => {
      if (item.id === itemId) {
        const qty = itemUpdates.quantity !== undefined ? itemUpdates.quantity : item.quantity;
        const price = itemUpdates.unitPrice !== undefined ? itemUpdates.unitPrice : item.unitPrice;
        const total = Math.round(qty * price * 100) / 100;

        return {
          ...item,
          ...itemUpdates,
          quantity: qty,
          unitPrice: price,
          total
        };
      }
      return item;
    });

    return this.updateInvoiceDraft(caseId, draftId, { items: updatedItems }, user);
  }

  /**
   * Adds a new manual item to the draft.
   */
  addDraftItem(
    caseId: string,
    draftId: string,
    newItemData: Omit<InvoiceDraftItem, 'id'>,
    user: string = 'User'
  ): InvoiceDraft | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.invoiceDrafts) return null;

    const draft = caseItem.invoiceDrafts.find(d => d.id === draftId);
    if (!draft) return null;

    const newItem: InvoiceDraftItem = {
      ...newItemData,
      id: `item_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      total: Math.round((newItemData.quantity || 1) * (newItemData.unitPrice || 0) * 100) / 100,
      source: 'manual',
      selected: true,
      editable: true,
      billable: true,
      customerApproved: true
    };

    const updatedItems = [...draft.items, newItem];
    return this.updateInvoiceDraft(caseId, draftId, { items: updatedItems }, user);
  }

  /**
   * Removes an item from the draft.
   */
  removeDraftItem(
    caseId: string,
    draftId: string,
    itemId: string,
    user: string = 'User'
  ): InvoiceDraft | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.invoiceDrafts) return null;

    const draft = caseItem.invoiceDrafts.find(d => d.id === draftId);
    if (!draft) return null;

    const updatedItems = draft.items.filter(i => i.id !== itemId);
    return this.updateInvoiceDraft(caseId, draftId, { items: updatedItems }, user);
  }

  /**
   * Approves the invoice draft, preparing it for PDF generation.
   */
  approveInvoiceDraft(
    caseId: string,
    draftId: string,
    approvedBy: string = 'User'
  ): InvoiceDraft | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.invoiceDrafts) return null;

    const draft = caseItem.invoiceDrafts.find(d => d.id === draftId);
    if (!draft) return null;

    const customer = crmLookupService.findCustomerForCase(caseItem);
    const validation = this.validateInvoiceDraft(draft, caseItem, customer);

    if (!validation.valid) {
      draft.errorMessage = `Freigabe fehlgeschlagen: ${validation.errors.join(' ')}`;
      caseService.updateInvoiceDraft(caseId, draft);
      return draft;
    }

    const nowIso = new Date().toISOString();
    draft.status = 'approved';
    draft.approvedAt = nowIso;
    draft.approvedBy = approvedBy;
    draft.errorMessage = undefined;
    draft.updatedAt = nowIso;

    caseService.updateInvoiceDraft(caseId, draft);

    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Rechnungsentwurf freigegeben',
      description: `Rechnungsentwurf (${draft.grossTotal} €) wurde von ${approvedBy} zur Erstellung freigegeben.`,
      category: 'Invoice',
      source: 'InvoiceDraftService',
      timestamp: nowIso,
      metadata: { draftId, approvedBy }
    });

    workflowEngine.emitEvent('INVOICE_DRAFT_APPROVED', 'InvoiceDraftService', {
      caseId,
      draftId,
      approvedBy
    });

    return draft;
  }

  /**
   * Explicitly generates the invoice PDF, registers document, creates Invoice record,
   * creates Receivable, completes preparation task, and sets status to pdf_created.
   * Fully idempotent & lock-protected!
   */
  async generateInvoicePDFAndRegister(
    caseId: string,
    draftId: string,
    options?: { approvedBy?: string }
  ): Promise<{
    draft: InvoiceDraft;
    pdfResult: any;
    document: AppDocument;
    invoice: Invoice;
    receivable: Receivable;
  } | null> {
    if (pdfGenerationLocks.has(draftId)) {
      const caseItem = caseService.getCase(caseId);
      const existingDraft = caseItem?.invoiceDrafts?.find(d => d.id === draftId);
      if (existingDraft && existingDraft.documentId && existingDraft.invoiceId) {
        const doc = documentService.getDocument(existingDraft.documentId);
        const rec = caseService.getReceivables(caseId).find(r => r.invoiceDraftId === draftId);
        if (doc && rec) {
          return {
            draft: existingDraft,
            pdfResult: null,
            document: doc,
            invoice: {
              id: existingDraft.invoiceId,
              jobId: caseId,
              customerName: existingDraft.billingAddress.name || 'Kunde',
              netTotal: existingDraft.netTotal,
              vatRate: existingDraft.vatRate,
              total: existingDraft.grossTotal,
              status: 'sent',
              issuedAt: existingDraft.invoiceDate,
              paidAt: null,
              items: [],
              customer: {} as Customer
            },
            receivable: rec
          };
        }
      }
    }

    pdfGenerationLocks.add(draftId);

    try {
      const caseItem = caseService.getCase(caseId);
      if (!caseItem || !caseItem.invoiceDrafts) return null;

      let draft = caseItem.invoiceDrafts.find(d => d.id === draftId);
      if (!draft) return null;

      // Check if PDF was already generated
      if (draft.status === 'pdf_created' && draft.documentId && draft.invoiceId) {
        const doc = documentService.getDocument(draft.documentId);
        const rec = caseService.getReceivables(caseId).find(r => r.invoiceDraftId === draftId);
        if (doc && rec) {
          return {
            draft,
            pdfResult: null,
            document: doc,
            invoice: {
              id: draft.invoiceId,
              jobId: caseId,
              customerName: draft.billingAddress.name || 'Kunde',
              netTotal: draft.netTotal,
              vatRate: draft.vatRate,
              total: draft.grossTotal,
              status: 'sent',
              issuedAt: draft.invoiceDate,
              paidAt: null,
              items: [],
              customer: {} as Customer
            },
            receivable: rec
          };
        }
      }

      const customer = crmLookupService.findCustomerForCase(caseItem);

      // Validate draft
      const validation = this.validateInvoiceDraft(draft, caseItem, customer);
      if (!validation.valid) {
        draft.errorMessage = `PDF-Erstellung abgebrochen: ${validation.errors.join(' ')}`;
        caseService.updateInvoiceDraft(caseId, draft);
        return null;
      }

      // If draft is not approved yet, self-approve if user explicitly clicked PDF generation
      if (draft.status !== 'approved') {
        const approved = this.approveInvoiceDraft(caseId, draftId, options?.approvedBy || 'User');
        if (!approved || approved.status !== 'approved') {
          return null;
        }
        draft = approved;
      }

      // Generate invoice document number (RE-YYYY-XXX)
      const year = new Date().getFullYear();
      const existingInvoices = caseService.getReceivables(caseId);
      const invoiceSeq = existingInvoices.length + 1;
      const invoiceNumber = draft.invoiceNumber || `RE-${year}-${String(invoiceSeq).padStart(3, '0')}`;

      // Assemble customer with rechnungsadresse
      const pdfCustomer: Customer = customer
        ? {
            ...customer,
            zusatzoptionen: {
              ...(customer.zusatzoptionen || {}),
              adresseNr1: draft.billingAddress.name || customer.name,
              adresseNr2: draft.billingAddress.street || '',
              adresseNr3: `${draft.billingAddress.zip || ''} ${draft.billingAddress.city || ''}`.trim(),
              adresseNr4: draft.billingAddress.country || 'Österreich'
            }
          }
        : {
            id: `cust-${caseId}`,
            name: draft.billingAddress.name || 'Kunde',
            nameLower: (draft.billingAddress.name || 'kunde').toLowerCase(),
            createdAt: new Date().toISOString(),
            email: '',
            phone: '',
            avatarUrl: '',
            address: {
              street: draft.billingAddress.street || '',
              zip: draft.billingAddress.zip || '',
              city: draft.billingAddress.city || '',
              country: draft.billingAddress.country || 'Österreich'
            },
            zusatzoptionen: {
              adresseNr1: draft.billingAddress.name || 'Kunde',
              adresseNr2: draft.billingAddress.street || '',
              adresseNr3: `${draft.billingAddress.zip || ''} ${draft.billingAddress.city || ''}`.trim(),
              adresseNr4: draft.billingAddress.country || 'Österreich'
            }
          };

      // Map draft items to pdf format
      const pdfItems: any[] = draft.items
        .filter(i => i.selected && i.billable !== false)
        .map((i, idx) => ({
          id: i.id || `pdf_item_${idx + 1}`,
          description: i.description,
          count: String(i.quantity),
          unitPrice: i.unitPrice,
          total: i.total,
          category: i.category || 'Leistung'
        }));

      // Generate PDF using existing pdf-generator
      const pdfResult = await generateInvoicePDF(
        pdfCustomer,
        pdfItems,
        null, // default logo
        'save',
        invoiceNumber,
        0, // totalM3
        draft.serviceDate,
        draft.depositPaid,
        draft.outstandingAmount,
        undefined,
        draft.invoiceDate
      );

      const nowIso = new Date().toISOString();

      // Register Document in DocumentService
      const appDoc: AppDocument = {
        id: `doc_inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        customerId: pdfCustomer.id,
        customerName: pdfCustomer.name,
        type: 'Rechnung',
        docNumber: invoiceNumber,
        date: draft.invoiceDate,
        amount: draft.grossTotal,
        dataUrl: pdfResult.dataUrl || ''
      };
      documentService.registerDocument(appDoc);

      // Create Invoice record
      const invoiceRecord: Invoice = {
        id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        jobId: caseId,
        customerName: pdfCustomer.name,
        netTotal: draft.netTotal,
        vatRate: draft.vatRate,
        total: draft.grossTotal,
        status: draft.outstandingAmount <= 0 ? 'paid' : 'sent',
        issuedAt: draft.invoiceDate,
        paidAt: draft.outstandingAmount <= 0 ? nowIso : null,
        items: pdfItems,
        customer: pdfCustomer
      };

      // Create Receivable record (Offener Posten)
      const receivable: Receivable = {
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        caseId,
        customerId: pdfCustomer.id,
        invoiceId: invoiceRecord.id,
        invoiceDraftId: draft.id,
        invoiceNumber,
        invoiceDate: draft.invoiceDate,
        dueDate: draft.dueDate,
        originalAmount: draft.grossTotal,
        paidAmount: draft.depositPaid + draft.otherPayments,
        outstandingAmount: draft.outstandingAmount,
        status: draft.outstandingAmount <= 0 ? 'paid' : 'open',
        payments: draft.depositPaid > 0
          ? [
              {
                id: `pay_dep_${Date.now()}`,
                amount: draft.depositPaid,
                date: draft.createdAt,
                method: 'deposit',
                notes: 'Anzahlung aus Angebot'
              }
            ]
          : [],
        createdAt: nowIso,
        updatedAt: nowIso
      };

      caseService.addReceivable(caseId, receivable);

      // Update draft properties
      draft.status = 'pdf_created';
      draft.invoiceNumber = invoiceNumber;
      draft.documentId = appDoc.id;
      draft.invoiceId = invoiceRecord.id;
      draft.pdfCreatedAt = nowIso;
      draft.errorMessage = undefined;
      draft.updatedAt = nowIso;

      caseService.updateInvoiceDraft(caseId, draft);

      // Create Email Draft for Invoice Delivery
      emailDraftService.createDraftForCase(caseId, {
        purpose: 'invoice_delivery',
        sourceEventId: `wf_inv_send_${draft.id}`,
        originalSubject: caseItem.title ? `Anfrage ${caseItem.title}` : `Ihre Umzugsanfrage`,
        originalSenderEmail: pdfCustomer.email || customer?.email || '',
        originalSenderName: pdfCustomer.name || customer?.name || '',
        documentId: appDoc.id,
        fileName: `Rechnung-${invoiceNumber}-${pdfCustomer.name || 'Kunde'}.pdf`,
        docNumber: invoiceNumber,
        invoiceDraftId: draft.id,
        invoiceId: invoiceRecord.id,
        receivableId: receivable.id,
        grossTotal: draft.grossTotal,
        outstandingAmount: draft.outstandingAmount,
        dueDate: draft.dueDate,
        createdBy: 'rule'
      });

      // Complete invoice preparation task and create invoice send task
      caseItem.tasks.forEach(t => {
        if (t.title.includes('Rechnungsentwurf vorbereiten') && t.status !== 'Completed') {
          t.status = 'Completed';
          t.completedAt = nowIso;
        }
      });

      if (!caseItem.tasks.some(t => t.title.includes('Rechnung versenden') && t.status !== 'Completed')) {
        caseService.addTask(caseId, {
          title: 'Rechnung versenden',
          description: `Rechnung ${invoiceNumber} erzeugt. An Kundschaft versenden.`,
          category: 'Invoice',
          priority: 'high',
          status: 'Open',
          source: 'InvoiceDraftService',
          workflowId: `wf_inv_send_${draft.id}`,
          caseId,
          referenceType: 'INVOICE_SEND',
          referenceId: draft.id
        });
      }

      if (!caseItem.tasks.some(t => t.title.includes('Zahlung überwachen') && t.status !== 'Completed')) {
        caseService.addTask(caseId, {
          title: 'Zahlung überwachen',
          description: `Offener Restbetrag: ${draft.outstandingAmount} €. Fällig am ${draft.dueDate}.`,
          category: 'Invoice',
          priority: 'medium',
          status: 'Waiting',
          source: 'InvoiceDraftService',
          workflowId: `wf_pay_mon_${draft.id}`,
          caseId,
          referenceType: 'PAYMENT_MONITORING',
          referenceId: receivable.id
        });
      }

      // Timeline entry
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        title: 'Rechnungs-PDF erzeugt & gebucht',
        description: `Rechnung ${invoiceNumber} (${draft.grossTotal} € brutto, offener Restbetrag ${draft.outstandingAmount} €) wurde registriert und als offener Posten gespeichert.`,
        category: 'Invoice',
        source: 'InvoiceDraftService',
        timestamp: nowIso,
        metadata: { invoiceNumber, grossTotal: draft.grossTotal, documentId: appDoc.id, receivableId: receivable.id }
      });

      workflowEngine.emitEvent('INVOICE_PDF_CREATED', 'InvoiceDraftService', {
        caseId,
        draftId: draft.id,
        invoiceNumber,
        documentId: appDoc.id
      });

      workflowEngine.emitEvent('INVOICE_CREATED', 'InvoiceDraftService', {
        caseId,
        invoiceId: invoiceRecord.id,
        invoiceNumber,
        amount: draft.grossTotal
      });

      workflowEngine.emitEvent('RECEIVABLE_CREATED', 'InvoiceDraftService', {
        caseId,
        receivableId: receivable.id,
        invoiceNumber,
        outstandingAmount: draft.outstandingAmount
      });

      return {
        draft,
        pdfResult,
        document: appDoc,
        invoice: invoiceRecord,
        receivable
      };
    } finally {
      pdfGenerationLocks.delete(draftId);
    }
  }

  /**
   * Rejects an invoice draft.
   */
  rejectInvoiceDraft(
    caseId: string,
    draftId: string,
    reason?: string
  ): InvoiceDraft | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.invoiceDrafts) return null;

    const draft = caseItem.invoiceDrafts.find(d => d.id === draftId);
    if (!draft) return null;

    const nowIso = new Date().toISOString();
    draft.status = 'rejected';
    draft.notes = reason ? `Abgelehnt: ${reason}` : draft.notes;
    draft.updatedAt = nowIso;

    caseService.updateInvoiceDraft(caseId, draft);

    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Rechnungsentwurf abgelehnt',
      description: `Rechnungsentwurf wurde abgelehnt: ${reason || 'Kein Grund angegeben.'}`,
      category: 'Invoice',
      source: 'InvoiceDraftService',
      timestamp: nowIso,
      metadata: { draftId, reason }
    });

    workflowEngine.emitEvent('INVOICE_DRAFT_REJECTED', 'InvoiceDraftService', {
      caseId,
      draftId,
      reason
    });

    return draft;
  }
}

export const invoiceDraftService = new InvoiceDraftService();
