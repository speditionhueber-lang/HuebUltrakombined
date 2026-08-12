import { caseService, Case } from './case-service';
import { workflowEngine } from './workflow-engine';
import { learningService } from './learning-service';
import { companyData } from './company-data';
import { crmLookupService } from './crm-lookup-service';
import {
  TourPlanningReview,
  TourRoute,
  TourStop,
  TourAddressSnapshot,
  TourPlanningReadiness,
  TourPlanningWarning,
  TourRisk,
  CalendarPlanningReview,
  RouteBreakdown,
  Customer
} from './types';

// Time utility functions
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10) || 0);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const norm = Math.max(0, minutes) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const mins = timeToMinutes(timeStr);
  return minutesToTime(mins + minutesToAdd);
}

// Pure function to evaluate tour planning readiness
export function evaluateTourPlanningReadiness(
  review: Partial<TourPlanningReview>,
  calendarReview?: CalendarPlanningReview,
  caseItem?: Case
): {
  readiness: TourPlanningReadiness;
  warnings: TourPlanningWarning[];
} {
  const warnings: TourPlanningWarning[] = [];

  // Check if calendar review exists
  if (!calendarReview && (!review.calendarPlanningReviewId || review.calendarPlanningReviewId === '')) {
    warnings.push({
      id: 'warn_no_calendar',
      code: 'NO_CALENDAR_REVIEW',
      message: 'Keine verknüpfte Kalenderplanung vorhanden',
      severity: 'high'
    });
  }

  // Check vehicle
  if (!review.vehicleId || review.vehicleId.trim() === '') {
    warnings.push({
      id: 'warn_no_vehicle',
      code: 'MISSING_VEHICLE',
      message: 'Kein Fahrzeug ausgewählt',
      severity: 'high'
    });
  }

  // Check Depot address
  const depotStart = review.route?.depotStart;
  if (!depotStart || !depotStart.address || (!depotStart.address.street && !depotStart.address.city)) {
    warnings.push({
      id: 'warn_no_depot',
      code: 'MISSING_DEPOT',
      message: 'Keine vollständige Depotadresse vorhanden',
      severity: 'high'
    });
    return { readiness: 'missing_depot', warnings };
  }

  // Check Pickup address
  const stops = review.route?.stops || [];
  const pickupStop = stops.find(s => s.type === 'pickup');
  if (!pickupStop || !pickupStop.address || (!pickupStop.address.street && !pickupStop.address.city)) {
    warnings.push({
      id: 'warn_no_pickup',
      code: 'MISSING_PICKUP',
      message: 'Keine vollständige Abholadresse vorhanden',
      severity: 'high'
    });
    return { readiness: 'missing_pickup', warnings };
  }

  // Check Destination address
  const destStop = stops.find(s => s.type === 'destination');
  if (!destStop || !destStop.address || (!destStop.address.street && !destStop.address.city)) {
    warnings.push({
      id: 'warn_no_dest',
      code: 'MISSING_DESTINATION',
      message: 'Keine vollständige Zieladresse vorhanden',
      severity: 'high'
    });
    return { readiness: 'missing_destination', warnings };
  }

  // Check invalid address (identical pickup & destination without intermediate stops)
  const pickupStr = (pickupStop.address.street || '').trim().toLowerCase();
  const destStr = (destStop.address.street || '').trim().toLowerCase();
  const pickupCity = (pickupStop.address.city || '').trim().toLowerCase();
  const destCity = (destStop.address.city || '').trim().toLowerCase();
  
  if (pickupStr !== '' && pickupStr === destStr && pickupCity === destCity && stops.length <= 2) {
    warnings.push({
      id: 'warn_invalid_addr',
      code: 'INVALID_ADDRESS',
      message: 'Abhol- und Zieladresse dürfen nicht identisch sein',
      severity: 'high'
    });
    return { readiness: 'invalid_address', warnings };
  }

  // Check missing vehicle
  if (!review.vehicleId || review.vehicleId.trim() === '') {
    return { readiness: 'incomplete_information', warnings };
  }

  // Check missing route
  if (!review.route || review.route.totalDistanceKm <= 0) {
    warnings.push({
      id: 'warn_no_route',
      code: 'MISSING_ROUTE',
      message: 'Keine gültige Route oder Distanz berechnet',
      severity: 'high'
    });
    return { readiness: 'missing_route', warnings };
  }

  // Check schedule conflict
  if (review.route && calendarReview?.proposedSchedule) {
    const scheduledDurationMins = calendarReview.proposedSchedule.estimatedDurationMinutes || 300;
    const totalPlannedMins = review.route.totalPlannedMinutes || 0;
    if (totalPlannedMins > scheduledDurationMins) {
      warnings.push({
        id: 'warn_schedule_conflict',
        code: 'SCHEDULE_CONFLICT',
        message: `Geplante Tourenzeit (${totalPlannedMins} Min) überschreitet das Kalenderzeitfenster (${scheduledDurationMins} Min)`,
        severity: 'high'
      });
      return { readiness: 'conflicting_schedule', warnings };
    }
  }

  // Check blocked (another active confirmed review for this case)
  if (caseItem && caseItem.tourPlanningReviews) {
    const activeConfirmed = caseItem.tourPlanningReviews.find(
      r => r.id !== review.id && r.status === 'confirmed'
    );
    if (activeConfirmed) {
      warnings.push({
        id: 'warn_blocked',
        code: 'BLOCKED',
        message: 'Ein anderer Tourenplan ist bereits für diesen Vorgang bestätigt',
        severity: 'high'
      });
      return { readiness: 'blocked', warnings };
    }
  }

  return { readiness: 'ready', warnings };
}

// Evaluate Tour Risks
export function evaluateTourRisks(
  route: TourRoute,
  review: Partial<TourPlanningReview>,
  calendarReview?: CalendarPlanningReview
): TourRisk[] {
  const risks: TourRisk[] = [];
  const existingAcknowledged = new Set(
    (review.risks || []).filter(r => r.acknowledged).map(r => r.type)
  );

  // 1. Long distance
  if (route.totalDistanceKm > 300) {
    risks.push({
      id: `risk_long_dist_${route.totalDistanceKm}`,
      type: 'long_distance',
      severity: 'high',
      title: 'Lange Gesamtstrecke',
      description: `Sehr lange Fahrstrecke von ${route.totalDistanceKm} km`,
      reason: 'Gesetzliche Lenk- und Ruhezeiten sowie Fahrerwechsel beachten',
      acknowledged: existingAcknowledged.has('long_distance')
    });
  }

  // 2. Schedule conflict / tight schedule
  const scheduledDurationMins = calendarReview?.proposedSchedule?.estimatedDurationMinutes || 300;
  if (route.totalPlannedMinutes > scheduledDurationMins) {
    risks.push({
      id: 'risk_tight_sched',
      type: 'tight_schedule',
      severity: 'high',
      title: 'Enge Zeitplanung / Kalenderüberschreitung',
      description: `Tourdauer (${Math.round(route.totalPlannedMinutes / 60)} Std) überschreitet Kalenderfenster (${Math.round(scheduledDurationMins / 60)} Std)`,
      reason: 'Kalendereintrag prüfen oder Einsatzdauer anpassen',
      acknowledged: existingAcknowledged.has('tight_schedule')
    });
  }

  // 3. Multiple stops
  if (route.stops.length > 2) {
    risks.push({
      id: `risk_multi_stop_${route.stops.length}`,
      type: 'multiple_stops',
      severity: 'medium',
      title: 'Mehrere Zwischenstopps',
      description: `Tour enthält ${route.stops.length} Stopps (inkl. Zwischenstopps)`,
      reason: 'Zusätzlicher Zeitaufwand für Anfahrt und Koordination',
      acknowledged: existingAcknowledged.has('multiple_stops')
    });
  }

  // 4. Toll
  if (route.totalDistanceKm > 50) {
    risks.push({
      id: 'risk_toll',
      type: 'toll',
      severity: 'low',
      title: 'Mautstrecke wahrscheinlich',
      description: 'Streckenführung über Autobahnen / Schnellstraßen',
      reason: 'Vignette / GO-Box / Streckenmaut bereithalten',
      acknowledged: existingAcknowledged.has('toll')
    });
  }

  // 5. Border
  const pickupCountry = route.stops.find(s => s.type === 'pickup')?.address?.country || 'Österreich';
  const destCountry = route.stops.find(s => s.type === 'destination')?.address?.country || 'Österreich';
  if (pickupCountry !== destCountry || (pickupCountry !== 'Österreich' && pickupCountry !== 'AT')) {
    risks.push({
      id: 'risk_border',
      type: 'border',
      severity: 'medium',
      title: 'Möglicher Grenzübertritt',
      description: `Fahrt zwischen ${pickupCountry} und ${destCountry}`,
      reason: 'Grenzformalitäten, Maut- und Frachtdokumente prüfen',
      acknowledged: existingAcknowledged.has('border')
    });
  }

  // 6. Parking / Access
  const pickupStop = route.stops.find(s => s.type === 'pickup');
  const destStop = route.stops.find(s => s.type === 'destination');
  const pickupFloor = parseInt(pickupStop?.address?.floor || '0', 10);
  const destFloor = parseInt(destStop?.address?.floor || '0', 10);
  if ((pickupFloor > 2 && !pickupStop?.address?.elevator) || (destFloor > 2 && !destStop?.address?.elevator)) {
    risks.push({
      id: 'risk_parking_access',
      type: 'parking',
      severity: 'medium',
      title: 'Parksituation / Halteverbot',
      description: 'Hohes Stockwerk ohne Aufzug an Be- oder Entladeadresse',
      reason: 'Längere Laufwege und Halteverbotszone erforderlich',
      acknowledged: existingAcknowledged.has('parking')
    });
  }

  // 7. Outside working hours
  const depotReturnTime = route.depotReturn?.plannedArrivalTime || '18:00';
  if (timeToMinutes(depotReturnTime) > timeToMinutes('18:30')) {
    risks.push({
      id: 'risk_working_hours',
      type: 'other',
      severity: 'medium',
      title: 'Rückkehr außerhalb Arbeitszeit',
      description: `Voraussichtliche Rückkehr am Betrieb erst um ${depotReturnTime} Uhr`,
      reason: 'Spätschicht oder Überstunden einkalkulieren',
      acknowledged: existingAcknowledged.has('other')
    });
  }

  // 8. Tight buffer
  if (route.bufferMinutes < 30 && route.totalDistanceKm > 100) {
    risks.push({
      id: 'risk_tight_buffer',
      type: 'tight_schedule',
      severity: 'low',
      title: 'Geringer Zeitpuffer',
      description: `Zeitpuffer beträgt nur ${route.bufferMinutes} Minuten bei ${route.totalDistanceKm} km`,
      reason: 'Geringe Reserve bei Verkehrsverzögerungen',
      acknowledged: existingAcknowledged.has('tight_schedule')
    });
  }

  return risks;
}

export class TourPlanningService {
  private runtimeLocks = new Set<string>();

  // Create Tour Planning Review from Calendar Planning
  createTourPlanningReview(caseId: string, calendarPlanningReviewId?: string): TourPlanningReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    // Idempotency check: Return existing pending/edited/confirmed review if present
    if (!caseItem.tourPlanningReviews) {
      caseItem.tourPlanningReviews = [];
    }

    const existingReview = caseItem.tourPlanningReviews.find(
      r => r.status === 'pending' || r.status === 'edited' || r.status === 'confirmed'
    );

    if (existingReview) {
      return existingReview;
    }

    // Find calendar planning review
    const calendarReview = calendarPlanningReviewId
      ? caseItem.calendarPlanningReviews?.find(c => c.id === calendarPlanningReviewId)
      : caseItem.calendarPlanningReviews?.[caseItem.calendarPlanningReviews.length - 1];

    const dispatchReview = caseItem.dispatchReviews?.[caseItem.dispatchReviews.length - 1];
    const planningReview = caseItem.planningReviews?.[caseItem.planningReviews.length - 1];
    const customer = caseItem.customerId ? crmLookupService.findCustomerForCase(caseItem) : undefined;

    // Vehicle
    const vehicleId = calendarReview?.selectedVehicleId || 'v-3_5t';

    // Build Stops
    const depotAddress: TourAddressSnapshot = {
      street: companyData.street,
      zip: companyData.zip,
      city: companyData.city,
      country: companyData.country || 'Österreich'
    };

    const depotStartStop: TourStop = {
      id: `stop_depot_start_${Date.now()}`,
      type: 'depot_start',
      order: 1,
      label: `Betrieb: ${companyData.name}`,
      address: depotAddress,
      estimatedServiceMinutes: 30, // Preparation
      source: 'company'
    };

    // Pickup Stop
    const pickupRaw: any = calendarReview?.proposedSchedule?.pickupAddress || planningReview?.planningData?.pickupAddress;
    const pickupAddress: TourAddressSnapshot = {
      street: pickupRaw?.street || customer?.abholadresse?.strasse || customer?.address?.street || 'Musterstraße 1',
      zip: pickupRaw?.zip || customer?.abholadresse?.plz || customer?.address?.zip || '6020',
      city: pickupRaw?.city || customer?.abholadresse?.ort || customer?.address?.city || 'Innsbruck',
      country: 'Österreich',
      floor: pickupRaw?.floor || customer?.abholadresse?.stockwerk || '0',
      elevator: pickupRaw?.elevator ?? (customer?.abholadresse?.aufzug === 'Ja')
    };

    const pickupStop: TourStop = {
      id: `stop_pickup_${Date.now()}`,
      type: 'pickup',
      order: 2,
      label: `Abholung: ${pickupAddress.street}, ${pickupAddress.city}`,
      address: pickupAddress,
      estimatedServiceMinutes: calendarReview?.proposedSchedule?.loadingMinutes || 120,
      source: 'customer'
    };

    // Intermediate stops (Zusätzliche Adressen)
    const extraAddressList: string[] = [];
    if (customer?.zusatzoptionen?.adresseNr1) extraAddressList.push(customer.zusatzoptionen.adresseNr1);
    if (customer?.zusatzoptionen?.adresseNr2) extraAddressList.push(customer.zusatzoptionen.adresseNr2);
    if (customer?.zusatzoptionen?.adresseNr3) extraAddressList.push(customer.zusatzoptionen.adresseNr3);
    if (customer?.zusatzoptionen?.adresseNr4) extraAddressList.push(customer.zusatzoptionen.adresseNr4);
    if (customer?.zusatzoptionen?.weitereAdressen) extraAddressList.push(customer.zusatzoptionen.weitereAdressen);

    // Filter duplicates / empty
    const uniqueExtraStrList = Array.from(new Set(
      extraAddressList.map(s => s.trim()).filter(s => s.length > 0)
    ));

    const intermediateStops: TourStop[] = uniqueExtraStrList.map((addrStr, idx) => ({
      id: `stop_inter_${Date.now()}_${idx}`,
      type: 'intermediate',
      order: 3 + idx,
      label: `Zwischenstopp: ${addrStr}`,
      address: {
        street: addrStr,
        city: pickupAddress.city || 'Innsbruck',
        country: 'Österreich'
      },
      estimatedServiceMinutes: 30,
      source: 'customer'
    }));

    // Destination Stop
    const destRaw: any = calendarReview?.proposedSchedule?.destinationAddress || planningReview?.planningData?.destinationAddress;
    const destAddress: TourAddressSnapshot = {
      street: destRaw?.street || customer?.zieladresse?.strasse || 'Beispielweg 4',
      zip: destRaw?.zip || customer?.zieladresse?.plz || '1010',
      city: destRaw?.city || customer?.zieladresse?.ort || 'Wien',
      country: 'Österreich',
      floor: destRaw?.floor || customer?.zieladresse?.stockwerk || '0',
      elevator: destRaw?.elevator ?? (customer?.zieladresse?.aufzug === 'Ja')
    };

    const destOrder = 3 + intermediateStops.length;
    const destinationStop: TourStop = {
      id: `stop_dest_${Date.now()}`,
      type: 'destination',
      order: destOrder,
      label: `Entladung: ${destAddress.street}, ${destAddress.city}`,
      address: destAddress,
      estimatedServiceMinutes: calendarReview?.proposedSchedule?.unloadingMinutes || 90,
      source: 'customer'
    };

    // Depot Return Stop
    const depotReturnStop: TourStop = {
      id: `stop_depot_return_${Date.now()}`,
      type: 'depot_return',
      order: destOrder + 1,
      label: `Rückfahrt Betrieb: ${companyData.city}`,
      address: depotAddress,
      estimatedServiceMinutes: 15,
      source: 'company'
    };

    const stopsList = [pickupStop, ...intermediateStops, destinationStop];

    // Single Source of Truth for Route Breakdown
    const routeBreakdown: RouteBreakdown | undefined = customer?.routeBreakdown;
    let totalKm = routeBreakdown?.totalKm || 50;
    let depotToPickupKm = routeBreakdown?.depotToPickup || 15;
    let pickupToDestKm = routeBreakdown?.pickupToDest || 20;
    let destToDepotKm = routeBreakdown?.destToDepot || 15;
    let routeSource: 'existing_route_breakdown' | 'routing_api' | 'manual' | 'fallback' =
      routeBreakdown ? 'existing_route_breakdown' : 'fallback';

    // Navigation URL
    const waypoints = [
      `${pickupAddress.street}, ${pickupAddress.city}`,
      ...intermediateStops.map(s => s.address.street!),
      `${destAddress.street}, ${destAddress.city}`
    ].map(w => encodeURIComponent(w)).join('%7C');

    const depotStr = `${companyData.street}, ${companyData.city}`;
    const navigationUrl = routeBreakdown?.googleMapsUrl ||
      `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(depotStr)}&destination=${encodeURIComponent(depotStr)}&waypoints=${waypoints}`;

    // Calculate Driving Times & Job Times
    const totalDrivingMinutes = Math.max(20, Math.round((totalKm / 50) * 60)); // ~50 km/h avg
    const estimatedJobMinutes = stopsList.reduce((acc, s) => acc + s.estimatedServiceMinutes, 0) + depotStartStop.estimatedServiceMinutes;
    const bufferMinutes = calendarReview?.proposedSchedule?.bufferMinutes || (totalKm > 100 ? 60 : 30);
    const totalPlannedMinutes = totalDrivingMinutes + estimatedJobMinutes + bufferMinutes;

    // Time schedule calculations
    const prepStart = calendarReview?.proposedSchedule?.preparationStartTime || '07:30';
    depotStartStop.plannedDepartureTime = prepStart;
    
    const pickupArrival = addMinutesToTime(prepStart, Math.round((depotToPickupKm / 50) * 60) + depotStartStop.estimatedServiceMinutes);
    pickupStop.plannedArrivalTime = pickupArrival;
    pickupStop.plannedDepartureTime = addMinutesToTime(pickupArrival, pickupStop.estimatedServiceMinutes);

    // Intermediate stops
    let lastDeparture = pickupStop.plannedDepartureTime;
    intermediateStops.forEach((stop) => {
      const arr = addMinutesToTime(lastDeparture, 15);
      stop.plannedArrivalTime = arr;
      stop.plannedDepartureTime = addMinutesToTime(arr, stop.estimatedServiceMinutes);
      lastDeparture = stop.plannedDepartureTime;
    });

    // Destination stop
    const destArrival = addMinutesToTime(lastDeparture, Math.round((pickupToDestKm / 50) * 60));
    destinationStop.plannedArrivalTime = destArrival;
    destinationStop.plannedDepartureTime = addMinutesToTime(destArrival, destinationStop.estimatedServiceMinutes);

    // Depot return stop
    const depotReturnArrival = addMinutesToTime(destinationStop.plannedDepartureTime, Math.round((destToDepotKm / 50) * 60) + bufferMinutes);
    depotReturnStop.plannedArrivalTime = depotReturnArrival;

    const route: TourRoute = {
      depotStart: depotStartStop,
      stops: stopsList,
      depotReturn: depotReturnStop,
      totalDistanceKm: totalKm,
      totalDrivingMinutes,
      estimatedJobMinutes,
      totalPlannedMinutes,
      bufferMinutes,
      tollEstimate: totalKm > 100 ? Math.round(totalKm * 0.15) : 0,
      routeSource,
      navigationUrl,
      calculatedAt: new Date().toISOString()
    };

    const reviewId = `tpr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const partialReview: Partial<TourPlanningReview> = {
      id: reviewId,
      caseId,
      calendarPlanningReviewId: calendarReview?.id || '',
      calendarEventId: calendarReview?.calendarEventId,
      status: 'pending',
      vehicleId,
      route
    };

    const evalRes = evaluateTourPlanningReadiness(partialReview, calendarReview, caseItem);
    const risks = evaluateTourRisks(route, partialReview, calendarReview);

    const review: TourPlanningReview = {
      id: reviewId,
      caseId,
      calendarPlanningReviewId: calendarReview?.id || '',
      calendarEventId: calendarReview?.calendarEventId,
      status: 'pending',
      vehicleId,
      route,
      readiness: evalRes.readiness,
      warnings: evalRes.warnings,
      risks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    caseItem.tourPlanningReviews.push(review);

    // Add Task "Tour vorbereiten"
    caseService.addTask(caseId, {
      title: 'Tour vorbereiten',
      description: 'Streckenführung, Be- und Entladezeiten sowie Puffer prüfen und bestätigen',
      category: 'Planning',
      priority: 'medium',
      status: 'Open',
      source: 'TourPlanningService',
      workflowId: `wf_tour_${reviewId}`,
      caseId,
      referenceType: 'TOUR_PLANNING_REVIEW',
      referenceId: review.id
    });

    // Add Timeline entry
    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Tourenvorschlag erstellt',
      description: `Tour mit ${route.totalDistanceKm} km (${route.totalDrivingMinutes} Min Fahrzeit) vorbereitet.`,
      category: 'Planning',
      source: 'TourPlanningService',
      timestamp: new Date().toISOString(),
      metadata: { reviewId: review.id }
    });

    caseService.flushPersistence();

    workflowEngine.emitEvent('TOUR_PLANNING_REVIEW_CREATED', 'TourPlanningService', {
      caseId,
      reviewId: review.id,
      readiness: review.readiness
    });

    return review;
  }

  // Update Tour Planning Review
  updateTourPlanningReview(
    caseId: string,
    reviewId: string,
    updates: Partial<TourPlanningReview>
  ): TourPlanningReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.tourPlanningReviews) return null;

    const review = caseItem.tourPlanningReviews.find(r => r.id === reviewId);
    if (!review) return null;

    // Apply updates
    if (updates.vehicleId !== undefined) review.vehicleId = updates.vehicleId;
    if (updates.status !== undefined) review.status = updates.status;

    if (updates.route) {
      review.route = {
        ...review.route,
        ...updates.route
      };
    }

    if (updates.risks) {
      review.risks = updates.risks;
    }

    // Recalculate route times & buffer if stops or buffer changed
    if (updates.route?.stops || updates.route?.bufferMinutes !== undefined) {
      const stops = review.route.stops;
      const bufferMinutes = review.route.bufferMinutes;
      const depotToPickupMins = Math.round((review.route.totalDistanceKm * 0.25 / 50) * 60);
      const pickupToDestMins = Math.round((review.route.totalDistanceKm * 0.5 / 50) * 60);
      const destToDepotMins = Math.round((review.route.totalDistanceKm * 0.25 / 50) * 60);

      const prepStart = review.route.depotStart?.plannedDepartureTime || '07:30';
      if (review.route.depotStart) {
        review.route.depotStart.plannedDepartureTime = prepStart;
      }

      let lastTime = prepStart;
      stops.forEach((stop) => {
        if (stop.type === 'pickup') {
          const arr = addMinutesToTime(lastTime, depotToPickupMins + (review.route.depotStart?.estimatedServiceMinutes || 30));
          stop.plannedArrivalTime = arr;
          stop.plannedDepartureTime = addMinutesToTime(arr, stop.estimatedServiceMinutes);
          lastTime = stop.plannedDepartureTime;
        } else if (stop.type === 'intermediate') {
          const arr = addMinutesToTime(lastTime, 15);
          stop.plannedArrivalTime = arr;
          stop.plannedDepartureTime = addMinutesToTime(arr, stop.estimatedServiceMinutes);
          lastTime = stop.plannedDepartureTime;
        } else if (stop.type === 'destination') {
          const arr = addMinutesToTime(lastTime, pickupToDestMins);
          stop.plannedArrivalTime = arr;
          stop.plannedDepartureTime = addMinutesToTime(arr, stop.estimatedServiceMinutes);
          lastTime = stop.plannedDepartureTime;
        }
      });

      if (review.route.depotReturn) {
        const depotArr = addMinutesToTime(lastTime, destToDepotMins + bufferMinutes);
        review.route.depotReturn.plannedArrivalTime = depotArr;
      }

      const estimatedJobMinutes = stops.reduce((acc, s) => acc + s.estimatedServiceMinutes, 0) + (review.route.depotStart?.estimatedServiceMinutes || 30);
      review.route.estimatedJobMinutes = estimatedJobMinutes;
      review.route.totalPlannedMinutes = review.route.totalDrivingMinutes + estimatedJobMinutes + bufferMinutes;
    }

    // Update status to 'edited' if was 'pending'
    if (review.status === 'pending') {
      review.status = 'edited';
    }

    review.updatedAt = new Date().toISOString();

    const calendarReview = caseItem.calendarPlanningReviews?.find(c => c.id === review.calendarPlanningReviewId);
    const evalRes = evaluateTourPlanningReadiness(review, calendarReview, caseItem);
    review.readiness = evalRes.readiness;
    review.warnings = evalRes.warnings;
    review.risks = evaluateTourRisks(review.route, review, calendarReview);

    caseService.flushPersistence();

    workflowEngine.emitEvent('TOUR_PLANNING_REVIEW_UPDATED', 'TourPlanningService', {
      caseId,
      reviewId: review.id,
      readiness: review.readiness
    });

    return review;
  }

  // Confirm Tour Planning Review
  confirmTourPlanningReview(caseId: string, reviewId: string): TourPlanningReview | null {
    // Lock runtime to avoid concurrent processing
    if (this.runtimeLocks.has(reviewId)) {
      return null;
    }
    this.runtimeLocks.add(reviewId);

    try {
      const caseItem = caseService.getCase(caseId);
      if (!caseItem || !caseItem.tourPlanningReviews) return null;

      const review = caseItem.tourPlanningReviews.find(r => r.id === reviewId);
      if (!review) return null;

      // Idempotency check: If already confirmed, return without duplicate operations
      if (review.status === 'confirmed' || review.status === 'completed') {
        return review;
      }

      // Step 2 & 3: Validate route & re-evaluate readiness
      const calendarReview = caseItem.calendarPlanningReviews?.find(c => c.id === review.calendarPlanningReviewId);
      const evalRes = evaluateTourPlanningReadiness(review, calendarReview, caseItem);

      if (evalRes.readiness === 'missing_depot' || evalRes.readiness === 'missing_pickup' || evalRes.readiness === 'missing_destination' || evalRes.readiness === 'blocked') {
        review.status = 'failed';
        review.errorMessage = 'Bestätigung fehlgeschlagen: Erforderliche Adressangaben fehlen oder Vorgang blockiert.';
        caseService.flushPersistence();
        return review;
      }

      // Step 6 & 8: Set status confirmed
      review.status = 'confirmed';
      review.confirmedAt = new Date().toISOString();
      review.updatedAt = new Date().toISOString();

      // Step 10: Complete task "Tour vorbereiten"
      caseService.completeTaskByReference(caseId, 'TOUR_PLANNING_REVIEW', review.id);

      // Step 11: Create task "Einsatzunterlagen prüfen"
      caseService.addTask(caseId, {
        title: 'Einsatzunterlagen prüfen',
        description: 'Fracht- und Einsatzunterlagen für Fahrer und LKW vorbereiten',
        category: 'Planning',
        priority: 'medium',
        status: 'Open',
        source: 'TourPlanningService',
        workflowId: `wf_docs_${review.id}`,
        caseId,
        referenceType: 'TOUR_CONFIRMATION',
        referenceId: review.id
      });

      // Step 12: If schedule conflict exists, create task "Kalenderdauer prüfen"
      if (evalRes.readiness === 'conflicting_schedule') {
        caseService.addTask(caseId, {
          title: 'Kalenderdauer prüfen',
          description: 'Geplante Tourendauer ist länger als das registrierte Kalenderfenster',
          category: 'Schedule',
          priority: 'high',
          status: 'Open',
          source: 'TourPlanningService',
          workflowId: `wf_sched_conflict_${review.id}`,
          caseId,
          referenceType: 'SCHEDULE_CONFLICT',
          referenceId: review.id
        });
      }

      // Step 13 & 14: Add Timeline entry & emit event
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        title: 'Tour bestätigt',
        description: `Tour über ${review.route.totalDistanceKm} km für Fahrzeug ${review.vehicleId} wurde erfolgreich bestätigt.`,
        category: 'Planning',
        source: 'TourPlanningService',
        timestamp: new Date().toISOString(),
        metadata: { reviewId: review.id, totalKm: review.route.totalDistanceKm }
      });

      caseService.flushPersistence();

      workflowEngine.emitEvent('TOUR_PLANNING_REVIEW_CONFIRMED', 'TourPlanningService', {
        caseId,
        reviewId: review.id,
        route: review.route
      });

      // Record decision with LearningService
      learningService.recordDecision(caseId, 'tour_planning_confirmed', 'confirmed', {
        reviewId: review.id,
        vehicleId: review.vehicleId,
        totalKm: review.route.totalDistanceKm,
        totalPlannedMinutes: review.route.totalPlannedMinutes,
        stopsCount: review.route.stops.length
      });

      return review;
    } finally {
      this.runtimeLocks.delete(reviewId);
    }
  }

  // Reject Tour Planning Review
  rejectTourPlanningReview(caseId: string, reviewId: string, reason?: string): TourPlanningReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.tourPlanningReviews) return null;

    const review = caseItem.tourPlanningReviews.find(r => r.id === reviewId);
    if (!review) return null;

    review.status = 'rejected';
    review.updatedAt = new Date().toISOString();

    caseService.addTimelineEntry(caseId, {
      type: 'status_change',
      title: 'Tour abgelehnt',
      description: `Tourenentwurf wurde abgelehnt.${reason ? ` Grund: ${reason}` : ''}`,
      category: 'Planning',
      source: 'TourPlanningService',
      timestamp: new Date().toISOString(),
      metadata: { reviewId: review.id, reason }
    });

    caseService.flushPersistence();

    workflowEngine.emitEvent('TOUR_PLANNING_REVIEW_REJECTED', 'TourPlanningService', {
      caseId,
      reviewId: review.id,
      reason
    });

    return review;
  }
}

export const tourPlanningService = new TourPlanningService();
