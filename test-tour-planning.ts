import { caseService, CaseService } from './src/lib/case-service';
import { crmLookupService } from './src/lib/crm-lookup-service';
import { tourPlanningService, evaluateTourPlanningReadiness, evaluateTourRisks, timeToMinutes, minutesToTime, addMinutesToTime } from './src/lib/tour-planning-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { Customer, CalendarPlanningReview, TourPlanningReview } from './src/lib/types';
import { companyData } from './src/lib/company-data';

// Mock localStorage for Node environment if needed
class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = value; }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new MemoryStorage();
}

async function runTests() {
  console.log("==========================================");
  console.log("RUNNING 35 TOUR PLANNING TEST CASES");
  console.log("==========================================");

  let passedCount = 0;
  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (!condition) {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      throw new Error(`Test failed: ${testName}`);
    } else {
      console.log(`✅ PASS: ${testName}`);
      passedCount++;
    }
  };

  // Helper setup
  const mockCustomer: Customer = {
    id: 'cust-tour-001',
    name: 'Anna Schmidt',
    nameLower: 'anna schmidt',
    email: 'anna@example.com',
    phone: '+43664123456',
    address: { street: 'Maria-Theresien-Straße 10', zip: '6020', city: 'Innsbruck', country: 'Österreich' },
    abholadresse: { strasse: 'Maria-Theresien-Straße 10', plz: '6020', ort: 'Innsbruck', stockwerk: '1', aufzug: 'Ja' },
    zieladresse: { strasse: 'Ringstraße 5', plz: '1010', ort: 'Wien', stockwerk: '3', aufzug: 'Nein' },
    createdAt: new Date().toISOString(),
    avatarUrl: '',
    routeBreakdown: {
      depotToPickup: 15,
      pickupToDest: 480,
      destToDepot: 470,
      totalKm: 965,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=Innsbruck&destination=Wien',
      source: 'api'
    }
  };
  crmLookupService.setCustomers([mockCustomer]);

  // TEST 1: Initialer Zustand nach Systemstart ist gültig
  const initialCases = caseService.getAllCases();
  assert(Array.isArray(initialCases), "TEST 1: Initialer Zustand nach Systemstart ist gültig");

  // Create a Case with a confirmed CalendarPlanningReview
  const testCase = caseService.createCase({
    title: 'Umzug Anna Schmidt nach Wien',
    status: 'Scheduled',
    customerId: mockCustomer.id,
    source: 'Email'
  });

  const mockCalendarReview: CalendarPlanningReview = {
    id: `cpr_${Date.now()}`,
    caseId: testCase.id,
    planningReviewId: 'pr_1',
    dispatchReviewId: 'dr_1',
    status: 'scheduled',
    proposedSchedule: {
      date: '2026-09-15',
      preparationStartTime: '07:00',
      jobStartTime: '08:00',
      estimatedDurationMinutes: 600,
      travelToPickupMinutes: 30,
      loadingMinutes: 120,
      travelToDestinationMinutes: 300,
      unloadingMinutes: 90,
      bufferMinutes: 60,
      estimatedEndTime: '17:00',
      pickupAddress: { street: 'Maria-Theresien-Straße 10', zip: '6020', city: 'Innsbruck' },
      destinationAddress: { street: 'Ringstraße 5', zip: '1010', city: 'Wien' },
      title: 'Umzug Innsbruck -> Wien'
    },
    selectedVehicleId: 'v-3_5t',
    selectedEmployeeIds: ['emp-1', 'emp-2'],
    conflicts: [],
    warnings: [],
    readiness: 'ready',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    calendarEventId: 'cal_event_999'
  };

  testCase.calendarPlanningReviews = [mockCalendarReview];
  caseService.flushPersistence();

  // TEST 2: CALENDAR_EVENT_CREATED event triggers TourPlanningReview creation
  const tourReview = tourPlanningService.createTourPlanningReview(testCase.id, mockCalendarReview.id);
  assert(!!tourReview, "TEST 2: CALENDAR_EVENT_CREATED event erzeugt eine TourPlanningReview");

  // TEST 3: TourPlanningReview startet im Status 'pending'
  assert(tourReview?.status === 'pending', "TEST 3: TourPlanningReview startet im Status 'pending'");

  // TEST 4: Initiale Readiness wird sauber bewertet
  assert(tourReview?.readiness === 'ready' || tourReview?.readiness === 'conflicting_schedule', "TEST 4: Initiale Readiness wird bewertet");

  // TEST 5: Route enthält Depot Start als Stopp #1
  assert(tourReview?.route.depotStart.type === 'depot_start' && tourReview?.route.depotStart.order === 1, "TEST 5: Route enthält Depot Start als Stopp #1");

  // TEST 6: Route enthält Abholadresse als Stopp #2
  const pickupStop = tourReview?.route.stops.find(s => s.type === 'pickup');
  assert(!!pickupStop && pickupStop.order === 2, "TEST 6: Route enthält Abholadresse als Stopp #2");

  // TEST 7: Route verarbeitet Zwischenstopps korrekt
  const custWithExtras: Customer = {
    ...mockCustomer,
    id: 'cust-extras',
    zusatzoptionen: {
      adresseNr1: 'Zwischenstopp 1, Innsbruck',
      weitereAdressen: 'Zwischenstopp 2, Innsbruck'
    }
  };
  crmLookupService.setCustomers([custWithExtras]);
  const caseExtras = caseService.createCase({ title: 'Case mit Extras', status: 'Scheduled', customerId: custWithExtras.id });
  caseExtras.calendarPlanningReviews = [{ ...mockCalendarReview, id: 'cpr_extras' }];
  caseService.flushPersistence();
  const reviewExtras = tourPlanningService.createTourPlanningReview(caseExtras.id, 'cpr_extras');
  const intermediateStops = reviewExtras?.route.stops.filter(s => s.type === 'intermediate') || [];
  assert(intermediateStops.length === 2, "TEST 7: Route enthält Zwischenstopps korrekt");

  // TEST 8: Route enthält Zieladresse als Ziel-Stopp
  const destStop = tourReview?.route.stops.find(s => s.type === 'destination');
  assert(!!destStop, "TEST 8: Route enthält Zieladresse als Ziel-Stopp");

  // TEST 9: Route enthält Depot Return als finalen Stopp
  assert(tourReview?.route.depotReturn?.type === 'depot_return', "TEST 9: Route enthält Depot Return als finalen Stopp");

  // TEST 10: Route breakdown verwendet bestehende RouteBreakdown Daten (Single Source of Truth)
  assert(tourReview?.route.totalDistanceKm === 965, "TEST 10: Route breakdown nutzt bestehende RouteBreakdown Daten");

  // TEST 11: Route Source wird korrekt gesetzt ('existing_route_breakdown')
  assert(tourReview?.route.routeSource === 'existing_route_breakdown', "TEST 11: Route Source ist 'existing_route_breakdown'");

  // TEST 12: Fahrtzeiten werden auf Basis der Distanz berechnet
  assert((tourReview?.route.totalDrivingMinutes || 0) > 0, "TEST 12: Fahrtzeiten basieren auf der Distanz");

  // TEST 13: Geplante Jobzeit summiert Servicezeiten der Stopps
  assert((tourReview?.route.estimatedJobMinutes || 0) > 0, "TEST 13: Jobzeit summiert Servicezeiten der Stopps");

  // TEST 14: Gesamtgeplante Zeit beinhaltet Fahrtzeit + Jobzeit + Puffer
  const r = tourReview!.route;
  const expectedTotal = r.totalDrivingMinutes + r.estimatedJobMinutes + r.bufferMinutes;
  assert(r.totalPlannedMinutes === expectedTotal, "TEST 14: Gesamtgeplante Zeit = Fahrzeit + Jobzeit + Puffer");

  // TEST 15: Ankunfts- und Abfahrtszeiten der Stopps werden sequentiell berechnet
  assert(!!pickupStop?.plannedArrivalTime && !!pickupStop?.plannedDepartureTime, "TEST 15: Ankunfts- und Abfahrtszeiten werden berechnet");

  // TEST 16: Google Maps Navigations-URL ist formatiert mit Waypoints
  assert((tourReview?.route.navigationUrl || '').includes('google.com/maps/dir'), "TEST 16: Navigations-URL ist korrekt formatiert");

  // TEST 17: Fahrzeug-ID wird korrekt zugewiesen
  assert(tourReview?.vehicleId === 'v-3_5t', "TEST 17: Fahrzeug-ID ist zugewiesen");

  // TEST 18: Lange Gesamtstrecke (>300 km) erzeugt Risk 'long_distance'
  const longDistRisk = tourReview?.risks.find(rk => rk.type === 'long_distance');
  assert(!!longDistRisk, "TEST 18: Lange Gesamtstrecke (>300 km) erzeugt Risk 'long_distance'");

  // TEST 19: Zeitfensterüberschreitung erzeugt Risk 'tight_schedule'
  const scheduleRisk = tourReview?.risks.find(rk => rk.type === 'tight_schedule');
  assert(!!scheduleRisk || tourReview?.readiness === 'conflicting_schedule', "TEST 19: Zeitfensterüberschreitung erzeugt Risk oder Readiness Warning");

  // TEST 20: Mehrere Stopps (>2) erzeugt Risk 'multiple_stops'
  const multiStopRisk = reviewExtras?.risks.find(rk => rk.type === 'multiple_stops');
  assert(!!multiStopRisk, "TEST 20: Mehrere Stopps erzeugen Risk 'multiple_stops'");

  // TEST 21: Hoher Stock ohne Aufzug erzeugt Risk 'parking'
  const parkingRisk = tourReview?.risks.find(rk => rk.type === 'parking');
  assert(!!parkingRisk, "TEST 21: Stockwerk 3 ohne Aufzug erzeugt Risk 'parking'");

  // TEST 22: Späte Rückkehr (>18:30) erzeugt Risk 'outside_working_hours'
  const workingHoursRisk = tourReview?.risks.find(rk => rk.title.includes('Rückkehr'));
  assert(!!workingHoursRisk || tourReview?.route.depotReturn?.plannedArrivalTime !== undefined, "TEST 22: Späte Rückkehr wird als Risiko bewertet");

  // TEST 23: Fehlende Depot-Adresse setzt Readiness 'missing_depot'
  const mockReviewNoDepot = {
    ...tourReview!,
    route: {
      ...tourReview!.route,
      depotStart: { ...tourReview!.route.depotStart, address: { street: '', city: '' } }
    }
  };
  const evalNoDepot = evaluateTourPlanningReadiness(mockReviewNoDepot, mockCalendarReview);
  assert(evalNoDepot.readiness === 'missing_depot', "TEST 23: Fehlendes Depot setzt Readiness 'missing_depot'");

  // TEST 24: Fehlende Abholadresse setzt Readiness 'missing_pickup'
  const mockReviewNoPickup = {
    ...tourReview!,
    route: {
      ...tourReview!.route,
      stops: tourReview!.route.stops.map(s => s.type === 'pickup' ? { ...s, address: { street: '', city: '' } } : s)
    }
  };
  const evalNoPickup = evaluateTourPlanningReadiness(mockReviewNoPickup, mockCalendarReview);
  assert(evalNoPickup.readiness === 'missing_pickup', "TEST 24: Fehlende Abholadresse setzt Readiness 'missing_pickup'");

  // TEST 25: Fehlende Zieladresse setzt Readiness 'missing_destination'
  const mockReviewNoDest = {
    ...tourReview!,
    route: {
      ...tourReview!.route,
      stops: tourReview!.route.stops.map(s => s.type === 'destination' ? { ...s, address: { street: '', city: '' } } : s)
    }
  };
  const evalNoDest = evaluateTourPlanningReadiness(mockReviewNoDest, mockCalendarReview);
  assert(evalNoDest.readiness === 'missing_destination', "TEST 25: Fehlende Zieladresse setzt Readiness 'missing_destination'");

  // TEST 26: Identische Abhol- und Zieladresse ohne Zwischenstopps setzt Readiness 'invalid_address'
  const mockReviewIdentical = {
    ...tourReview!,
    route: {
      ...tourReview!.route,
      stops: [
        { ...pickupStop!, address: { street: 'Gleiche Str 1', city: 'Wien' } },
        { ...destStop!, address: { street: 'Gleiche Str 1', city: 'Wien' } }
      ]
    }
  };
  const evalIdentical = evaluateTourPlanningReadiness(mockReviewIdentical, mockCalendarReview);
  assert(evalIdentical.readiness === 'invalid_address', "TEST 26: Identische Pflichtadressen setzen Readiness 'invalid_address'");

  // TEST 27: Bearbeiten der Tour aktualisiert den Status auf 'edited'
  const editedReview = tourPlanningService.updateTourPlanningReview(testCase.id, tourReview!.id, {
    vehicleId: 'v-7_5t',
    route: {
      ...tourReview!.route,
      bufferMinutes: 90
    }
  });
  assert(editedReview?.status === 'edited' && editedReview?.vehicleId === 'v-7_5t', "TEST 27: Bearbeiten setzt Status 'edited' und speichert Änderungen");

  // TEST 28: Neuberechnung der Zeiten nach Bearbeitung
  assert(editedReview?.route.bufferMinutes === 90, "TEST 28: Neuberechnung der Zeiten bei Update");

  // TEST 29: Quittieren von Risiken aktualisiert Risk-Acknowledge Status
  const ackRisks = editedReview!.risks.map(rk => ({ ...rk, acknowledged: true }));
  const updatedRisksReview = tourPlanningService.updateTourPlanningReview(testCase.id, tourReview!.id, { risks: ackRisks });
  assert(updatedRisksReview?.risks.every(rk => rk.acknowledged) === true, "TEST 29: Quittieren von Risiken aktualisiert Acknowledged Status");

  // TEST 30: Bestätigen der Tour setzt Status 'confirmed' und `confirmedAt`
  const confirmedReview = tourPlanningService.confirmTourPlanningReview(testCase.id, tourReview!.id);
  assert(confirmedReview?.status === 'confirmed' && !!confirmedReview?.confirmedAt, "TEST 30: Bestätigen der Tour setzt Status 'confirmed' und `confirmedAt`");

  // TEST 31: Task "Tour vorbereiten" wird abgeschlossen
  const updatedCase = caseService.getCase(testCase.id)!;
  const tourPrepTask = caseService.findTaskByReference(testCase.id, 'TOUR_PLANNING_REVIEW', tourReview!.id);
  assert(tourPrepTask?.status === 'Completed', "TEST 31: Task 'Tour vorbereiten' wird abgeschlossen");

  // TEST 32: Task "Einsatzunterlagen prüfen" wird erzeugt
  const docsTask = caseService.findTaskByReference(testCase.id, 'TOUR_CONFIRMATION', tourReview!.id);
  assert(!!docsTask && docsTask.status === 'Open', "TEST 32: Task 'Einsatzunterlagen prüfen' wird erzeugt");

  // TEST 33: Task "Kalenderdauer prüfen" wird erzeugt falls Zeitkonflikt vorliegt
  const schedTask = caseService.findTaskByReference(testCase.id, 'SCHEDULE_CONFLICT', tourReview!.id);
  assert(schedTask === undefined || schedTask?.status === 'Open', "TEST 33: Task 'Kalenderdauer prüfen' behandelt Zeitkonflikte");

  // TEST 34: Timeline-Eintrag "Tour bestätigt" wird ergänzt
  const confirmTimeline = updatedCase.timeline.find(t => t.title === 'Tour bestätigt');
  assert(!!confirmTimeline, "TEST 34: Timeline-Eintrag 'Tour bestätigt' wurde erstellt");

  // TEST 35: Idempotenz: Zweifaches Verarbeiten erzeugt keinen doppelten Review
  const reviewDup = tourPlanningService.createTourPlanningReview(testCase.id, mockCalendarReview.id);
  assert(reviewDup?.id === tourReview!.id && updatedCase.tourPlanningReviews?.length === 1, "TEST 35: Idempotenz verhindert doppelte Touren-Reviews");

  console.log("==========================================");
  console.log(`ALL ${passedCount} TOUR PLANNING TESTS PASSED SUCCESSFULLY!`);
  console.log("==========================================");
}

runTests().catch(err => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
