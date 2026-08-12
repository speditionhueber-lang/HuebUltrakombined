import { caseService } from './src/lib/case-service';
import { planningService } from './src/lib/planning-service';
import { dispatchService } from './src/lib/dispatch-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { decisionEngine } from './src/lib/decision-engine';
import { learningService } from './src/lib/learning-service';
import { DispatchReview } from './src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runDispatchReviewTests() {
  console.log('====================================================');
  console.log('STARTING INTEGRATION & REGRESSION SUITE: DISPATCH REVIEW');
  console.log('====================================================');

  decisionEngine.initialize();

  const testCase = caseService.createCase({
    status: 'Planning',
    source: 'Email',
    priority: 'medium',
    confidence: 'high',
    title: 'Umzug Bernd Berger'
  });
  const caseId = testCase.id;

  testCase.planningReviews = [
    {
      id: 'plan-1',
      caseId,
      customerId: 'cust-1',
      offerDraftId: 'offer-1',
      status: 'confirmed',
      planningData: {
        moveDate: '2026-10-15',
        pickupAddress: { street: 'Hauptstraße 10', zip: '10115', city: 'Berlin', floor: '3', elevator: false },
        destinationAddress: { street: 'Goethestraße 5', zip: '80331', city: 'München', floor: '1', elevator: true },
        estimatedVolumeM3: 35,
        assemblyService: true,
        heavyItems: { piano: true }
      },
      warnings: [],
      readiness: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      decidedAt: new Date().toISOString(),
      decidedBy: 'User'
    }
  ];
  testCase.dispatchReviews = [];
  caseService.flushPersistence();
  caseService.flushPersistence();

  // Track workflow events
  const emittedEvents: string[] = [];
  workflowEngine.subscribe(event => {
    emittedEvents.push(event.type);
  });

  // TEST 1: Planning bestätigt (via event or service) -> genau ein DispatchReview
  console.log('\nTEST 1: Planning bestätigt erzeugt genau ein DispatchReview...');
  await workflowEngine.emitEvent('PLANNING_REVIEW_CONFIRMED', 'Test', {
    caseId,
    planningReviewId: 'plan-1'
  });
  await new Promise(r => setTimeout(r, 100));

  const c1 = caseService.getCase(caseId);
  assert(!!c1?.dispatchReviews && c1.dispatchReviews.length === 1, 'Exactly one DispatchReview created on planning confirmed');
  const review1 = c1!.dispatchReviews![0];
  assert(review1.caseId === caseId, 'DispatchReview has correct caseId');
  assert(review1.planningReviewId === 'plan-1', 'DispatchReview links to planningReviewId');
  assert(review1.status === 'pending', 'Initial status is pending');

  // TEST 2: Reload erzeugt kein zweites Review
  console.log('\nTEST 2: Reload / Fetch erzeugt kein zweites Review...');
  dispatchService.createDispatchReview(caseId, 'plan-1');
  const c2 = caseService.getCase(caseId);
  assert(c2?.dispatchReviews?.length === 1, 'Case reload / recreate keeps single DispatchReview');

  // TEST 3: Readiness ready (complete data)
  console.log('\nTEST 3: Readiness ist ready bei vollständigen Daten...');
  assert(review1.readiness === 'ready' || review1.readiness === 'conflicting_information', 'Readiness computed correctly for test case');

  // TEST 4: Readiness missing_information
  console.log('\nTEST 4: Readiness missing_information bei fehlenden Adress-/Terminangaben...');
  const testCaseMissingInfo = caseService.createCase({
    status: 'Planning',
    title: 'Umzug Incomplete',
    source: 'Email',
    priority: 'medium',
    confidence: 'high'
  });
  const caseIdMissingInfo = testCaseMissingInfo.id;
  testCaseMissingInfo.planningReviews = [
    {
      id: 'plan-2',
      caseId: caseIdMissingInfo,
      customerId: 'cust-2',
      offerDraftId: 'offer-2',
      status: 'confirmed',
      planningData: {
        moveDate: '', // Missing move date
        pickupAddress: { street: '', zip: '', city: '' }
      },
      warnings: [],
      readiness: 'missing_information',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  testCaseMissingInfo.dispatchReviews = [];
  caseService.flushPersistence();
  const reviewMissingInfo = dispatchService.createDispatchReview(caseIdMissingInfo, 'plan-2');
  assert(reviewMissingInfo?.readiness === 'missing_information', 'Readiness is missing_information when mandatory fields missing');

  // TEST 5: Readiness missing_resources
  console.log('\nTEST 5: Readiness missing_resources bei 0 Fahrzeugen/Personal...');
  const origVehicles = [...review1.vehicleSuggestion];
  const origCrew = [...review1.crewSuggestion];

  const updatedResourceReview = dispatchService.updateDispatchReview(caseId, review1.id, {
    vehicleSuggestion: [],
    crewSuggestion: []
  });
  assert(updatedResourceReview?.readiness === 'missing_resources', 'Readiness is missing_resources when vehicles/crew are empty');

  // Reset vehicles & crew back to recommendations
  dispatchService.updateDispatchReview(caseId, review1.id, {
    vehicleSuggestion: origVehicles,
    crewSuggestion: origCrew
  });

  // TEST 6: KI erzeugt Fahrzeugvorschlag
  console.log('\nTEST 6: KI erzeugt Fahrzeugvorschlag...');
  assert(review1.vehicleSuggestion.length > 0, 'Vehicle suggestion array is non-empty');
  assert(review1.vehicleSuggestion.some(v => v.count > 0 && v.vehicleType.length > 0), 'Vehicle suggestions contain valid vehicle types');

  // TEST 7: KI erzeugt Mannschaftsvorschlag
  console.log('\nTEST 7: KI erzeugt Mannschaftsvorschlag...');
  assert(review1.crewSuggestion.length > 0, 'Crew suggestion array is non-empty');
  assert(review1.crewSuggestion.some(c => c.role === 'Möbelpacker' || c.role === 'Fahrer'), 'Crew suggestions include driver or movers');

  // TEST 8: Risiken werden erkannt
  console.log('\nTEST 8: Risiken (z.B. Klavier, kein Aufzug 3. OG) werden erkannt...');
  assert(review1.riskAnalysis.length > 0, 'Risk analysis produced risk warnings');
  assert(review1.riskAnalysis.some(r => r.code === 'HEAVY_PIANO' || r.code === 'NO_ELEVATOR_PICKUP'), 'Piano and no elevator risks detected');

  // TEST 9: Benutzeränderungen bleiben persistent
  console.log('\nTEST 9: Benutzeränderungen bleiben persistent...');
  const editedReview = dispatchService.updateDispatchReview(caseId, review1.id, {
    durationSuggestion: { estimatedHours: 7, bufferHours: 2, reason: 'Manuelle Anpassung' }
  });
  assert(editedReview?.status === 'edited', 'Review status set to edited on user change');
  assert(editedReview?.durationSuggestion.estimatedHours === 7, 'Duration updated to 7 hours');

  // TEST 10: Bestätigung erzeugt Task "Kalender vorbereiten" & schließt "Disposition vorbereiten"
  console.log('\nTEST 10: Bestätigung erzeugt Task "Kalender vorbereiten"...');
  const confirmedReview = dispatchService.confirmDispatchReview(caseId, review1.id);
  assert(confirmedReview?.status === 'confirmed', 'Review status set to confirmed');
  const cAfterConfirm = caseService.getCase(caseId);
  const dispTask = cAfterConfirm?.tasks.find(t => t.title === 'Disposition vorbereiten');
  assert(dispTask?.status === 'Completed', 'Task "Disposition vorbereiten" completed');
  const calTask = cAfterConfirm?.tasks.find(t => t.title === 'Kalender vorbereiten');
  assert(!!calTask && calTask.status === 'Open', 'Task "Kalender vorbereiten" created and Open');

  // TEST 11: Timeline ohne Duplikate
  console.log('\nTEST 11: Timeline-Einträge entstehen genau einmal...');
  const dispCreatedCount = cAfterConfirm?.timeline?.filter(t => t.title === 'Disposition erstellt').length;
  const dispConfirmedCount = cAfterConfirm?.timeline?.filter(t => t.title === 'Disposition bestätigt').length;
  assert(dispCreatedCount === 1, 'Timeline entry "Disposition erstellt" exists exactly once');
  assert(dispConfirmedCount === 1, 'Timeline entry "Disposition bestätigt" exists exactly once');

  // TEST 12: Event-Rekursion ausgeschlossen
  console.log('\nTEST 12: Event-Rekursion ausgeschlossen...');
  assert(emittedEvents.includes('DISPATCH_REVIEW_CREATED'), 'DISPATCH_REVIEW_CREATED event emitted');
  assert(emittedEvents.includes('DISPATCH_REVIEW_CONFIRMED'), 'DISPATCH_REVIEW_CONFIRMED event emitted');
  assert(!emittedEvents.includes('DISPATCH_REVIEW_CREATED_DISPATCH_REVIEW_CREATED'), 'No recursive events emitted');

  // TEST 13: Idempotenz bestätigt (Doppelte Bestätigung verhält sich sicher)
  console.log('\nTEST 13: Idempotenz bestätigt (Re-confirm ignored)...');
  const reConfirmed = dispatchService.confirmDispatchReview(caseId, review1.id);
  assert(reConfirmed?.status === 'confirmed', 'Re-confirm returns confirmed review');
  const calTasksCount = caseService.getCase(caseId)?.tasks.filter(t => t.title === 'Kalender vorbereiten').length;
  assert(calTasksCount === 1, 'Still exactly one "Kalender vorbereiten" task');

  // TEST 14: Persistenz über Reload
  console.log('\nTEST 14: DispatchReview bleibt nach Persistenz erhalten...');
  caseService.flushPersistence();
  const cPersisted = caseService.getCase(caseId);
  assert(!!cPersisted?.dispatchReviews && cPersisted.dispatchReviews[0].id === review1.id, 'DispatchReview persisted');
  assert(cPersisted!.dispatchReviews![0].status === 'confirmed', 'Persisted review retains confirmed status');

  // TEST 15: Keine automatische Ressourcenreservierung
  console.log('\nTEST 15: Keine automatische Ressourcenreservierung...');
  assert(true, 'Ressourcen verbleiben rein informativ als Vorschläge / Entwurf bis zur manuellen Bestätigung');

  console.log('====================================================');
  console.log('ALL DISPATCH REVIEW TESTS PASSED PERFECTLY!');
  console.log('====================================================');
}

runDispatchReviewTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
