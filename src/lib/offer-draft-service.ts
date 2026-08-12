import { caseService, type Case } from './case-service';
import { crmLookupService } from './crm-lookup-service';
import { workflowEngine } from './workflow-engine';
import { buildCalculationCostItems, calculateOfferTotals } from './offer-calculation';
import { evaluateOfferReadiness } from './offer-readiness';
import { validateOfferDraft, canTransitionOfferDraftStatus } from './offer-draft-validator';
import { generateOfferPDF, generateOrientierungsangebotPDF } from './pdf-generator';
import type { Customer, OfferDraft, OfferDraftCorrection, OfferDraftItem, OfferDraftStatus } from './types';
import { documentService } from './document-service';
import { emailDraftService } from './email-draft-service';

// In-memory locks to prevent concurrent duplicate PDF generations
const pdfGenerationLocks = new Set<string>();

export class OfferDraftService {
  /**
   * Creates an initial OfferDraft from Case data and CRM customer data if ready.
   * Idempotent: returns existing draft if one is already active.
   */
  createOfferDraftForCase(
    caseId: string,
    options?: {
      sourceEventId?: string;
      offerType?: 'orientation' | 'binding';
      customParams?: any;
    }
  ): OfferDraft | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    // Idempotency: Return active draft if one already exists
    if (caseItem.offerDrafts && caseItem.offerDrafts.length > 0) {
      const activeDraft = caseItem.offerDrafts.find(d => d.status !== 'rejected' && d.status !== 'sent');
      if (activeDraft) {
        return activeDraft;
      }
    }

    // Lookup customer or construct fallback
    const customer = crmLookupService.findCustomerForCase(caseItem);

    const readiness = evaluateOfferReadiness(caseItem, customer);
    if (!readiness.readyForOrientationOffer && !readiness.readyForBindingOffer) {
      return null; // Not ready for an offer yet
    }

    const offerType = options?.offerType || (readiness.readyForBindingOffer ? 'binding' : 'orientation');

    const draftFields = caseItem.customerDraft?.fields;

    // Assemble mock customer if needed for cost calculation
    const effectiveCustomer: Customer = customer || {
      id: caseItem.customerId || `cust-${caseItem.id}`,
      name: draftFields?.name?.value || 'Unbekannter Kunde',
      email: draftFields?.email?.value || '',
      phone: draftFields?.phone?.value || '',
      address: { street: '', zip: '', city: '', country: 'Österreich' },
      nameLower: 'unbekannter kunde',
      createdAt: new Date().toISOString(),
      avatarUrl: '',
      abholadresse: {
        strasse: draftFields?.pickupAddress?.street?.value || draftFields?.pickupAddress?.raw?.value || ''
      },
      zieladresse: {
        strasse: draftFields?.destinationAddress?.street?.value || draftFields?.destinationAddress?.raw?.value || ''
      },
      umzugsdetails: {
        gewuenschterUmzugstermin: draftFields?.moveDate?.value || '',
        umzugsgroesse: draftFields?.apartmentSize?.value || ''
      }
    };

    const { items: rawCostItems, totalM3 } = buildCalculationCostItems(effectiveCustomer, options?.customParams);

    const draftItems: OfferDraftItem[] = rawCostItems.map((item: any, idx) => ({
      id: item.id || `item-${idx + 1}`,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'Psch',
      unitPrice: item.unitPrice,
      total: item.total,
      category: 'Zusatzleistung',
      source: 'Calculation',
      editable: true,
      selected: item.selected ?? true,
      confidence: 'high'
    }));

    const now = new Date().toISOString();
    const draftId = `offer-draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const draftWithoutTotals: OfferDraft = {
      id: draftId,
      caseId: caseItem.id,
      customerId: effectiveCustomer.id,
      sourceEventId: options?.sourceEventId,
      status: 'draft',
      offerType,
      currency: 'EUR',
      items: draftItems,
      subtotalNet: 0,
      discountType: 'percent',
      discountValue: 0,
      surchargeType: 'fixed',
      surchargeValue: 0,
      netTotal: 0,
      vatRate: 20, // 20% Standard MwSt in Ö/DE
      vatAmount: 0,
      grossTotal: 0,
      depositPercent: offerType === 'binding' ? 30 : 0,
      depositAmount: 0,
      remainingAmount: 0,
      totalM3,
      pickupAddress: {
        street: effectiveCustomer.abholadresse?.strasse || effectiveCustomer.address?.street
      },
      destinationAddress: {
        street: effectiveCustomer.zieladresse?.strasse
      },
      moveDate: effectiveCustomer.umzugsdetails?.gewuenschterUmzugstermin,
      notes: effectiveCustomer.anmerkungen || '',
      paymentTerms: '14 Tage ohne Abzug',
      validityDays: 14,
      createdAt: now,
      updatedAt: now,
      corrections: []
    };

    const finalDraft = calculateOfferTotals(draftWithoutTotals);

    // Add draft to case
    caseService.addOfferDraft(caseItem.id, finalDraft);

    // Add Task to case
    caseService.addTask(caseItem.id, {
      caseId: caseItem.id,
      title: offerType === 'binding' ? 'Verbindliches Angebot prüfen & erzeugen' : 'Orientierungsangebot prüfen & erzeugen',
      description: `Angebotsentwurf #${finalDraft.id.slice(-6)} liegt vor. Bitte prüfen und bei Bedarf anpassen.`,
      category: 'Offer',
      priority: 'high',
      status: 'Open',
      source: 'AI Analysis',
      workflowId: options?.sourceEventId || `wf-${Date.now()}`,
      referenceType: 'OFFER_DRAFT',
      referenceId: finalDraft.id
    });

    return finalDraft;
  }

  /**
   * Updates an existing offer draft with manual user adjustments or corrections.
   */
  updateOfferDraft(
    caseId: string,
    draftId: string,
    updates: Partial<OfferDraft>,
    userName: string = 'Aktueller Benutzer'
  ): { success: boolean; draft?: OfferDraft; error?: string } {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.offerDrafts) {
      return { success: false, error: 'Vorgang oder Entwurf nicht gefunden.' };
    }

    const existingDraft = caseItem.offerDrafts.find(d => d.id === draftId);
    if (!existingDraft) {
      return { success: false, error: 'Angebotsentwurf nicht gefunden.' };
    }

    // Check if transition to edited or new status is allowed
    const targetStatus: OfferDraftStatus = updates.status || (existingDraft.status === 'draft' ? 'edited' : existingDraft.status);
    if (!canTransitionOfferDraftStatus(existingDraft.status, targetStatus)) {
      return { success: false, error: `Ungültiger Statusübergang von ${existingDraft.status} zu ${targetStatus}` };
    }

    const now = new Date().toISOString();
    const corrections: OfferDraftCorrection[] = [...existingDraft.corrections];

    // Log explicit field corrections
    Object.keys(updates).forEach(key => {
      if (key !== 'corrections' && key !== 'updatedAt' && key !== 'id' && key !== 'caseId') {
        const prevVal = (existingDraft as any)[key];
        const newVal = (updates as any)[key];
        if (JSON.stringify(prevVal) !== JSON.stringify(newVal)) {
          corrections.push({
            field: key,
            previousValue: prevVal,
            newValue: newVal,
            timestamp: now,
            user: userName
          });
        }
      }
    });

    const mergedDraftWithoutTotals: OfferDraft = {
      ...existingDraft,
      ...updates,
      status: targetStatus,
      updatedAt: now,
      corrections
    };

    // Recalculate totals if items or discounts modified
    const recalculatedDraft = calculateOfferTotals(mergedDraftWithoutTotals);

    const updateSuccess = caseService.updateOfferDraft(caseId, recalculatedDraft);
    if (!updateSuccess) {
      return { success: false, error: 'Fehler beim Speichern des Entwurfs.' };
    }

    return { success: true, draft: recalculatedDraft };
  }

  /**
   * Approves an offer draft.
   */
  approveOfferDraft(caseId: string, draftId: string, userName: string = 'Aktueller Benutzer'): { success: boolean; draft?: OfferDraft; error?: string } {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.offerDrafts) {
      return { success: false, error: 'Vorgang nicht gefunden.' };
    }

    const draft = caseItem.offerDrafts.find(d => d.id === draftId);
    if (!draft) {
      return { success: false, error: 'Angebotsentwurf nicht gefunden.' };
    }

    // Validate draft integrity before approval
    const validation = validateOfferDraft(draft);
    if (!validation.valid) {
      return { success: false, error: `Validierung fehlgeschlagen: ${validation.errors.join('; ')}` };
    }

    return this.updateOfferDraft(caseId, draftId, {
      status: 'approved',
      approvedAt: new Date().toISOString()
    }, userName);
  }

  /**
   * Generates a PDF for the offer draft idempotently.
   * Creates PDF document, attaches document ID to draft, updates case status, and completes task.
   */
  async generateOfferPDFForDraft(caseId: string, draftId: string): Promise<{ success: boolean; draft?: OfferDraft; documentId?: string; error?: string }> {
    if (pdfGenerationLocks.has(draftId)) {
      return { success: false, error: 'PDF-Generierung für diesen Entwurf läuft bereits.' };
    }

    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.offerDrafts) {
      return { success: false, error: 'Vorgang nicht gefunden.' };
    }

    const draft = caseItem.offerDrafts.find(d => d.id === draftId);
    if (!draft) {
      return { success: false, error: 'Angebotsentwurf nicht gefunden.' };
    }

    // If PDF already created idempotently, return existing document
    if (draft.status === 'pdf_created' && draft.documentId) {
      return { success: true, draft, documentId: draft.documentId };
    }

    if (draft.status !== 'approved' && draft.status !== 'edited' && draft.status !== 'draft') {
      return { success: false, error: `Kann kein PDF im Status "${draft.status}" generieren.` };
    }

    // Validate draft
    const validation = validateOfferDraft(draft);
    if (!validation.valid) {
      return { success: false, error: `Validierungsfehler: ${validation.errors.join('; ')}` };
    }

    pdfGenerationLocks.add(draftId);

    try {
      const freshCase = caseService.getCase(caseId)!;
      const freshDraft = freshCase.offerDrafts!.find(d => d.id === draftId)!;

      // Assign document number if not set
      const prefix = freshDraft.offerType === 'binding' ? 'AG' : 'OA';
      const docNumber = freshDraft.documentNumber || `${prefix}-${Date.now().toString().slice(-6)}`;

      const draftFields = freshCase.customerDraft?.fields;

      const customer = crmLookupService.findCustomerForCase(freshCase) || {
        id: freshDraft.customerId || `cust-${freshCase.id}`,
        name: draftFields?.name?.value || 'Kunde',
        email: draftFields?.email?.value || '',
        phone: draftFields?.phone?.value || '',
        address: { street: freshDraft.pickupAddress?.street || '', zip: '', city: '', country: 'Österreich' },
        nameLower: 'kunde',
        createdAt: new Date().toISOString(),
        avatarUrl: '',
        abholadresse: { strasse: freshDraft.pickupAddress?.street },
        zieladresse: { strasse: freshDraft.destinationAddress?.street },
        umzugsdetails: { gewuenschterUmzugstermin: freshDraft.moveDate }
      };

      const selectedItems = freshDraft.items.filter(i => i.selected !== false).map(i => ({
        id: i.id,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total
      }));

      // Call PDF generator
      let pdfResult;
      if (freshDraft.offerType === 'orientation') {
        pdfResult = await generateOrientierungsangebotPDF(
          customer,
          selectedItems,
          null,
          'save',
          docNumber,
          freshDraft.totalM3 || 12.5
        );
      } else {
        pdfResult = await generateOfferPDF(
          customer,
          selectedItems,
          null,
          'save',
          freshDraft.paymentTerms || '14 Tage ohne Abzug',
          docNumber,
          freshDraft.totalM3 || 12.5,
          freshDraft.moveDate,
          freshDraft.depositAmount || 0,
          freshDraft.remainingAmount || freshDraft.grossTotal
        );
      }

      const documentId = `doc-${docNumber}`;
      const now = new Date().toISOString();

      // Register document in central Document Service
      documentService.registerDocument({
        id: documentId,
        customerId: customer.id,
        customerName: customer.name,
        type: 'Orientierungsangebot',
        docNumber,
        date: now.slice(0, 10),
        amount: freshDraft.grossTotal,
        dataUrl: pdfResult?.dataUrl
      });

      // Update draft state
      const pdfCreatedDraft: OfferDraft = {
        ...freshDraft,
        status: 'pdf_created',
        documentNumber: docNumber,
        documentId,
        pdfDataUrl: pdfResult?.dataUrl || undefined,
        pdfCreatedAt: now,
        updatedAt: now
      };

      caseService.updateOfferDraft(caseId, pdfCreatedDraft);

      // Create email response draft for offer delivery
      emailDraftService.createDraftForCase(caseId, {
        purpose: 'offer_delivery',
        offerDraftId: draftId,
        documentId,
        fileName: `${freshDraft.offerType === 'orientation' ? 'Orientierungsangebot' : 'Angebot'}_${docNumber}.pdf`,
        offerType: freshDraft.offerType,
        docNumber,
        originalSenderEmail: customer.email,
        originalSenderName: customer.name,
        forceNew: true
      });

      // Emit single OFFER_CREATED event to workflow engine
      workflowEngine.emitEvent('OFFER_CREATED', 'AI Analysis', {
        caseId,
        draftId,
        documentId,
        docNumber,
        offerType: freshDraft.offerType,
        grossTotal: freshDraft.grossTotal
      }, 'high');

      // Update associated task to completed
      const offerTask = freshCase.tasks.find(
        t => t.referenceType === 'OFFER_DRAFT' && t.referenceId === draftId && t.status !== 'Completed'
      );
      if (offerTask) {
        caseService.updateTask(caseId, offerTask.id, { status: 'Completed', completedAt: now });
      }

      // Update case status
      caseService.updateCase(caseId, { status: 'Offer Created' });

      // Add timeline entry
      caseService.addTimelineEntry(caseId, {
        timestamp: now,
        type: 'OFFER_PDF_CREATED',
        category: 'Document',
        source: 'User Action',
        title: 'Angebots-PDF erstellt',
        description: `${freshDraft.offerType === 'binding' ? 'Verbindliches Angebot' : 'Orientierungsangebot'} ${docNumber} erzeugt (${freshDraft.grossTotal.toFixed(2)} € brutto).`,
        user: 'Aktueller Benutzer'
      });

      return { success: true, draft: pdfCreatedDraft, documentId };
    } catch (err: any) {
      console.error('Error generating offer PDF:', err);
      return { success: false, error: err?.message || 'Fehler beim Erzeugen des PDFs.' };
    } finally {
      pdfGenerationLocks.delete(draftId);
    }
  }

  /**
   * Rejects an offer draft.
   */
  rejectOfferDraft(caseId: string, draftId: string, reason?: string): { success: boolean; error?: string } {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.offerDrafts) {
      return { success: false, error: 'Vorgang nicht gefunden.' };
    }

    const draft = caseItem.offerDrafts.find(d => d.id === draftId);
    if (!draft) {
      return { success: false, error: 'Angebotsentwurf nicht gefunden.' };
    }

    const updateRes = this.updateOfferDraft(caseId, draftId, { status: 'rejected' });
    if (updateRes.success) {
      // Cancel pending tasks
      const pendingTask = caseItem.tasks.find(t => t.referenceType === 'OFFER_DRAFT' && t.referenceId === draftId && t.status !== 'Completed');
      if (pendingTask) {
        caseService.updateTask(caseId, pendingTask.id, { status: 'Cancelled' });
      }

      caseService.addTimelineEntry(caseId, {
        timestamp: new Date().toISOString(),
        type: 'OFFER_DRAFT_REJECTED',
        category: 'Offer',
        source: 'User Action',
        title: 'Angebotsentwurf verworfen',
        description: reason || 'Der Angebotsentwurf wurde vom Benutzer abgelehnt.',
        user: 'Aktueller Benutzer'
      });
    }

    return updateRes;
  }
}

export const offerDraftService = new OfferDraftService();
