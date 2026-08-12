import { caseService, Case } from './case-service';
import { workflowEngine } from './workflow-engine';
import { learningService } from './learning-service';
import { invoiceDraftService } from './invoice-draft-service';
import {
  OperationExecutionReview,
  PlannedOperationSnapshot,
  ActualOperationData,
  OperationServiceResult,
  OperationAdditionalService,
  OperationMaterialUsage,
  OperationDeviation,
  OperationIncident,
  OperationCompletionChecklistItem,
  OperationCompletionReadiness,
  OperationExecutionStatus,
  CustomerConfirmationStatus,
  OperationPreparationReview
} from './types';

export class OperationExecutionService {
  private runtimeLocks = new Set<string>();

  /**
   * Creates a new OperationExecutionReview for a case based on a confirmed OperationPreparationReview.
   * Ensures idempotency: returns existing review if already present for the case/prepReview.
   */
  createOperationExecutionReview(
    caseId: string,
    operationPreparationReviewId?: string
  ): OperationExecutionReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    // Idempotency check: return existing execution review if present
    if (caseItem.operationExecutionReviews && caseItem.operationExecutionReviews.length > 0) {
      const existing = operationPreparationReviewId
        ? caseItem.operationExecutionReviews.find(
            r => r.operationPreparationReviewId === operationPreparationReviewId && r.status !== 'cancelled'
          )
        : caseItem.operationExecutionReviews.find(r => r.status !== 'cancelled');

      if (existing) {
        return existing;
      }
    }

    // Find the relevant OperationPreparationReview
    let prepReview: OperationPreparationReview | undefined;
    if (operationPreparationReviewId) {
      prepReview = caseItem.operationPreparationReviews?.find(r => r.id === operationPreparationReviewId);
    } else {
      prepReview = caseItem.operationPreparationReviews?.find(r => r.status === 'confirmed') ||
                 caseItem.operationPreparationReviews?.[caseItem.operationPreparationReviews.length - 1];
    }

    if (!prepReview || !prepReview.operationData) {
      return null;
    }

    const opPrep = prepReview.operationData;

    // Build plannedData snapshot from confirmed preparation
    const plannedData: PlannedOperationSnapshot = {
      scheduledStart: opPrep.jobStartTime || opPrep.jobDate || new Date().toISOString(),
      scheduledEnd: opPrep.estimatedEndTime || opPrep.jobDate || new Date().toISOString(),
      plannedDurationMinutes: opPrep.estimatedWorkingMinutes || 0,
      plannedDrivingMinutes: opPrep.estimatedDrivingMinutes || 0,
      plannedBufferMinutes: opPrep.bufferMinutes || 0,
      vehicleId: opPrep.vehicleId || '',
      employeeIds: opPrep.employeeIds ? [...opPrep.employeeIds] : [],
      services: opPrep.services ? [...opPrep.services] : [],
      routeStopIds: opPrep.intermediateStops ? opPrep.intermediateStops.map(s => s.id) : [],
      offerDraftId: caseItem.offerDrafts?.[0]?.id || '',
      documentIds: opPrep.requiredDocuments
        ? (opPrep.requiredDocuments.map(d => d.documentId).filter(Boolean) as string[])
        : []
    };

    // Build initial actualData structure
    const actualData: ActualOperationData = {
      employeeIds: [...plannedData.employeeIds],
      vehicleId: plannedData.vehicleId,
      completedServices: plannedData.services.map((srv, idx) => ({
        id: `srv_${idx}_${Date.now()}`,
        label: srv,
        planned: true,
        completed: false,
        partiallyCompleted: false,
        source: 'offer'
      })),
      additionalServices: [],
      materialsUsed: opPrep.requiredMaterials
        ? opPrep.requiredMaterials.map(m => ({
            id: m.id,
            name: m.name,
            plannedQuantity: m.quantityNeeded,
            actualQuantity: m.quantityNeeded,
            unit: m.unit
          }))
        : [],
      customerPresent: true,
      customerConfirmationStatus: 'confirmation_pending'
    };

    // Build default completion checklist
    const completionChecklist: OperationCompletionChecklistItem[] = [
      { id: 'c_start', category: 'time', label: 'Tatsächlicher Einsatzbeginn dokumentiert', required: true, completed: false },
      { id: 'c_end', category: 'time', label: 'Tatsächliches Einsatzende dokumentiert', required: true, completed: false },
      { id: 'c_vehicle', category: 'resources', label: 'Fahrzeugzuweisung bestätigt', required: true, completed: true },
      { id: 'c_crew', category: 'resources', label: 'Mitarbeiterzuweisung bestätigt', required: true, completed: true },
      { id: 'c_services', category: 'services', label: 'Geplante Leistungen geprüft', required: true, completed: false },
      { id: 'c_additional', category: 'services', label: 'Zusatzleistungen erfasst und freigegeben', required: false, completed: true },
      { id: 'c_materials', category: 'materials', label: 'Materialverbrauch geprüft', required: false, completed: true },
      { id: 'c_incidents', category: 'incidents', label: 'Vorkommnisse und Schäden geklärt', required: true, completed: true },
      { id: 'c_documents', category: 'documents', label: 'Einsatzdokumente (Lieferschein/Arbeitsauftrag) erfasst', required: true, completed: false },
      { id: 'c_customer', category: 'customer', label: 'Kundenbestätigung vorliegend', required: true, completed: false },
      { id: 'c_followup', category: 'follow_up', label: 'Offene Nacharbeiten dokumentiert', required: false, completed: true },
      { id: 'c_invoice_basis', category: 'invoice_basis', label: 'Rechnungsgrundlage vollständig', required: true, completed: false }
    ];

    const nowIso = new Date().toISOString();
    const review: OperationExecutionReview = {
      id: `exec_rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      caseId,
      operationPreparationReviewId: prepReview.id,
      calendarPlanningReviewId: prepReview.calendarPlanningReviewId || '',
      tourPlanningReviewId: prepReview.tourPlanningReviewId || '',
      status: 'pending',
      plannedData,
      actualData,
      deviations: [],
      incidents: [],
      completionChecklist,
      readiness: 'not_started',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    review.deviations = this.detectOperationDeviations(review);
    review.readiness = this.evaluateOperationCompletionReadiness(review);

    if (!caseItem.operationExecutionReviews) {
      caseItem.operationExecutionReviews = [];
    }
    caseItem.operationExecutionReviews.push(review);

    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Einsatzdurchführung vorbereitet',
      description: 'Einsatzdurchführung wurde angelegt und wartet auf Einsatzstart.',
      category: 'Dispatch',
      source: 'OperationExecutionService',
      timestamp: nowIso,
      metadata: { reviewId: review.id }
    });

    caseService.evaluateCaseHealth(caseItem);
    caseService.flushPersistence();

    workflowEngine.emitEvent('OPERATION_EXECUTION_REVIEW_CREATED', 'OperationExecutionService', {
      caseId,
      reviewId: review.id
    });

    return review;
  }

  /**
   * Pure function to evaluate readiness for completing an operation.
   */
  evaluateOperationCompletionReadiness(
    review: Partial<OperationExecutionReview>
  ): OperationCompletionReadiness {
    if (!review || !review.actualData) {
      return 'not_started';
    }

    const { actualData, incidents, completionChecklist, status } = review;

    // 1. Missing start time
    if (!actualData.actualStart) {
      return status === 'pending' ? 'not_started' : 'missing_start_time';
    }

    // 2. Missing end time
    if (!actualData.actualEnd) {
      return 'missing_end_time';
    }

    // 3. Conflicting time information
    const startMs = new Date(actualData.actualStart).getTime();
    const endMs = new Date(actualData.actualEnd).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      return 'conflicting_information';
    }

    // 4. Unresolved critical incidents (high priority blocker)
    if (incidents && incidents.length > 0) {
      const unresolvedCritical = incidents.find(
        i => (i.severity === 'high') && !i.resolved
      );
      if (unresolvedCritical) {
        return 'unresolved_incidents';
      }
    }

    // 5. Missing service confirmation
    if (actualData.completedServices && actualData.completedServices.length > 0) {
      const unconfirmedService = actualData.completedServices.find(
        s => s.planned && !s.completed && !s.partiallyCompleted && !s.notes
      );
      if (unconfirmedService) {
        return 'missing_service_confirmation';
      }
    }

    // 6. Missing customer confirmation
    if (actualData.customerConfirmationStatus === 'confirmation_pending') {
      return 'missing_customer_confirmation';
    }

    // 7. Check checklist requirements if any required document or time check is open
    if (completionChecklist) {
      const docItem = completionChecklist.find(c => c.id === 'c_documents');
      if (docItem && docItem.required && !docItem.completed) {
        // Only mark missing_documents if not overridden
      }
    }

    return 'ready_to_complete';
  }

  /**
   * Pure function to detect deviations between planned and actual operation data.
   */
  detectOperationDeviations(review: Partial<OperationExecutionReview>): OperationDeviation[] {
    const deviations: OperationDeviation[] = [];
    if (!review || !review.plannedData || !review.actualData) return deviations;

    const { plannedData, actualData, incidents } = review;

    // 1. Start time deviation
    if (plannedData.scheduledStart && actualData.actualStart) {
      const planStartMs = new Date(plannedData.scheduledStart).getTime();
      const actStartMs = new Date(actualData.actualStart).getTime();
      if (!isNaN(planStartMs) && !isNaN(actStartMs)) {
        const diffMinutes = Math.round((actStartMs - planStartMs) / 60000);
        if (Math.abs(diffMinutes) > 15) {
          deviations.push({
            id: 'dev_start_time',
            type: 'start_time',
            plannedValue: plannedData.scheduledStart,
            actualValue: actualData.actualStart,
            severity: Math.abs(diffMinutes) > 45 ? 'critical' : 'warning',
            description: diffMinutes > 0
              ? `Einsatzbeginn um ${diffMinutes} Minuten verzögert.`
              : `Einsatzbeginn ${Math.abs(diffMinutes)} Minuten früher als geplant.`,
            requiresReview: Math.abs(diffMinutes) > 30,
            acknowledged: false
          });
        }
      }
    }

    // 2. Duration / Working time deviation
    if (actualData.actualWorkingMinutes && plannedData.plannedDurationMinutes) {
      const diffWorking = actualData.actualWorkingMinutes - plannedData.plannedDurationMinutes;
      if (Math.abs(diffWorking) >= 30) {
        deviations.push({
          id: 'dev_duration',
          type: 'duration',
          plannedValue: plannedData.plannedDurationMinutes,
          actualValue: actualData.actualWorkingMinutes,
          severity: diffWorking > 60 ? 'critical' : 'warning',
          description: diffWorking > 0
            ? `Arbeitszeit überschreitet Planung um ${diffWorking} Minuten.`
            : `Arbeitszeit ist um ${Math.abs(diffWorking)} Minuten kürzer als geplant.`,
          requiresReview: Math.abs(diffWorking) > 45,
          acknowledged: false
        });
      }
    }

    // 3. Vehicle deviation
    if (actualData.vehicleId && plannedData.vehicleId && actualData.vehicleId !== plannedData.vehicleId) {
      deviations.push({
        id: 'dev_vehicle',
        type: 'vehicle',
        plannedValue: plannedData.vehicleId,
        actualValue: actualData.vehicleId,
        severity: 'info',
        description: `Abweichendes Fahrzeug eingesetzt (Geplant: ${plannedData.vehicleId}, Tatsächlich: ${actualData.vehicleId}).`,
        requiresReview: false,
        acknowledged: false
      });
    }

    // 4. Crew deviation
    if (actualData.employeeIds && plannedData.employeeIds) {
      const plannedSet = new Set(plannedData.employeeIds);
      const actualSet = new Set(actualData.employeeIds);
      const differs = plannedData.employeeIds.length !== actualData.employeeIds.length ||
        plannedData.employeeIds.some(e => !actualSet.has(e));

      if (differs) {
        deviations.push({
          id: 'dev_crew',
          type: 'crew',
          plannedValue: plannedData.employeeIds,
          actualValue: actualData.employeeIds,
          severity: 'info',
          description: 'Personalbesetzung weicht von der Tourenplanung ab.',
          requiresReview: false,
          acknowledged: false
        });
      }
    }

    // 5. Service deviations (uncompleted planned services or extra additional services)
    if (actualData.completedServices) {
      const uncompleted = actualData.completedServices.filter(s => s.planned && !s.completed);
      if (uncompleted.length > 0) {
        deviations.push({
          id: 'dev_service_uncompleted',
          type: 'service',
          plannedValue: `${actualData.completedServices.length} Leistungen`,
          actualValue: `${actualData.completedServices.length - uncompleted.length} erbracht`,
          severity: 'warning',
          description: `${uncompleted.length} geplante Leistung(en) nicht vollständig erbracht.`,
          requiresReview: true,
          acknowledged: false
        });
      }
    }

    if (actualData.additionalServices && actualData.additionalServices.length > 0) {
      deviations.push({
        id: 'dev_service_additional',
        type: 'service',
        plannedValue: 'Keine Zusatzleistungen',
        actualValue: `${actualData.additionalServices.length} Zusatzleistung(en)`,
        severity: 'info',
        description: `${actualData.additionalServices.length} ungeplante Zusatzleistung(en) während des Einsatzes erfasst.`,
        requiresReview: false,
        acknowledged: false
      });
    }

    // 6. Material usage deviation
    if (actualData.materialsUsed) {
      const materialDevs = actualData.materialsUsed.filter(m => m.actualQuantity !== m.plannedQuantity);
      if (materialDevs.length > 0) {
        deviations.push({
          id: 'dev_material',
          type: 'material',
          plannedValue: materialDevs.map(m => `${m.name}: ${m.plannedQuantity} ${m.unit}`),
          actualValue: materialDevs.map(m => `${m.name}: ${m.actualQuantity} ${m.unit}`),
          severity: 'info',
          description: 'Materialverbrauch weicht von der Materialplanung ab.',
          requiresReview: false,
          acknowledged: false
        });
      }
    }

    // 7. Incident deviation
    if (incidents && incidents.length > 0) {
      const highIncidents = incidents.filter(i => i.severity === 'high');
      deviations.push({
        id: 'dev_incidents',
        type: 'other',
        plannedValue: 'Keine Vorkommnisse',
        actualValue: `${incidents.length} Vorkommnis(se)`,
        severity: highIncidents.length > 0 ? 'critical' : 'warning',
        description: `${incidents.length} Vorkommnis(se) / Schadenmeldungen während des Einsatzes registriert.`,
        requiresReview: true,
        acknowledged: false
      });
    }

    return deviations;
  }

  /**
   * Starts an operation execution (Einsatz starten).
   */
  startOperationExecution(
    caseId: string,
    reviewId: string,
    actualStartTime?: string
  ): OperationExecutionReview | null {
    if (this.runtimeLocks.has(reviewId)) {
      const caseItem = caseService.getCase(caseId);
      return caseItem?.operationExecutionReviews?.find(r => r.id === reviewId) || null;
    }

    this.runtimeLocks.add(reviewId);

    try {
      const caseItem = caseService.getCase(caseId);
      if (!caseItem || !caseItem.operationExecutionReviews) return null;

      const review = caseItem.operationExecutionReviews.find(r => r.id === reviewId);
      if (!review) return null;

      // Idempotency: if already started, return existing review
      if (review.startedAt || review.status === 'in_progress' || review.status === 'completion_review') {
        return review;
      }

      const nowIso = actualStartTime || new Date().toISOString();
      review.actualData.actualStart = nowIso;
      review.startedAt = nowIso;
      review.status = 'in_progress';
      review.updatedAt = new Date().toISOString();

      // Update checklist start item
      const startCheckItem = review.completionChecklist.find(c => c.id === 'c_start');
      if (startCheckItem) {
        startCheckItem.completed = true;
      }

      review.deviations = this.detectOperationDeviations(review);
      review.readiness = this.evaluateOperationCompletionReadiness(review);

      // Update Case status to In Progress
      caseItem.status = 'In Progress';

      // Update or create task "Einsatz durchführen"
      let task = caseItem.tasks.find(t => t.title.includes('Einsatz durchführen') && t.status !== 'Completed');
      if (task) {
        task.status = 'In Progress';
      } else {
        caseService.addTask(caseId, {
          title: 'Einsatz durchführen',
          description: 'Einsatz wurde gestartet und befindet sich in der Ausführung',
          category: 'Schedule',
          priority: 'high',
          status: 'In Progress',
          source: 'OperationExecutionService',
          workflowId: `wf_exec_start_${review.id}`,
          caseId,
          referenceType: 'OPERATION_EXECUTION',
          referenceId: review.id
        });
      }

      // Add timeline entry
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        title: 'Einsatz gestartet',
        description: `Einsatz wurde um ${new Date(nowIso).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })} Uhr gestartet.`,
        category: 'Dispatch',
        source: 'OperationExecutionService',
        timestamp: nowIso,
        metadata: { reviewId: review.id, actualStart: nowIso }
      });

      caseService.evaluateCaseHealth(caseItem);
      caseService.flushPersistence();

      workflowEngine.emitEvent('OPERATION_EXECUTION_STARTED', 'OperationExecutionService', {
        caseId,
        reviewId: review.id,
        actualStart: nowIso
      });

      return review;
    } finally {
      this.runtimeLocks.delete(reviewId);
    }
  }

  /**
   * Updates actual data during or after operation execution.
   */
  updateActualData(
    caseId: string,
    reviewId: string,
    actualDataUpdates: Partial<ActualOperationData>
  ): OperationExecutionReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.operationExecutionReviews) return null;

    const review = caseItem.operationExecutionReviews.find(r => r.id === reviewId);
    if (!review) return null;

    review.actualData = {
      ...review.actualData,
      ...actualDataUpdates
    };

    // Calculate working minutes if both start and end times are present
    if (review.actualData.actualStart && review.actualData.actualEnd) {
      const startMs = new Date(review.actualData.actualStart).getTime();
      const endMs = new Date(review.actualData.actualEnd).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
        const totalMinutes = Math.round((endMs - startMs) / 60000);
        const breakMinutes = review.actualData.actualBreakMinutes || 0;
        review.actualData.actualWorkingMinutes = Math.max(0, totalMinutes - breakMinutes);
      }
    }

    // Update checklist based on actuals
    if (review.actualData.actualStart) {
      const startCheck = review.completionChecklist.find(c => c.id === 'c_start');
      if (startCheck) startCheck.completed = true;
    }

    if (review.actualData.actualEnd) {
      const endCheck = review.completionChecklist.find(c => c.id === 'c_end');
      if (endCheck) endCheck.completed = true;

      // Transition review status to completion_review if in_progress
      if (review.status === 'in_progress') {
        review.status = 'completion_review';
      }
    }

    if (review.actualData.customerConfirmationStatus === 'confirmed') {
      const custCheck = review.completionChecklist.find(c => c.id === 'c_customer');
      if (custCheck) custCheck.completed = true;
    }

    review.updatedAt = new Date().toISOString();
    review.deviations = this.detectOperationDeviations(review);
    review.readiness = this.evaluateOperationCompletionReadiness(review);

    caseService.flushPersistence();

    workflowEngine.emitEvent('OPERATION_EXECUTION_UPDATED', 'OperationExecutionService', {
      caseId,
      reviewId: review.id
    });

    return review;
  }

  /**
   * Adds an additional service to actual operation data.
   */
  addAdditionalService(
    caseId: string,
    reviewId: string,
    serviceData: Omit<OperationAdditionalService, 'id' | 'createdAt'>
  ): OperationExecutionReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.operationExecutionReviews) return null;

    const review = caseItem.operationExecutionReviews.find(r => r.id === reviewId);
    if (!review) return null;

    const newService: OperationAdditionalService = {
      id: `add_srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...serviceData
    };

    if (!review.actualData.additionalServices) {
      review.actualData.additionalServices = [];
    }
    review.actualData.additionalServices.push(newService);

    review.updatedAt = new Date().toISOString();
    review.deviations = this.detectOperationDeviations(review);
    review.readiness = this.evaluateOperationCompletionReadiness(review);

    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Zusatzleistung erfasst',
      description: `Zusatzleistung "${newService.description}" (${newService.quantity} ${newService.unit}) erfasst.`,
      category: 'Dispatch',
      source: 'OperationExecutionService',
      timestamp: newService.createdAt,
      metadata: { reviewId, serviceId: newService.id }
    });

    caseService.flushPersistence();

    workflowEngine.emitEvent('OPERATION_EXECUTION_UPDATED', 'OperationExecutionService', {
      caseId,
      reviewId: review.id
    });

    return review;
  }

  /**
   * Records an incident or damage during operation.
   */
  addIncident(
    caseId: string,
    reviewId: string,
    incidentData: {
      type?: OperationIncident['type'];
      severity?: 'low' | 'medium' | 'high';
      title: string;
      description: string;
      resolved?: boolean;
      resolutionNotes?: string;
      documentIds?: string[];
    }
  ): OperationExecutionReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.operationExecutionReviews) return null;

    const review = caseItem.operationExecutionReviews.find(r => r.id === reviewId);
    if (!review) return null;

    const newIncident: OperationIncident = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      type: incidentData.type || 'other',
      severity: incidentData.severity || 'medium',
      title: incidentData.title,
      description: incidentData.description,
      resolved: incidentData.resolved || false,
      resolutionNotes: incidentData.resolutionNotes,
      documentIds: incidentData.documentIds || []
    };

    if (!review.incidents) {
      review.incidents = [];
    }
    review.incidents.push(newIncident);

    review.updatedAt = new Date().toISOString();
    review.deviations = this.detectOperationDeviations(review);
    review.readiness = this.evaluateOperationCompletionReadiness(review);

    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Vorkommnis dokumentiert',
      description: `[${newIncident.severity.toUpperCase()}] ${newIncident.title}: ${newIncident.description}`,
      category: 'Dispatch',
      source: 'OperationExecutionService',
      timestamp: newIncident.createdAt,
      metadata: { reviewId, incidentId: newIncident.id, severity: newIncident.severity }
    });

    caseService.flushPersistence();

    workflowEngine.emitEvent('OPERATION_EXECUTION_UPDATED', 'OperationExecutionService', {
      caseId,
      reviewId: review.id
    });

    return review;
  }

  /**
   * Resolves a reported incident.
   */
  resolveIncident(
    caseId: string,
    reviewId: string,
    incidentId: string,
    resolutionNotes: string
  ): OperationExecutionReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.operationExecutionReviews) return null;

    const review = caseItem.operationExecutionReviews.find(r => r.id === reviewId);
    if (!review || !review.incidents) return null;

    const incident = review.incidents.find(i => i.id === incidentId);
    if (!incident) return null;

    incident.resolved = true;
    incident.resolutionNotes = resolutionNotes;

    review.updatedAt = new Date().toISOString();
    review.deviations = this.detectOperationDeviations(review);
    review.readiness = this.evaluateOperationCompletionReadiness(review);

    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Vorkommnis geklärt',
      description: `Vorkommnis "${incident.title}" wurde geklärt: ${resolutionNotes}`,
      category: 'Dispatch',
      source: 'OperationExecutionService',
      timestamp: new Date().toISOString(),
      metadata: { reviewId, incidentId }
    });

    caseService.flushPersistence();

    workflowEngine.emitEvent('OPERATION_EXECUTION_UPDATED', 'OperationExecutionService', {
      caseId,
      reviewId: review.id
    });

    return review;
  }

  /**
   * Confirms controlled operation completion (Einsatzabschluss).
   */
  completeOperationExecution(
    caseId: string,
    reviewId: string,
    options?: {
      confirmedBy?: string;
      followUpRequired?: boolean;
      followUpNotes?: string;
      overrideWarnings?: boolean;
    }
  ): OperationExecutionReview | null {
    if (this.runtimeLocks.has(reviewId)) {
      const caseItem = caseService.getCase(caseId);
      return caseItem?.operationExecutionReviews?.find(r => r.id === reviewId) || null;
    }

    this.runtimeLocks.add(reviewId);

    try {
      const caseItem = caseService.getCase(caseId);
      if (!caseItem || !caseItem.operationExecutionReviews) return null;

      const review = caseItem.operationExecutionReviews.find(r => r.id === reviewId);
      if (!review) return null;

      // Idempotency: if already completed, return review
      if (review.status === 'completed') {
        return review;
      }

      const readiness = this.evaluateOperationCompletionReadiness(review);

      // Validate critical blockers
      if (readiness !== 'ready_to_complete' && !options?.overrideWarnings) {
        if (readiness === 'unresolved_incidents') {
          review.errorMessage = 'Einsatz kann nicht abgeschlossen werden: Ungeklärte kritische Vorkommnisse vorhanden.';
          caseService.flushPersistence();
          return review;
        }

        if (readiness === 'missing_start_time' || readiness === 'missing_end_time') {
          review.errorMessage = 'Einsatz kann nicht abgeschlossen werden: Einsatzzeiten unvollständig.';
          caseService.flushPersistence();
          return review;
        }
      }

      const nowIso = new Date().toISOString();

      // Handle cases requiring follow-up / Nacharbeit
      if (options?.followUpRequired) {
        review.followUpRequired = true;
        review.followUpNotes = options.followUpNotes;
        review.status = 'completion_review';
        review.updatedAt = nowIso;
        review.errorMessage = undefined;

        // Keep case status as In Progress
        caseItem.status = 'In Progress';

        // Add task "Nacharbeit durchführen"
        if (!caseItem.tasks.some(t => t.title.includes('Nacharbeit durchführen') && t.status !== 'Completed')) {
          caseService.addTask(caseId, {
            title: 'Nacharbeit durchführen',
            description: `Offene Nacharbeiten zum Einsatz: ${options.followUpNotes || 'Keine Details angegeben'}`,
            category: 'Planning',
            priority: 'high',
            status: 'Open',
            source: 'OperationExecutionService',
            workflowId: `wf_followup_${review.id}`,
            caseId,
            referenceType: 'OPERATION_FOLLOW_UP',
            referenceId: review.id
          });
        }

        caseService.addTimelineEntry(caseId, {
          type: 'status_change',
          title: 'Einsatz erfordert Nacharbeit',
          description: `Einsatzbeendigung geprüft, Nacharbeit erforderlich: ${options.followUpNotes || 'Details in Einsatzprüfung'}`,
          category: 'Dispatch',
          source: 'OperationExecutionService',
          timestamp: nowIso,
          metadata: { reviewId: review.id, followUpNotes: options.followUpNotes }
        });

        caseService.evaluateCaseHealth(caseItem);
        caseService.flushPersistence();

        workflowEngine.emitEvent('OPERATION_FOLLOW_UP_REQUIRED', 'OperationExecutionService', {
          caseId,
          reviewId: review.id,
          followUpNotes: options.followUpNotes
        });

        return review;
      }

      // Successful controlled completion
      review.status = 'completed';
      review.completedAt = nowIso;
      review.confirmedBy = options?.confirmedBy || 'System/User';
      review.updatedAt = nowIso;
      review.errorMessage = undefined;

      // Complete execution task
      caseService.completeTaskByReference(caseId, 'OPERATION_CONFIRMATION', review.operationPreparationReviewId);
      caseService.completeTaskByTitlePattern(caseId, 'Einsatz durchführen');

      // Create next task: Prepare invoice draft (Rechnungsentwurf vorbereiten)
      if (!caseItem.tasks.some(t => t.title.includes('Rechnungsentwurf vorbereiten') && t.status !== 'Completed')) {
        caseService.addTask(caseId, {
          title: 'Rechnungsentwurf vorbereiten',
          description: 'Einsatz ist vollständig abgeschlossen. Rechnungsentwurf auf Basis der tatsächlichen Daten erstellen.',
          category: 'Invoice',
          priority: 'high',
          status: 'Open',
          source: 'OperationExecutionService',
          workflowId: `wf_inv_prep_${review.id}`,
          caseId,
          referenceType: 'INVOICE_PREPARATION',
          referenceId: review.id
        });
      }

      // Set Case Status to Completed
      caseItem.status = 'Completed';

      // Record insight in Learning Service
      learningService.saveInsight({
        caseId,
        workflowType: 'operation_execution',
        suggestedValue: {
          plannedData: review.plannedData
        },
        acceptedValue: {
          actualData: review.actualData,
          deviations: review.deviations,
          incidents: review.incidents,
          completedAt: nowIso
        },
        wasAccepted: true,
        timestamp: nowIso
      });

      // Add timeline entry
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        title: 'Einsatz erfolgreich abgeschlossen',
        description: 'Einsatzdurchführung wurde vollständig geprüft, bestätigt und abgeschlossen.',
        category: 'Dispatch',
        source: 'OperationExecutionService',
        timestamp: nowIso,
        metadata: { reviewId: review.id, confirmedBy: review.confirmedBy }
      });

      caseService.evaluateCaseHealth(caseItem);
      caseService.flushPersistence();

      workflowEngine.emitEvent('OPERATION_EXECUTION_COMPLETED', 'OperationExecutionService', {
        caseId,
        reviewId: review.id
      });

      // Automatically create initial editable InvoiceDraft from completed execution
      try {
        invoiceDraftService.createInvoiceDraftForCase(caseId, { reviewId: review.id });
      } catch (err) {
        console.error('Failed to create initial invoice draft:', err);
      }

      return review;
    } finally {
      this.runtimeLocks.delete(reviewId);
    }
  }

  /**
   * Cancels an operation execution with mandatory reason.
   */
  cancelOperationExecution(
    caseId: string,
    reviewId: string,
    reason: string
  ): OperationExecutionReview | null {
    if (this.runtimeLocks.has(reviewId)) {
      const caseItem = caseService.getCase(caseId);
      return caseItem?.operationExecutionReviews?.find(r => r.id === reviewId) || null;
    }

    this.runtimeLocks.add(reviewId);

    try {
      const caseItem = caseService.getCase(caseId);
      if (!caseItem || !caseItem.operationExecutionReviews) return null;

      const review = caseItem.operationExecutionReviews.find(r => r.id === reviewId);
      if (!review) return null;

      const nowIso = new Date().toISOString();
      review.status = 'cancelled';
      review.cancelReason = reason;
      review.updatedAt = nowIso;

      // Add task "Einsatzabbruch prüfen"
      caseService.addTask(caseId, {
        title: 'Einsatzabbruch prüfen',
        description: `Der Einsatz wurde abgebrochen. Grund: ${reason}`,
        category: 'Organization',
        priority: 'high',
        status: 'Open',
        source: 'OperationExecutionService',
        workflowId: `wf_cancel_${review.id}`,
        caseId,
        referenceType: 'OPERATION_CANCELLATION',
        referenceId: review.id
      });

      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        title: 'Einsatz abgebrochen',
        description: `Einsatz wurde abgebrochen. Grund: ${reason}`,
        category: 'Dispatch',
        source: 'OperationExecutionService',
        timestamp: nowIso,
        metadata: { reviewId: review.id, cancelReason: reason }
      });

      caseService.evaluateCaseHealth(caseItem);
      caseService.flushPersistence();

      workflowEngine.emitEvent('OPERATION_EXECUTION_CANCELLED', 'OperationExecutionService', {
        caseId,
        reviewId: review.id,
        reason
      });

      return review;
    } finally {
      this.runtimeLocks.delete(reviewId);
    }
  }
}

export const operationExecutionService = new OperationExecutionService();
