import { caseService, Case } from './case-service';
import { workflowEngine } from './workflow-engine';
import { learningService } from './learning-service';
import {
  DispatchReview,
  DispatchReadiness,
  DispatchReviewStatus,
  VehicleSuggestion,
  CrewSuggestion,
  DurationSuggestion,
  DispatchRisk,
  PlanningData,
  PlanningReview
} from './types';

export function evaluateDispatchReadiness(
  review: Partial<DispatchReview>,
  planningData?: PlanningData
): { readiness: DispatchReadiness; warnings: string[] } {
  const warnings: string[] = [];

  // Check missing information
  if (planningData) {
    if (!planningData.moveDate) {
      warnings.push('Umzugstermin fehlt in den Planungsdaten.');
    }
    if (!planningData.pickupAddress?.street || !planningData.pickupAddress?.city) {
      warnings.push('Abholadresse unvollständig.');
    }
    if (!planningData.destinationAddress?.street || !planningData.destinationAddress?.city) {
      warnings.push('Zieladresse unvollständig.');
    }
  }

  if (warnings.length > 0) {
    return { readiness: 'missing_information', warnings };
  }

  // Check missing resources
  const totalVehicles = (review.vehicleSuggestion || []).reduce((sum, v) => sum + (v.count || 0), 0);
  const totalCrew = (review.crewSuggestion || []).reduce((sum, c) => sum + (c.count || 0), 0);

  if (totalVehicles === 0) {
    warnings.push('Kein Fahrzeug zugewiesen oder vorgeschlagen.');
  }
  if (totalCrew === 0) {
    warnings.push('Kein Personal (Möbelpacker/Fahrer) zugewiesen oder vorgeschlagen.');
  }

  if (totalVehicles === 0 || totalCrew === 0) {
    return { readiness: 'missing_resources', warnings };
  }

  // Check conflicting information
  const hasPiano = planningData?.heavyItems?.piano;
  const hasSafe = planningData?.heavyItems?.safe;
  const vol = planningData?.estimatedVolumeM3 || 0;

  if ((hasPiano || hasSafe) && totalCrew < 3) {
    warnings.push('Schwergut (Klavier/Tresor) erfordert mindestens 3 Arbeitskräfte.');
    return { readiness: 'conflicting_information', warnings };
  }

  if (vol > 40 && totalVehicles === 1 && (review.vehicleSuggestion?.[0]?.vehicleType.includes('3,5t') || false)) {
    warnings.push('Ein 3,5t LKW reicht für über 40 m³ Volumen vermutlich nicht aus.');
    return { readiness: 'conflicting_information', warnings };
  }

  return { readiness: 'ready', warnings };
}

export function generateDispatchSuggestions(planningData?: PlanningData): {
  vehicles: VehicleSuggestion[];
  crew: CrewSuggestion[];
  duration: DurationSuggestion;
  risks: DispatchRisk[];
} {
  const vol = planningData?.estimatedVolumeM3 || 25;
  const pickupFloor = parseInt(planningData?.pickupAddress?.floor || '0', 10) || 0;
  const destFloor = parseInt(planningData?.destinationAddress?.floor || '0', 10) || 0;
  const pickupElevator = planningData?.pickupAddress?.elevator || false;
  const destElevator = planningData?.destinationAddress?.elevator || false;
  const hasPiano = planningData?.heavyItems?.piano || false;
  const hasSafe = planningData?.heavyItems?.safe || false;
  const assembly = planningData?.assemblyService || false;
  const packing = planningData?.packingService || false;
  const extElevator = planningData?.externalElevatorNeeded || false;
  const moveDate = planningData?.moveDate || '';

  // Vehicles
  const vehicles: VehicleSuggestion[] = [];
  if (vol > 30) {
    vehicles.push({
      id: 'v-7_5t',
      vehicleType: '7,5 Tonner LKW (36m³)',
      count: 1,
      reason: `Erforderlich für geschätztes Volumen von ${vol} m³`,
      recommended: true
    });
  } else {
    vehicles.push({
      id: 'v-3_5t',
      vehicleType: '3,5t Transporter (18m³)',
      count: vol > 18 ? 2 : 1,
      reason: `Passend für Volumen von ${vol} m³`,
      recommended: true
    });
  }

  if (extElevator) {
    vehicles.push({
      id: 'v-ext-elev',
      vehicleType: 'Außenaufzug-Fahrzeug',
      count: 1,
      reason: 'Außenaufzug vom Kunden / Planer angefordert',
      recommended: true
    });
  }

  // Crew
  const crew: CrewSuggestion[] = [];
  crew.push({
    id: 'c-driver',
    role: 'Fahrer',
    count: 1,
    reason: 'Erforderlich für Fahrzeugführung',
    recommended: true
  });

  let moverCount = 2;
  if (vol > 35 || (pickupFloor > 2 && !pickupElevator) || (destFloor > 2 && !destElevator)) {
    moverCount = 3;
  }
  if (hasPiano || hasSafe) {
    moverCount = Math.max(moverCount, 3);
  }

  crew.push({
    id: 'c-mover',
    role: 'Möbelpacker',
    count: moverCount,
    reason: `${moverCount} Möbelpacker empfohlen für ${vol} m³ Volumen`,
    recommended: true
  });

  if (assembly) {
    crew.push({
      id: 'c-assembly',
      role: 'Monteur',
      count: 1,
      reason: 'Montageservice angefordert',
      recommended: true
    });
  }

  if (hasPiano || hasSafe) {
    crew.push({
      id: 'c-heavy',
      role: 'Zusatzhelfer Schwergut',
      count: 1,
      reason: 'Spezialtragehilfe für Klavier/Tresor',
      recommended: true
    });
  }

  // Duration
  let estimatedHours = Math.max(4, Math.round(vol / 5));
  if (assembly) estimatedHours += 2;
  if (packing) estimatedHours += 2;

  const duration: DurationSuggestion = {
    estimatedHours,
    bufferHours: 1,
    reason: `Geschätzte Arbeitsdauer ca. ${estimatedHours} Std zzgl. 1 Std Pufferzeit`
  };

  // Risk Analysis
  const risks: DispatchRisk[] = [];

  if (pickupFloor > 2 && !pickupElevator) {
    risks.push({
      id: 'r-no-elev-pickup',
      code: 'NO_ELEVATOR_PICKUP',
      title: 'kein Aufzug (Abholung)',
      severity: 'high',
      description: `Abholung im ${pickupFloor}. OG ohne Treppenhaus-Aufzug.`,
      reason: 'Hohe körperliche Belastung, längere Ladezeit.'
    });
  }

  if (destFloor > 2 && !destElevator) {
    risks.push({
      id: 'r-no-elev-dest',
      code: 'NO_ELEVATOR_DEST',
      title: 'kein Aufzug (Ziel)',
      severity: 'high',
      description: `Entladung im ${destFloor}. OG ohne Aufzug.`,
      reason: 'Verzögerungen beim Entladen möglich.'
    });
  }

  if ((planningData?.pickupAddress?.walkingDistanceMeters || 0) > 20) {
    risks.push({
      id: 'r-long-walk',
      code: 'LONG_WALKING_DISTANCE',
      title: 'lange Laufwege',
      severity: 'medium',
      description: `Trageweg über ${planningData?.pickupAddress?.walkingDistanceMeters} Meter.`,
      reason: 'Längere Be- und Entladezeiten.'
    });
  }

  if (hasPiano) {
    risks.push({
      id: 'r-piano',
      code: 'HEAVY_PIANO',
      title: 'Klavier',
      severity: 'high',
      description: 'Schwerguttransport Klavier erfordert Spezialausrüstung.',
      reason: 'Erhöhtes Verletzungs- und Beschädigungsrisiko.'
    });
  }

  if (hasSafe) {
    risks.push({
      id: 'r-safe',
      code: 'HEAVY_SAFE',
      title: 'Tresor',
      severity: 'high',
      description: 'Schwerguttransport Tresor.',
      reason: 'Besondere Absicherung und Hebewerkzeuge nötig.'
    });
  }

  if (planningData?.pickupAddress?.parkingPermitNeeded || planningData?.destinationAddress?.parkingPermitNeeded) {
    risks.push({
      id: 'r-parking',
      code: 'PARKING_ISSUE',
      title: 'Parkproblem',
      severity: 'medium',
      description: 'Halteverbotszone erforderlich oder enges Parkumfeld.',
      reason: 'Rechtzeitiges Beantragen der Parkzone erforderlich.'
    });
  }

  if (moveDate) {
    const day = new Date(moveDate).getDay();
    if (day === 0 || day === 6) { // Saturday or Sunday
      risks.push({
        id: 'r-weekend',
        code: 'WEEKEND_RISK',
        title: 'Wochenende',
        severity: 'medium',
        description: 'Umzug am Wochenende.',
        reason: 'Mögliche Sonntagsfahrverbote oder erhöhte Personalzuschläge.'
      });
    }
  }

  return { vehicles, crew, duration, risks };
}

export class DispatchService {
  createDispatchReview(caseId: string, planningReviewId?: string): DispatchReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    caseItem.dispatchReviews = caseItem.dispatchReviews || [];

    // Idempotency: Check if an active review already exists
    const existing = caseItem.dispatchReviews.find(
      r => r.status === 'pending' || r.status === 'edited' || r.status === 'confirmed'
    );
    if (existing) {
      return existing;
    }

    // Find linked planning review
    let planningReview: PlanningReview | undefined;
    if (planningReviewId) {
      planningReview = caseItem.planningReviews?.find(p => p.id === planningReviewId);
    }
    if (!planningReview && caseItem.planningReviews && caseItem.planningReviews.length > 0) {
      planningReview = caseItem.planningReviews[caseItem.planningReviews.length - 1];
    }

    const planningData = planningReview?.planningData;
    const suggestions = generateDispatchSuggestions(planningData);

    const reviewId = `dispatch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const partialReview: Partial<DispatchReview> = {
      id: reviewId,
      caseId,
      planningReviewId: planningReview?.id || '',
      status: 'pending',
      vehicleSuggestion: suggestions.vehicles,
      crewSuggestion: suggestions.crew,
      durationSuggestion: suggestions.duration,
      riskAnalysis: suggestions.risks,
      createdAt: now,
      updatedAt: now
    };

    const evalRes = evaluateDispatchReadiness(partialReview, planningData);
    const newReview: DispatchReview = {
      ...partialReview,
      readiness: evalRes.readiness
    } as DispatchReview;

    caseItem.dispatchReviews.push(newReview);

    // Timeline entries (deduplicated)
    if (!caseItem.timeline) caseItem.timeline = [];
    if (!caseItem.timeline.some(t => t.title === 'Disposition erstellt')) {
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        category: 'Planning',
        title: 'Disposition erstellt',
        description: 'Dispositionsevaluierung für Ressourcen und Mannschaftsvorschläge angelegt.',
        source: 'DispatchService',
        timestamp: now
      });
    }

    if (newReview.readiness === 'missing_resources') {
      if (!caseItem.timeline.some(t => t.title === 'Ressourcen fehlen')) {
        caseService.addTimelineEntry(caseId, {
          type: 'status_change',
          category: 'Planning',
          title: 'Ressourcen fehlen',
          description: 'Fahrzeuge oder Mannschaftsressourcen noch unvollständig.',
          source: 'DispatchService',
          timestamp: now
        });
      }
    }

    if (newReview.riskAnalysis.length > 0) {
      if (!caseItem.timeline.some(t => t.title === 'Risiken erkannt')) {
        caseService.addTimelineEntry(caseId, {
          type: 'status_change',
          category: 'Planning',
          title: 'Risiken erkannt',
          description: `${newReview.riskAnalysis.length} Dispositionshinweise/Risiken identifiziert.`,
          source: 'DispatchService',
          timestamp: now
        });
      }
    }

    // Task synchronization
    const existingTask = caseItem.tasks.find(t => t.title === 'Disposition vorbereiten');
    if (!existingTask) {
      caseService.addTask(caseId, {
        caseId,
        workflowId: 'wf-dispatch',
        title: 'Disposition vorbereiten',
        description: 'Vorgeschlagene Disposition für Fahrzeuge und Personal prüfen und freigeben.',
        category: 'Planning',
        status: 'Open',
        priority: 'high',
        source: 'System'
      });
    } else if (existingTask.status === 'Completed') {
      existingTask.status = 'Open';
    }

    caseService.flushPersistence();

    workflowEngine.emitEvent('DISPATCH_REVIEW_CREATED', 'DispatchService', {
      caseId,
      dispatchReviewId: newReview.id
    });

    return newReview;
  }

  updateDispatchReview(
    caseId: string,
    reviewId: string,
    updates: Partial<DispatchReview>
  ): DispatchReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.dispatchReviews) return null;

    const review = caseItem.dispatchReviews.find(r => r.id === reviewId);
    if (!review) return null;

    const now = new Date().toISOString();

    // Log correction signal if resources or risks were changed
    if (updates.vehicleSuggestion || updates.crewSuggestion || updates.durationSuggestion || updates.riskAnalysis) {
      learningService.recordCorrection(`dispatch_${review.id}`, 'DISPATCH_EDIT', {
        caseId,
        updates,
        timestamp: now
      });
    }

    if (updates.vehicleSuggestion) review.vehicleSuggestion = updates.vehicleSuggestion;
    if (updates.crewSuggestion) review.crewSuggestion = updates.crewSuggestion;
    if (updates.durationSuggestion) review.durationSuggestion = updates.durationSuggestion;
    if (updates.riskAnalysis) review.riskAnalysis = updates.riskAnalysis;

    review.status = 'edited';
    review.updatedAt = now;

    // Get linked planning review to re-evaluate readiness
    const planningReview = caseItem.planningReviews?.find(p => p.id === review.planningReviewId);
    const evalRes = evaluateDispatchReadiness(review, planningReview?.planningData);
    review.readiness = evalRes.readiness;

    // Timeline entry
    if (!caseItem.timeline.some(t => t.title === 'Disposition geändert')) {
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        category: 'Planning',
        title: 'Disposition geändert',
        description: 'Dispositions- und Resourceneinstellungen wurden manuell angepasst.',
        source: 'DispatchService',
        timestamp: now
      });
    }

    caseService.flushPersistence();

    workflowEngine.emitEvent('DISPATCH_REVIEW_UPDATED', 'DispatchService', {
      caseId,
      dispatchReviewId: review.id
    });

    return review;
  }

  confirmDispatchReview(
    caseId: string,
    reviewId: string,
    updates?: Partial<DispatchReview>
  ): DispatchReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.dispatchReviews) return null;

    const review = caseItem.dispatchReviews.find(r => r.id === reviewId);
    if (!review) return null;

    // Already confirmed check
    if (review.status === 'confirmed' || review.status === 'completed') {
      return review;
    }

    if (updates) {
      this.updateDispatchReview(caseId, reviewId, updates);
    }

    const now = new Date().toISOString();
    review.status = 'confirmed';
    review.decidedAt = now;
    review.decidedBy = 'User';
    review.updatedAt = now;

    // Complete task 'Disposition vorbereiten'
    const dispTask = caseItem.tasks.find(t => t.title === 'Disposition vorbereiten');
    if (dispTask) {
      dispTask.status = 'Completed';
    }

    // Add task 'Kalender vorbereiten' (deduplicated)
    if (!caseItem.tasks.some(t => t.title === 'Kalender vorbereiten')) {
      caseService.addTask(caseId, {
        caseId,
        workflowId: 'wf-dispatch',
        title: 'Kalender vorbereiten',
        description: 'Bestätigte Disposition in die Kalender- und Tourenplanung überführen.',
        category: 'Planning',
        status: 'Open',
        priority: 'high',
        source: 'System'
      });
    }

    // Timeline entry (deduplicated)
    if (!caseItem.timeline.some(t => t.title === 'Disposition bestätigt')) {
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        category: 'Planning',
        title: 'Disposition bestätigt',
        description: 'Dispositionsentscheidung durch den Anwender bestätigt und freigegeben.',
        source: 'DispatchService',
        timestamp: now
      });
    }

    caseService.flushPersistence();

    workflowEngine.emitEvent('DISPATCH_REVIEW_CONFIRMED', 'DispatchService', {
      caseId,
      dispatchReviewId: review.id
    });

    return review;
  }
}

export const dispatchService = new DispatchService();
