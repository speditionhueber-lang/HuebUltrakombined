import { caseService } from './case-service';
import { workflowEngine } from './workflow-engine';
import { emailDraftService } from './email-draft-service';
import { crmLookupService } from './crm-lookup-service';
import {
  PlanningData,
  PlanningReadiness,
  PlanningReview,
  PlanningWarning,
  PlanningAddressData,
  RequestedInformationField
} from './types';

export function evaluatePlanningReadiness(planningData: PlanningData): { readiness: PlanningReadiness; warnings: PlanningWarning[] } {
  const warnings: PlanningWarning[] = [];

  // Check 1: Umzugstermin
  if (!planningData.moveDate || planningData.moveDate.trim() === '') {
    warnings.push({
      id: `warn-date-${Date.now()}`,
      code: 'MISSING_MOVE_DATE',
      message: 'Umzugstermin fehlt.',
      severity: 'high',
      field: 'moveDate'
    });
  }

  // Check 2: Abholadresse
  const pickup = planningData.pickupAddress;
  if (!pickup || (!pickup.street && !pickup.zip && !pickup.city)) {
    warnings.push({
      id: `warn-pickup-${Date.now()}`,
      code: 'MISSING_PICKUP_ADDRESS',
      message: 'Abholadresse fehlt oder ist unvollständig.',
      severity: 'high',
      field: 'pickupAddress'
    });
  } else {
    if (!pickup.floor && pickup.floor !== '0') {
      warnings.push({
        id: `warn-pickup-floor-${Date.now()}`,
        code: 'MISSING_PICKUP_FLOOR',
        message: 'Etage der Abholadresse fehlt.',
        severity: 'medium',
        field: 'pickupAddress.floor'
      });
    }
  }

  // Check 3: Zieladresse
  const dest = planningData.destinationAddress;
  if (!dest || (!dest.street && !dest.zip && !dest.city)) {
    warnings.push({
      id: `warn-dest-${Date.now()}`,
      code: 'MISSING_DESTINATION_ADDRESS',
      message: 'Zieladresse fehlt oder ist unvollständig.',
      severity: 'high',
      field: 'destinationAddress'
    });
  } else {
    if (!dest.floor && dest.floor !== '0') {
      warnings.push({
        id: `warn-dest-floor-${Date.now()}`,
        code: 'MISSING_DEST_FLOOR',
        message: 'Etage der Zieladresse fehlt.',
        severity: 'medium',
        field: 'destinationAddress.floor'
      });
    }
  }

  // Check 4: Geschätztes Volumen
  if (!planningData.estimatedVolumeM3 || planningData.estimatedVolumeM3 <= 0) {
    warnings.push({
      id: `warn-vol-${Date.now()}`,
      code: 'MISSING_VOLUME',
      message: 'Geschätztes Umzugsvolumen (m³) fehlt.',
      severity: 'medium',
      field: 'estimatedVolumeM3'
    });
  }

  // Conflict / Special checks:
  const pickupFloorNum = pickup?.floor ? parseInt(pickup.floor, 10) : 0;
  const destFloorNum = dest?.floor ? parseInt(dest.floor, 10) : 0;
  const hasHeavyItem = planningData.heavyItems?.piano || planningData.heavyItems?.safe || !!planningData.heavyItems?.otherHeavy;

  if (hasHeavyItem && ((pickupFloorNum >= 3 && !pickup?.elevator) || (destFloorNum >= 3 && !dest?.elevator))) {
    if (!planningData.externalElevatorNeeded) {
      warnings.push({
        id: `warn-conflict-elevator-${Date.now()}`,
        code: 'HEAVY_ITEM_HIGH_FLOOR_NO_ELEVATOR',
        message: 'Schwere Gegenstände im hohen Stockwerk ohne Aufzug – Außenaufzug erforderlich?',
        severity: 'high',
        field: 'externalElevatorNeeded'
      });
    }
  }

  // Long walking distance check
  if ((pickup?.walkingDistanceMeters && pickup.walkingDistanceMeters > 50 && !pickup.parkingPermitNeeded) ||
      (dest?.walkingDistanceMeters && dest.walkingDistanceMeters > 50 && !dest.parkingPermitNeeded)) {
    warnings.push({
      id: `warn-walking-dist-${Date.now()}`,
      code: 'LONG_WALKING_DISTANCE_NO_PERMIT',
      message: 'Langer Laufweg (>50m) ohne beantragte Halteverbotszone.',
      severity: 'medium',
      field: 'parkingPermitNeeded'
    });
  }

  const hasHighMissing = warnings.some(w => w.severity === 'high' && w.code.startsWith('MISSING_'));
  const hasHighConflict = warnings.some(w => w.severity === 'high' && !w.code.startsWith('MISSING_'));

  let readiness: PlanningReadiness = 'ready';
  if (hasHighMissing) {
    readiness = 'missing_information';
  } else if (hasHighConflict) {
    readiness = 'conflicting_information';
  } else if (warnings.some(w => w.severity === 'medium')) {
    if (warnings.some(w => w.code.startsWith('MISSING_'))) {
      readiness = 'missing_information';
    } else {
      readiness = 'ready';
    }
  }

  return { readiness, warnings };
}

export class PlanningService {
  public createPlanningReview(caseId: string, offerDraftId?: string): PlanningReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    caseItem.planningReviews = caseItem.planningReviews || [];

    // IDEMPOTENCY: Check if an active planning review already exists for this case
    const existingActive = caseItem.planningReviews.find(r => r.status === 'pending' || r.status === 'edited' || r.status === 'confirmed');
    if (existingActive) {
      return existingActive;
    }

    // Lookup offer draft if available
    const offerDraft = offerDraftId
      ? caseItem.offerDrafts?.find(o => o.id === offerDraftId)
      : caseItem.offerDrafts?.find(o => o.status === 'accepted' || o.status === 'sent') || caseItem.offerDrafts?.[caseItem.offerDrafts.length - 1];

    const customer = crmLookupService.findCustomerForCase(caseItem);

    // Build pickup address
    const pickupAddress: PlanningAddressData = {
      street: offerDraft?.pickupAddress?.street || customer?.abholadresse?.strasse || caseItem.customerDraft?.fields?.pickupAddress?.street?.value || undefined,
      zip: offerDraft?.pickupAddress?.zip || customer?.abholadresse?.plz || caseItem.customerDraft?.fields?.pickupAddress?.zip?.value || undefined,
      city: offerDraft?.pickupAddress?.city || customer?.abholadresse?.ort || caseItem.customerDraft?.fields?.pickupAddress?.city?.value || undefined,
      floor: offerDraft?.pickupAddress?.floor !== undefined ? String(offerDraft.pickupAddress.floor) : (customer?.abholadresse?.stockwerk !== undefined ? String(customer.abholadresse.stockwerk) : undefined),
      elevator: offerDraft?.pickupAddress?.elevator === 'Ja' || customer?.abholadresse?.aufzug === 'Ja',
      walkingDistanceMeters: offerDraft?.pickupAddress?.distanceTruck || 15,
      parkingPermitNeeded: offerDraft?.items?.some(i => i.category === 'Halteverbotszone') || false
    };

    // Build destination address
    const destinationAddress: PlanningAddressData = {
      street: offerDraft?.destinationAddress?.street || customer?.zieladresse?.strasse || caseItem.customerDraft?.fields?.destinationAddress?.street?.value || undefined,
      zip: offerDraft?.destinationAddress?.zip || customer?.zieladresse?.plz || caseItem.customerDraft?.fields?.destinationAddress?.zip?.value || undefined,
      city: offerDraft?.destinationAddress?.city || customer?.zieladresse?.ort || caseItem.customerDraft?.fields?.destinationAddress?.city?.value || undefined,
      floor: offerDraft?.destinationAddress?.floor !== undefined ? String(offerDraft.destinationAddress.floor) : (customer?.zieladresse?.stockwerk !== undefined ? String(customer.zieladresse.stockwerk) : undefined),
      elevator: offerDraft?.destinationAddress?.elevator === 'Ja' || customer?.zieladresse?.aufzug === 'Ja',
      walkingDistanceMeters: offerDraft?.destinationAddress?.distanceTruck || 15,
      parkingPermitNeeded: offerDraft?.items?.some(i => i.category === 'Halteverbotszone') || false
    };

    const moveDate = offerDraft?.moveDate || customer?.umzugsdetails?.gewuenschterUmzugstermin || caseItem.customerDraft?.fields?.moveDate?.value || undefined;
    const estimatedVolumeM3 = offerDraft?.totalM3 || (customer?.umzugsdetails?.umzugsgroesse ? parseFloat(customer.umzugsdetails.umzugsgroesse) : undefined) || 25;
    const assemblyService = offerDraft?.items?.some(i => i.category === 'Montage') || false;
    const packingService = offerDraft?.items?.some(i => i.category === 'Verpackung') || false;
    const heavyItems = {
      piano: offerDraft?.items?.some(i => i.description.toLowerCase().includes('klavier')) || false,
      safe: offerDraft?.items?.some(i => i.description.toLowerCase().includes('tresor')) || false
    };
    const externalElevatorNeeded = offerDraft?.items?.some(i => i.description.toLowerCase().includes('außenaufzug') || i.description.toLowerCase().includes('aussenaufzug')) || false;
    const specialNotes = offerDraft?.notes || caseItem.notes || undefined;

    const planningData: PlanningData = {
      moveDate,
      timeWindow: '08:00 - 12:00 Uhr',
      pickupAddress,
      destinationAddress,
      estimatedVolumeM3,
      assemblyService,
      packingService,
      heavyItems,
      externalElevatorNeeded,
      specialNotes
    };

    const { readiness, warnings } = evaluatePlanningReadiness(planningData);

    const review: PlanningReview = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      caseId,
      customerId: caseItem.customerId || customer?.id || '',
      offerDraftId: offerDraft?.id || '',
      status: 'pending',
      planningData,
      warnings,
      readiness,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    caseItem.planningReviews.push(review);
    caseItem.status = 'Planning';

    // Tasks deduplication
    caseService.completeTaskByTitlePattern(caseId, 'Auf Angebotsbestätigung warten');
    
    const existingTask = caseItem.tasks.find(t => t.title === 'Auftrag planen' && t.status !== 'Completed');
    if (!existingTask) {
      caseService.addTask(caseId, {
        title: 'Auftrag planen',
        description: 'Auftragsdetails für die spätere Disposition prüfen und bestätigen.',
        category: 'Planning',
        status: 'Open',
        priority: 'high',
        source: 'System',
        workflowId: 'planning-review-creation',
        caseId,
        referenceType: 'PLANNING_REVIEW',
        referenceId: review.id
      });
    }

    // Timeline entry deduplication
    const tlTitle = 'Planung vorbereitet';
    if (!caseItem.timeline.some(t => t.title === tlTitle)) {
      caseService.addTimelineEntry(caseId, {
        type: 'PLANNING_REVIEW_CREATED',
        category: 'Planning',
        title: tlTitle,
        description: 'Auftragsdaten für Disposition und Tourenplanung evaluiert.',
        source: 'PlanningService',
        timestamp: new Date().toISOString()
      });
    }

    caseService.flushPersistence();

    workflowEngine.emitEvent('PLANNING_REVIEW_CREATED', 'PlanningService', {
      caseId,
      planningReviewId: review.id,
      readiness
    });

    return review;
  }

  public updatePlanningData(caseId: string, reviewId: string, updatedData: Partial<PlanningData>): PlanningReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.planningReviews) return null;

    const review = caseItem.planningReviews.find(r => r.id === reviewId);
    if (!review) return null;

    review.planningData = {
      ...review.planningData,
      ...updatedData,
      pickupAddress: {
        ...review.planningData.pickupAddress,
        ...updatedData.pickupAddress
      },
      destinationAddress: {
        ...review.planningData.destinationAddress,
        ...updatedData.destinationAddress
      },
      heavyItems: {
        ...review.planningData.heavyItems,
        ...updatedData.heavyItems
      }
    };

    const { readiness, warnings } = evaluatePlanningReadiness(review.planningData);
    review.readiness = readiness;
    review.warnings = warnings;
    review.status = 'edited';
    review.updatedAt = new Date().toISOString();

    const tlTitle = 'Planungsdaten aktualisiert';
    if (!caseItem.timeline.some(t => t.title === tlTitle && Math.abs(new Date(t.timestamp).getTime() - Date.now()) < 5000)) {
      caseService.addTimelineEntry(caseId, {
        type: 'PLANNING_REVIEW_UPDATED',
        category: 'Planning',
        title: tlTitle,
        description: 'Die Planungsdaten wurden vom Benutzer angepasst.',
        source: 'PlanningService',
        timestamp: new Date().toISOString()
      });
    }

    caseService.flushPersistence();

    workflowEngine.emitEvent('PLANNING_REVIEW_UPDATED', 'PlanningService', {
      caseId,
      planningReviewId: review.id
    });

    return review;
  }

  public confirmPlanningReview(caseId: string, reviewId: string, updatedData?: Partial<PlanningData>): PlanningReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.planningReviews) return null;

    const review = caseItem.planningReviews.find(r => r.id === reviewId);
    if (!review) return null;

    // Idempotency: confirmed reviews cannot be confirmed again
    if (review.status === 'confirmed' || review.status === 'completed') {
      return review;
    }

    if (updatedData) {
      review.planningData = {
        ...review.planningData,
        ...updatedData
      };
      const { readiness, warnings } = evaluatePlanningReadiness(review.planningData);
      review.readiness = readiness;
      review.warnings = warnings;
    }

    review.status = 'confirmed';
    review.decidedAt = new Date().toISOString();
    review.updatedAt = new Date().toISOString();

    // Complete task "Auftrag planen"
    caseService.completeTaskByTitlePattern(caseId, 'Auftrag planen');

    // Add task "Disposition vorbereiten"
    const existingDispTask = caseItem.tasks.find(t => t.title === 'Disposition vorbereiten' && t.status !== 'Completed');
    if (!existingDispTask) {
      caseService.addTask(caseId, {
        title: 'Disposition vorbereiten',
        description: 'Bestätigte Auftragsdaten für Fahrzeugintegration und Tourenplanung vorbereiten.',
        category: 'Planning',
        status: 'Open',
        priority: 'high',
        source: 'System',
        workflowId: 'planning-review-confirmation',
        caseId,
        referenceType: 'DISPOSITION_PREPARATION',
        referenceId: review.id
      });
    }

    // Timeline entry exactly once
    const tlTitle = 'Planung bestätigt';
    if (!caseItem.timeline.some(t => t.title === tlTitle)) {
      caseService.addTimelineEntry(caseId, {
        type: 'PLANNING_REVIEW_CONFIRMED',
        category: 'Planning',
        title: tlTitle,
        description: 'Auftragsdaten erfolgreich bestätigt und für die Disposition freigegeben.',
        source: 'PlanningService',
        timestamp: new Date().toISOString()
      });
    }

    caseService.flushPersistence();

    workflowEngine.emitEvent('PLANNING_REVIEW_CONFIRMED', 'PlanningService', {
      caseId,
      planningReviewId: review.id
    });

    return review;
  }

  public async requestMissingInformation(caseId: string, reviewId: string): Promise<any> {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.planningReviews) return null;

    const review = caseItem.planningReviews.find(r => r.id === reviewId);
    if (!review) return null;

    const requestedFields: RequestedInformationField[] = review.warnings.map(w => ({
      field: w.field || w.code,
      label: w.message,
      reason: 'Zur korrekten Planung und Disposition erforderlich.',
      required: true
    }));

    const draft = await emailDraftService.createDraftForCase(caseId, {
      purpose: 'request_missing_information',
      requestedFields
    });

    if (!caseItem.timeline.some(t => t.title === 'Fehlende Informationen erkannt')) {
      caseService.addTimelineEntry(caseId, {
        type: 'PLANNING_REVIEW_UPDATED',
        category: 'Planning',
        title: 'Fehlende Informationen erkannt',
        description: `${review.warnings.length} unvollständige oder widersprüchliche Angaben identifiziert.`,
        source: 'PlanningService',
        timestamp: new Date().toISOString()
      });
    }

    if (!caseItem.timeline.some(t => t.title === 'Rückfrage vorbereitet')) {
      caseService.addTimelineEntry(caseId, {
        type: 'EMAIL_RESPONSE_DRAFT_CREATED',
        category: 'Communication',
        title: 'Rückfrage vorbereitet',
        description: 'E-Mail-Antwortentwurf für fehlende Umzugsdetails erstellt.',
        source: 'PlanningService',
        timestamp: new Date().toISOString()
      });
    }

    caseService.flushPersistence();
    return draft;
  }
}

export const planningService = new PlanningService();
