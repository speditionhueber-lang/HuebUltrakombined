import { caseService, Case } from './case-service';
import { workflowEngine } from './workflow-engine';
import { learningService } from './learning-service';
import { documentService } from './document-service';
import { crmLookupService } from './crm-lookup-service';
import { emailDraftService } from './email-draft-service';
import {
  OperationPreparationReview,
  OperationPreparationData,
  OperationChecklistItem,
  OperationMaterialRequirement,
  OperationDocumentRequirement,
  OperationPreparationWarning,
  OperationPreparationReadiness,
  OperationPreparationStatus,
  CaseReminder,
  OperationAddressSnapshot,
  OperationStopSnapshot
} from './types';

export class OperationPreparationService {
  private runtimeLocks = new Set<string>();

  /**
   * Calculates a date string (YYYY-MM-DD) offset by daysBefore from jobDateStr.
   */
  calculateOffsetDate(jobDateStr: string, daysBefore: number): string {
    const date = new Date(`${jobDateStr}T12:00:00Z`);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    date.setUTCDate(date.getUTCDate() - daysBefore);
    return date.toISOString().split('T')[0];
  }

  /**
   * Formats ISO date string in Europe/Vienna time context.
   */
  formatIsoVienna(dateStr: string, timeStr: string = '09:00'): string {
    const validTime = timeStr && timeStr.length === 5 ? timeStr : '09:00';
    return `${dateStr}T${validTime}:00+02:00`;
  }

  /**
   * Pure function to evaluate readiness and warnings of an operation preparation review.
   */
  evaluateOperationPreparationReadiness(
    review: Partial<OperationPreparationReview>,
    caseItem?: Case
  ): { readiness: OperationPreparationReadiness; warnings: OperationPreparationWarning[] } {
    const warnings: OperationPreparationWarning[] = (review.warnings || []).filter(
      w => w.code !== 'MISSING_CUSTOMER_CONTACT' &&
           w.code !== 'MISSING_VEHICLE' &&
           w.code !== 'MISSING_CREW' &&
           w.code !== 'MISSING_ROUTE' &&
           w.code !== 'MISSING_MATERIALS' &&
           w.code !== 'MISSING_DOCUMENTS' &&
           w.code !== 'UNRESOLVED_RISKS'
    );
    const opData = review.operationData;
    const checklist = review.checklist || [];

    if (!opData) {
      return { readiness: 'blocked', warnings };
    }

    // 1. Missing customer contact
    if (!opData.customerName || (!opData.customerPhone && !opData.customerEmail)) {
      if (!warnings.some(w => w.code === 'MISSING_CUSTOMER_CONTACT')) {
        warnings.push({
          id: 'w_cust_contact',
          code: 'MISSING_CUSTOMER_CONTACT',
          message: 'Kundenkontaktdaten (Telefon oder E-Mail) fehlen',
          severity: 'high'
        });
      }
      return { readiness: 'missing_customer_contact', warnings };
    }

    // 2. Missing vehicle
    if (!opData.vehicleId) {
      if (!warnings.some(w => w.code === 'MISSING_VEHICLE')) {
        warnings.push({
          id: 'w_vehicle',
          code: 'MISSING_VEHICLE',
          message: 'Kein Fahrzeug für den Einsatz zugewiesen',
          severity: 'high'
        });
      }
      return { readiness: 'missing_vehicle', warnings };
    }

    // 3. Missing crew
    if (!opData.employeeIds || opData.employeeIds.length === 0) {
      if (!warnings.some(w => w.code === 'MISSING_CREW')) {
        warnings.push({
          id: 'w_crew',
          code: 'MISSING_CREW',
          message: 'Keine Mitarbeiter für den Einsatz zugewiesen',
          severity: 'high'
        });
      }
      return { readiness: 'missing_crew', warnings };
    }

    // 4. Missing route or addresses
    if (!opData.pickupAddress?.street || !opData.destinationAddress?.street) {
      if (!warnings.some(w => w.code === 'MISSING_ROUTE')) {
        warnings.push({
          id: 'w_route',
          code: 'MISSING_ROUTE',
          message: 'Unvollständige Adressangaben für Start- oder Zielort',
          severity: 'high'
        });
      }
      return { readiness: 'missing_route', warnings };
    }

    // 5. Conflicting information
    if (warnings.some(w => w.code === 'CONFLICTING_DATA' || w.code === 'CONFLICTING_INFORMATION')) {
      return { readiness: 'conflicting_information', warnings };
    }

    // 6. Missing materials
    const missingMaterials = opData.requiredMaterials?.filter(m => m.status === 'missing');
    if (missingMaterials && missingMaterials.length > 0) {
      if (!warnings.some(w => w.code === 'MISSING_MATERIALS')) {
        warnings.push({
          id: 'w_mat',
          code: 'MISSING_MATERIALS',
          message: `Fehlende Materialien: ${missingMaterials.map(m => m.name).join(', ')}`,
          severity: 'medium'
        });
      }
      return { readiness: 'missing_materials', warnings };
    }

    // 7. Missing required documents
    const missingDocs = opData.requiredDocuments?.filter(d => d.required && !d.available);
    if (missingDocs && missingDocs.length > 0) {
      if (!warnings.some(w => w.code === 'MISSING_DOCUMENTS')) {
        warnings.push({
          id: 'w_doc',
          code: 'MISSING_DOCUMENTS',
          message: `Fehlende erforderliche Dokumente: ${missingDocs.map(d => d.title).join(', ')}`,
          severity: 'medium'
        });
      }
      return { readiness: 'missing_documents', warnings };
    }

    // 8. Unresolved risks
    if (caseItem && caseItem.tourPlanningReviews) {
      const activeTour = caseItem.tourPlanningReviews.find(r => r.status === 'confirmed' || r.id === review.tourPlanningReviewId);
      if (activeTour && activeTour.risks?.some(r => !r.acknowledged)) {
        if (!warnings.some(w => w.code === 'UNRESOLVED_RISKS')) {
          warnings.push({
            id: 'w_risk',
            code: 'UNRESOLVED_RISKS',
            message: 'Es gibt unbestätigte Risiken in der Tourenplanung',
            severity: 'high'
          });
        }
        return { readiness: 'unresolved_risks', warnings };
      }
    }

    // 9. Required checklist items not completed
    const incompleteRequiredChecklist = checklist.filter(c => c.required && !c.completed);
    if (incompleteRequiredChecklist.length > 0) {
      return { readiness: 'blocked', warnings };
    }

    return { readiness: 'ready', warnings };
  }

  /**
   * Creates an Operation Preparation Review for a given case based on confirmed predecessor data.
   */
  createOperationPreparationReview(caseId: string, tourPlanningReviewId?: string): OperationPreparationReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    if (!caseItem.operationPreparationReviews) {
      caseItem.operationPreparationReviews = [];
    }
    if (!caseItem.reminders) {
      caseItem.reminders = [];
    }

    // Idempotency check: if review for this tourPlanningReviewId already exists, return it
    if (tourPlanningReviewId) {
      const existing = caseItem.operationPreparationReviews.find(r => r.tourPlanningReviewId === tourPlanningReviewId);
      if (existing) return existing;
    } else if (caseItem.operationPreparationReviews.length > 0) {
      // If no tour review specified, return the latest existing review if any
      const active = caseItem.operationPreparationReviews.find(r => r.status === 'pending' || r.status === 'confirmed');
      if (active) return active;
    }

    // Load predecessor reviews
    const tourReview = tourPlanningReviewId
      ? caseItem.tourPlanningReviews?.find(r => r.id === tourPlanningReviewId)
      : caseItem.tourPlanningReviews?.find(r => r.status === 'confirmed') || caseItem.tourPlanningReviews?.[caseItem.tourPlanningReviews.length - 1];

    const calendarReview = caseItem.calendarPlanningReviews?.find(r => r.status === 'scheduled' || r.status === 'confirmed') || caseItem.calendarPlanningReviews?.[caseItem.calendarPlanningReviews.length - 1];
    const dispatchReview = caseItem.dispatchReviews?.find(r => r.status === 'confirmed') || caseItem.dispatchReviews?.[caseItem.dispatchReviews.length - 1];
    const planningReview = caseItem.planningReviews?.find(r => r.status === 'confirmed') || caseItem.planningReviews?.[caseItem.planningReviews.length - 1];
    const offerDraft = caseItem.offerDrafts?.find(o => o.status === 'accepted' || o.status === 'sent' || o.status === 'approved') || caseItem.offerDrafts?.[caseItem.offerDrafts.length - 1];

    const customer = crmLookupService.findCustomerForCase(caseItem);

    // Assembly of date/time fields
    const jobDate = calendarReview?.proposedSchedule.date || new Date().toISOString().split('T')[0];
    const preparationTime = calendarReview?.proposedSchedule.preparationStartTime || '07:30';
    const jobStartTime = calendarReview?.proposedSchedule.jobStartTime || '08:00';
    const estimatedEndTime = calendarReview?.proposedSchedule.estimatedEndTime || '17:00';

    const dispAny = dispatchReview as any;
    const vehicleId = dispAny?.selectedVehicleId || calendarReview?.selectedVehicleId || tourReview?.vehicleId || 'v-3_5t';
    const employeeIds = (dispAny?.selectedEmployeeIds && dispAny.selectedEmployeeIds.length > 0)
      ? dispAny.selectedEmployeeIds
      : (calendarReview?.selectedEmployeeIds && calendarReview.selectedEmployeeIds.length > 0)
      ? calendarReview.selectedEmployeeIds
      : ['emp-driver-1', 'emp-worker-1'];

    const custAny = customer as any;
    const customerName = customer?.name || custAny?.companyName || caseItem.customerDraft?.fields?.name?.value || 'Unbekannter Kunde';
    const customerPhone = customer?.phone || custAny?.mobile || caseItem.customerDraft?.fields?.phone?.value || '';
    const customerEmail = customer?.email || caseItem.customerDraft?.fields?.email?.value || '';

    // Assembly of addresses
    const pickupStop = tourReview?.route.stops?.find(s => s.type === 'pickup');
    const destinationStop = tourReview?.route.stops?.find(s => s.type === 'destination');

    const pickupAddress: OperationAddressSnapshot = pickupStop
      ? {
          street: pickupStop.address.street,
          zip: pickupStop.address.zip,
          city: pickupStop.address.city,
          floor: pickupStop.address.floor,
          elevator: pickupStop.address.elevator
        }
      : {
          street: caseItem.customerDraft?.fields?.pickupAddress?.street?.value || customer?.address?.street || '',
          zip: caseItem.customerDraft?.fields?.pickupAddress?.zip?.value || customer?.address?.zip || '',
          city: caseItem.customerDraft?.fields?.pickupAddress?.city?.value || customer?.address?.city || ''
        };

    const destinationAddress: OperationAddressSnapshot = destinationStop
      ? {
          street: destinationStop.address.street,
          zip: destinationStop.address.zip,
          city: destinationStop.address.city,
          floor: destinationStop.address.floor,
          elevator: destinationStop.address.elevator
        }
      : {
          street: caseItem.customerDraft?.fields?.destinationAddress?.street?.value || '',
          zip: caseItem.customerDraft?.fields?.destinationAddress?.zip?.value || '',
          city: caseItem.customerDraft?.fields?.destinationAddress?.city?.value || ''
        };

    const intermediateStops: OperationStopSnapshot[] = (tourReview?.route.stops?.filter(s => s.type === 'intermediate') || []).map((stop, idx) => ({
      id: stop.id || `stop_${idx}`,
      type: 'intermediate',
      order: idx + 1,
      label: stop.label || `Zwischenstopp ${idx + 1}`,
      address: { street: stop.address.street, zip: stop.address.zip, city: stop.address.city },
      estimatedServiceMinutes: stop.estimatedServiceMinutes || 30
    }));

    const services = offerDraft?.items?.map(i => i.description) || (planningReview?.planningData?.assemblyService ? ['Möbelmontage'] : []) || ['Umzugsservice', 'Transport'];

    const requiredMaterials: OperationMaterialRequirement[] = [
      {
        id: 'mat_boxes',
        name: 'Umzugskartons Standard',
        category: 'Verpackung',
        quantityNeeded: 30,
        unit: 'Stück',
        status: 'needed',
        source: 'offer'
      },
      {
        id: 'mat_blankets',
        name: 'Möbeldecken & Schutzfolie',
        category: 'Schutz',
        quantityNeeded: 1,
        unit: 'Set',
        status: 'confirmed_available',
        source: 'planning'
      },
      {
        id: 'mat_straps',
        name: 'Tragegurte & Möbelroller',
        category: 'Ausrüstung',
        quantityNeeded: 1,
        unit: 'Set',
        status: 'confirmed_available',
        source: 'planning'
      }
    ];

    if (services.some(s => s.toLowerCase().includes('montage') || s.toLowerCase().includes('demontage'))) {
      requiredMaterials.push({
        id: 'mat_tools',
        name: 'Werkzeugkoffer & Akkubohrer',
        category: 'Werkzeug',
        quantityNeeded: 1,
        unit: 'Set',
        status: 'needed',
        source: 'offer'
      });
    }

    const allDocs = documentService.getAllDocuments();
    const offerDoc = allDocs.find((d: any) => d.caseId === caseId && d.type === 'Orientierungsangebot');

    const requiredDocuments: OperationDocumentRequirement[] = [
      {
        id: 'doc_offer',
        title: 'Bestätigtes Angebot PDF',
        type: 'offer',
        required: true,
        available: !!offerDoc || offerDraft?.status === 'accepted' || offerDraft?.status === 'approved' || offerDraft?.status === 'sent' || !caseItem.offerDrafts || caseItem.offerDrafts.length === 0,
        documentId: offerDoc?.id,
        source: 'document_service'
      },
      {
        id: 'doc_work_order',
        title: 'Arbeitsauftrag / Lieferschein',
        type: 'delivery_note',
        required: true,
        available: true,
        source: 'case'
      },
      {
        id: 'doc_contact',
        title: 'Kundenkontaktdatenblatt',
        type: 'customer_contact',
        required: true,
        available: !!(customerPhone || customerEmail),
        source: 'case'
      }
    ];

    const warnings: OperationPreparationWarning[] = [];

    // Conflicting information check
    const originCalendarReview = caseItem.calendarPlanningReviews?.find(r => r.id === tourReview?.calendarPlanningReviewId);
    if (originCalendarReview && calendarReview && originCalendarReview.proposedSchedule.date !== calendarReview.proposedSchedule.date) {
      warnings.push({
        id: 'w_conflict_date',
        code: 'CONFLICTING_DATA',
        message: 'Datum im Kalender weicht vom Tourenplan ab',
        severity: 'high'
      });
    }

    const reviewId = `op_prep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const operationData: OperationPreparationData = {
      jobDate,
      preparationTime,
      jobStartTime,
      estimatedEndTime,
      vehicleId,
      employeeIds,
      customerId: customer?.id || caseItem.customerId || '',
      customerName,
      customerPhone,
      customerEmail,
      pickupAddress,
      destinationAddress,
      intermediateStops,
      totalDistanceKm: tourReview?.route.totalDistanceKm || 50,
      estimatedDrivingMinutes: tourReview?.route.totalDrivingMinutes || 60,
      estimatedWorkingMinutes: calendarReview?.proposedSchedule.estimatedDurationMinutes || 480,
      bufferMinutes: tourReview?.route.bufferMinutes || 60,
      services,
      requiredMaterials,
      requiredDocuments,
      specialInstructions: planningReview?.planningData?.specialNotes ? [planningReview.planningData.specialNotes] : [],
      notes: tourReview?.route.depotStart?.notes
    };

    const checklist: OperationChecklistItem[] = [
      { id: 'chk_1', category: 'customer', label: 'Kunde verknüpft', required: true, completed: !!(customer?.id || caseItem.customerId), source: 'case' },
      { id: 'chk_2', category: 'customer', label: 'Telefonnummer vorhanden', required: true, completed: !!customerPhone, source: 'case' },
      { id: 'chk_3', category: 'customer', label: 'Umzugstermin bestätigt', required: true, completed: !!jobDate, source: 'calendar' },
      { id: 'chk_4', category: 'vehicle', label: 'Fahrzeug bestätigt', required: true, completed: !!vehicleId, source: 'dispatch' },
      { id: 'chk_5', category: 'crew', label: 'Mitarbeiter bestätigt', required: true, completed: employeeIds.length > 0, source: 'dispatch' },
      { id: 'chk_6', category: 'route', label: 'Route bestätigt', required: true, completed: !!tourReview, source: 'tour' },
      { id: 'chk_7', category: 'route', label: 'Abholadresse vollständig', required: true, completed: !!(pickupAddress.street && pickupAddress.city), source: 'tour' },
      { id: 'chk_8', category: 'route', label: 'Zieladresse vollständig', required: true, completed: !!(destinationAddress.street && destinationAddress.city), source: 'tour' },
      { id: 'chk_9', category: 'parking', label: 'Halteverbotszone geklärt', required: false, completed: true, source: 'planning' },
      { id: 'chk_10', category: 'material', label: 'Benötigte Materialien vorhanden', required: true, completed: requiredMaterials.every(m => m.status === 'confirmed_available' || m.status === 'not_required'), source: 'planning' },
      { id: 'chk_11', category: 'document', label: 'Angebots-PDF vorhanden', required: true, completed: requiredDocuments.some(d => d.type === 'offer' && d.available), source: 'manual' },
      { id: 'chk_12', category: 'document', label: 'Lieferschein / Arbeitsunterlage vorbereitet', required: true, completed: requiredDocuments.some(d => (d.type === 'delivery_note' || d.type === 'work_order') && d.available), source: 'manual' },
      { id: 'chk_13', category: 'safety', label: 'Besondere Risiken bestätigt', required: true, completed: !(tourReview?.risks.some(r => !r.acknowledged)), source: 'tour' },
      { id: 'chk_14', category: 'communication', label: 'Schlüssel- oder Zugangsinformationen vorhanden', required: false, completed: true, source: 'case' }
    ];

    // Reminders setup
    const nowIso = new Date().toISOString();
    const reminders: CaseReminder[] = [];

    const addReminderDef = (
      daysBefore: number,
      timeStr: string,
      title: string,
      refType: CaseReminder['referenceType'],
      priority: CaseReminder['priority'] = 'medium'
    ) => {
      const targetDateStr = this.calculateOffsetDate(jobDate, daysBefore);
      const dueAt = this.formatIsoVienna(targetDateStr, timeStr);
      const isDueNow = dueAt <= nowIso;

      const existing = caseItem.reminders?.find(
        r => r.referenceType === refType && r.referenceId === reviewId && r.dueAt === dueAt
      );

      if (!existing) {
        const rem: CaseReminder = {
          id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          caseId,
          referenceType: refType,
          referenceId: reviewId,
          title,
          dueAt,
          status: isDueNow ? 'due' : 'scheduled',
          priority,
          createdAt: nowIso,
          notifiedAt: isDueNow ? nowIso : undefined
        };
        reminders.push(rem);
        caseItem.reminders?.push(rem);
      } else {
        reminders.push(existing);
      }
    };

    // 7 days before
    addReminderDef(7, '09:00', 'Halteverbotszone prüfen', 'parking_check');
    addReminderDef(7, '09:00', 'Fehlende Kundeninformationen prüfen', 'customer_confirmation');
    addReminderDef(7, '09:00', 'Materialien prüfen', 'material_check');

    // 2 days before
    addReminderDef(2, '09:00', 'Fahrzeugverfügbarkeit bestätigen', 'vehicle_check');
    addReminderDef(2, '09:00', 'Mitarbeiterbesetzung bestätigen', 'crew_check');
    addReminderDef(2, '09:00', 'Route und Risiken prüfen', 'operation_preparation');
    addReminderDef(2, '09:00', 'Dokumente vorbereiten', 'document_check');

    // 1 day before
    addReminderDef(1, '16:00', 'Kundenkontakt und Termin prüfen', 'customer_confirmation');
    addReminderDef(1, '16:00', 'Einsatzunterlagen final prüfen', 'document_check');
    addReminderDef(1, '16:00', 'Fahrzeugausrüstung prüfen', 'vehicle_check');

    // Job day
    addReminderDef(0, preparationTime, 'Vorbereitung beginnen', 'job_start', 'high');
    addReminderDef(0, jobStartTime, 'Auftrag startet in Kürze', 'job_start', 'high');

    const partialReview: Partial<OperationPreparationReview> = {
      id: reviewId,
      caseId,
      planningReviewId: planningReview?.id || '',
      dispatchReviewId: dispatchReview?.id || '',
      calendarPlanningReviewId: calendarReview?.id || '',
      tourPlanningReviewId: tourReview?.id || '',
      status: 'pending',
      operationData,
      checklist,
      reminders,
      warnings,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const evalRes = this.evaluateOperationPreparationReadiness(partialReview, caseItem);

    const newReview: OperationPreparationReview = {
      ...(partialReview as any),
      readiness: evalRes.readiness,
      warnings: evalRes.warnings
    };

    caseItem.operationPreparationReviews.push(newReview);

    // Create task "Einsatzunterlagen prüfen" if not present
    if (!caseItem.tasks.some(t => t.title.includes('Einsatzunterlagen prüfen') && t.status !== 'Completed')) {
      caseService.addTask(caseId, {
        title: 'Einsatzunterlagen prüfen',
        description: 'Einsatzvorbereitung, Materialien, Dokumente und Checkliste prüfen',
        category: 'Planning',
        priority: 'medium',
        status: 'Open',
        source: 'OperationPreparationService',
        workflowId: `wf_op_prep_${reviewId}`,
        caseId,
        referenceType: 'TOUR_CONFIRMATION',
        referenceId: newReview.id
      });
    }

    // Add Timeline entry
    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Einsatzvorbereitung erstellt',
      description: 'Automatische Einsatzvorbereitung mit Checkliste und Erinnerungsplan erstellt.',
      category: 'Planning',
      source: 'OperationPreparationService',
      timestamp: nowIso,
      metadata: { reviewId: newReview.id, readiness: newReview.readiness }
    });

    caseService.evaluateCaseHealth(caseItem);
    caseService.flushPersistence();

    workflowEngine.emitEvent('OPERATION_PREPARATION_REVIEW_CREATED', 'OperationPreparationService', {
      caseId,
      reviewId: newReview.id
    });

    return newReview;
  }

  /**
   * Updates an existing Operation Preparation Review with partial changes.
   */
  updateOperationPreparationReview(
    caseId: string,
    reviewId: string,
    updates: {
      operationData?: Partial<OperationPreparationData>;
      checklist?: OperationChecklistItem[];
      warnings?: OperationPreparationWarning[];
    }
  ): OperationPreparationReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.operationPreparationReviews) return null;

    const review = caseItem.operationPreparationReviews.find(r => r.id === reviewId);
    if (!review) return null;

    if (updates.operationData) {
      review.operationData = {
        ...review.operationData,
        ...updates.operationData
      };
    }

    if (updates.checklist) {
      review.checklist = updates.checklist;
      caseService.addTimelineEntry(caseId, {
        type: 'task_completed',
        title: 'Checkliste geändert',
        description: 'Einsatz-Checkliste wurde aktualisiert.',
        category: 'Planning',
        source: 'OperationPreparationService',
        timestamp: new Date().toISOString(),
        metadata: { reviewId }
      });
    }

    if (updates.warnings) {
      review.warnings = updates.warnings;
    }

    const nowIso = new Date().toISOString();
    review.updatedAt = nowIso;
    review.status = 'edited';

    const evalRes = this.evaluateOperationPreparationReadiness(review, caseItem);
    review.readiness = evalRes.readiness;
    review.warnings = evalRes.warnings;

    caseService.evaluateCaseHealth(caseItem);
    caseService.flushPersistence();

    workflowEngine.emitEvent('OPERATION_PREPARATION_REVIEW_UPDATED', 'OperationPreparationService', {
      caseId,
      reviewId
    });

    return review;
  }

  /**
   * Confirms an Operation Preparation Review, creating the operation task and setting status to confirmed.
   */
  confirmOperationPreparationReview(caseId: string, reviewId: string): OperationPreparationReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.operationPreparationReviews) return null;

    const review = caseItem.operationPreparationReviews.find(r => r.id === reviewId);
    if (!review) return null;

    if (this.runtimeLocks.has(reviewId)) {
      return review;
    }

    this.runtimeLocks.add(reviewId);

    try {
      const evalRes = this.evaluateOperationPreparationReadiness(review, caseItem);
      review.readiness = evalRes.readiness;
      review.warnings = evalRes.warnings;

      if (evalRes.readiness !== 'ready') {
        review.errorMessage = 'Einsatzvorbereitung kann nicht bestätigt werden. Einige Pflichtpunkte fehlen.';
        caseService.addTimelineEntry(caseId, {
          type: 'status_change',
          title: 'Einsatzvorbereitung blockiert',
          description: `Bestätigung fehlgeschlagen: Readiness ist ${evalRes.readiness}`,
          category: 'Planning',
          source: 'OperationPreparationService',
          timestamp: new Date().toISOString(),
          metadata: { reviewId, readiness: evalRes.readiness }
        });
        caseService.flushPersistence();
        return review;
      }

      const nowIso = new Date().toISOString();
      review.status = 'confirmed';
      review.confirmedAt = nowIso;
      review.updatedAt = nowIso;
      review.errorMessage = undefined;

      // Complete task "Einsatzunterlagen prüfen"
      caseService.completeTaskByReference(caseId, 'TOUR_CONFIRMATION', review.id);
      caseService.completeTaskByTitlePattern(caseId, 'Einsatzunterlagen prüfen');

      // Create / maintain task "Einsatz durchführen"
      if (!caseItem.tasks.some(t => t.title.includes('Einsatz durchführen') && t.status !== 'Completed')) {
        caseService.addTask(caseId, {
          title: 'Einsatz durchführen',
          description: 'Vorbereiteter Umzugseinsatz laut Touren- und Einsatzplanung ausführen',
          category: 'Schedule',
          priority: 'high',
          status: 'Open',
          source: 'OperationPreparationService',
          workflowId: `wf_exec_${review.id}`,
          caseId,
          referenceType: 'OPERATION_CONFIRMATION',
          referenceId: review.id
        });
      }

      // Save insights to Learning Service
      learningService.saveInsight({
        caseId,
        workflowType: 'operation_preparation',
        suggestedValue: {
          materials: review.operationData.requiredMaterials,
          checklist: review.checklist
        },
        acceptedValue: {
          confirmedAt: nowIso,
          readiness: review.readiness
        },
        wasAccepted: true,
        timestamp: nowIso
      });

      // Add Timeline entry
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        title: 'Einsatzvorbereitung bestätigt',
        description: 'Einsatzvorbereitung wurde erfolgreich geprüft und bestätigt.',
        category: 'Planning',
        source: 'OperationPreparationService',
        timestamp: nowIso,
        metadata: { reviewId: review.id }
      });

      caseService.evaluateCaseHealth(caseItem);
      caseService.flushPersistence();

      workflowEngine.emitEvent('OPERATION_PREPARATION_CONFIRMED', 'OperationPreparationService', {
        caseId,
        reviewId: review.id
      });

      return review;
    } finally {
      this.runtimeLocks.delete(reviewId);
    }
  }

  /**
   * Checks for due reminders across all cases or a specific case.
   */
  checkDueReminders(caseId?: string): CaseReminder[] {
    const casesToCheck = caseId
      ? [caseService.getCase(caseId)].filter(Boolean) as Case[]
      : caseService.getAllCases();

    const nowIso = new Date().toISOString();
    const dueReminders: CaseReminder[] = [];

    for (const c of casesToCheck) {
      if (!c.reminders) continue;
      let updated = false;

      for (const rem of c.reminders) {
        if (rem.status === 'scheduled' && rem.dueAt <= nowIso) {
          rem.status = 'due';
          rem.notifiedAt = nowIso;
          dueReminders.push(rem);
          updated = true;

          // Sync in reviews
          if (c.operationPreparationReviews) {
            for (const rev of c.operationPreparationReviews) {
              const rInRev = rev.reminders?.find(r => r.id === rem.id);
              if (rInRev) {
                rInRev.status = 'due';
                rInRev.notifiedAt = nowIso;
              }
            }
          }

          workflowEngine.emitEvent('CASE_REMINDER_DUE', 'OperationPreparationService', {
            caseId: c.id,
            reminderId: rem.id,
            title: rem.title
          });
        }
      }

      if (updated) {
        caseService.flushPersistence();
      }
    }

    return dueReminders;
  }

  /**
   * Marks a reminder as completed.
   */
  completeReminder(caseId: string, reminderId: string): CaseReminder | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.reminders) return null;

    const rem = caseItem.reminders.find(r => r.id === reminderId);
    if (!rem) return null;

    rem.status = 'completed';
    rem.completedAt = new Date().toISOString();

    if (caseItem.operationPreparationReviews) {
      for (const rev of caseItem.operationPreparationReviews) {
        const rInRev = rev.reminders?.find(r => r.id === reminderId);
        if (rInRev) {
          rInRev.status = 'completed';
          rInRev.completedAt = rem.completedAt;
        }
      }
    }

    caseService.addTimelineEntry(caseId, {
      type: 'task_completed',
      title: 'Erinnerung erledigt',
      description: `Erinnerung "${rem.title}" wurde als erledigt markiert.`,
      category: 'Planning',
      source: 'OperationPreparationService',
      timestamp: new Date().toISOString(),
      metadata: { reminderId: rem.id, title: rem.title }
    });

    caseService.flushPersistence();

    workflowEngine.emitEvent('CASE_REMINDER_COMPLETED', 'OperationPreparationService', {
      caseId,
      reminderId: rem.id
    });

    return rem;
  }

  /**
   * Generates an email draft requesting missing customer information.
   */
  requestMissingCustomerInfo(caseId: string, reviewId: string) {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    const review = caseItem.operationPreparationReviews?.find(r => r.id === reviewId);

    const missingFields = [];
    if (!review?.operationData.customerPhone) missingFields.push({ fieldName: 'Telefonnummer', reason: 'Für Rückfragen am Einsatztag erforderlich' });
    if (!review?.operationData.customerEmail) missingFields.push({ fieldName: 'E-Mail-Adresse', reason: 'Für die Übermittlung der Einsatzunterlagen erforderlich' });
    if (!review?.operationData.pickupAddress.street) missingFields.push({ fieldName: 'Auszugsadresse', reason: 'Unvollständige Adressangaben' });

    const draft = emailDraftService.createDraftForCase(caseId, {
      purpose: 'request_missing_information',
      requestedFields: missingFields as any,
      customMessageText: 'Sehr geehrte Damen und Herren,\n\nfür die optimale Vorbereitung Ihres Umzugstermins bitten wir Sie höflich um Ergänzung der folgenden Angaben:\n\nVielen Dank!'
    });

    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Fehlende Angaben angefordert',
      description: 'E-Mail-Entwurf zur Anforderung fehlender Kundeninformationen erstellt.',
      category: 'Communication',
      source: 'OperationPreparationService',
      timestamp: new Date().toISOString(),
      metadata: { reviewId, draftId: draft?.id }
    });

    caseService.flushPersistence();
    return draft;
  }

  /**
   * Rejects an Operation Preparation Review.
   */
  rejectOperationPreparationReview(caseId: string, reviewId: string, reason?: string): OperationPreparationReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.operationPreparationReviews) return null;

    const review = caseItem.operationPreparationReviews.find(r => r.id === reviewId);
    if (!review) return null;

    review.status = 'rejected';
    review.updatedAt = new Date().toISOString();

    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Einsatzvorbereitung abgelehnt',
      description: `Einsatzvorbereitung wurde abgelehnt.${reason ? ` Grund: ${reason}` : ''}`,
      category: 'Planning',
      source: 'OperationPreparationService',
      timestamp: new Date().toISOString(),
      metadata: { reviewId: review.id, reason }
    });

    caseService.flushPersistence();

    workflowEngine.emitEvent('TOUR_PLANNING_REVIEW_REJECTED', 'OperationPreparationService', {
      caseId,
      reviewId: review.id,
      reason
    });

    return review;
  }
}

export const operationPreparationService = new OperationPreparationService();
