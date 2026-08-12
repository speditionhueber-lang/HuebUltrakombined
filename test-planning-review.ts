import { caseService } from './src/lib/case-service';
import { planningService, evaluatePlanningReadiness } from './src/lib/planning-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { decisionEngine } from './src/lib/decision-engine';
import { PlanningData } from './src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runPlanningReviewTests() {
  console.log('====================================================');
  console.log('STARTING INTEGRATION & REGRESSION SUITE: PLANNING REVIEW');
  console.log('====================================================');

  decisionEngine.initialize();

  const testCase = caseService.createCase({
    status: 'Draft',
    source: 'Test',
    priority: 'high',
    confidence: 'high',
    title: 'Test Case - Planning Review'
  });

  const caseId = testCase.id;

  testCase.offerDrafts = [
    {
      id: 'offer-draft-1',
      caseId,
      customerId: 'cust-1',
      offerType: 'binding',
      currency: 'EUR',
      subtotalNet: 1000,
      netTotal: 1000,
      vatRate: 19,
      vatAmount: 190,
      grossTotal: 1190,
      status: 'accepted',
      moveDate: '2026-09-15',
      totalM3: 35,
      pickupAddress: {
        street: 'Hauptstraße 10',
        zip: '10115',
        city: 'Berlin',
        floor: 2,
        elevator: 'Ja',
        distanceTruck: 10
      },
      destinationAddress: {
        street: 'Gartenstraße 25',
        zip: '10117',
        city: 'Berlin',
        floor: 1,
        elevator: 'Nein',
        distanceTruck: 15
      },
      items: [
        {
          id: 'item-1',
          description: 'Möbelmontage',
          quantity: 1,
          unit: 'Std',
          unitPrice: 50,
          total: 50,
          category: 'Montage',
          selected: true
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      corrections: []
    } as any
  ];
  caseService.flushPersistence();

  // TEST 1
  console.log('\nTEST 1: OFFER_ACCEPTED erzeugt genau ein PlanningReview...');
  workflowEngine.emitEvent('OFFER_ACCEPTED', 'TestRunner', {
    caseId,
    offerDraftId: 'offer-draft-1'
  });
  await new Promise(r => setTimeout(r, 100));

  const updatedCase1 = caseService.getCase(caseId);
  assert(!!updatedCase1?.planningReviews && updatedCase1.planningReviews.length === 1, 'Exactly one PlanningReview created');
  const review1 = updatedCase1!.planningReviews![0];
  assert(review1.caseId === caseId, 'PlanningReview has correct caseId');
  assert(review1.offerDraftId === 'offer-draft-1', 'PlanningReview has correct offerDraftId');
  assert(review1.status === 'pending', 'Initial status is pending');

  // TEST 2
  console.log('\nTEST 2: Reload / Fetch erzeugt kein zweites Review...');
  const reloadedCase = caseService.getCase(caseId);
  assert(reloadedCase?.planningReviews?.length === 1, 'Case reload keeps single PlanningReview');

  // TEST 3 & 4
  console.log('\nTEST 3 & 4: Fehlende Daten werden erkannt -> readiness = missing_information...');
  const incompleteData: PlanningData = {
    moveDate: '',
    pickupAddress: { street: '', zip: '', city: '' },
    destinationAddress: { street: 'Gartenstraße 25', zip: '10117', city: 'Berlin' }
  };
  const evalIncomplete = evaluatePlanningReadiness(incompleteData);
  assert(evalIncomplete.readiness === 'missing_information', 'Readiness is missing_information when mandatory fields missing');
  assert(evalIncomplete.warnings.some(w => w.code === 'MISSING_MOVE_DATE'), 'Warning for missing move date present');
  assert(evalIncomplete.warnings.some(w => w.code === 'MISSING_PICKUP_ADDRESS'), 'Warning for missing pickup address present');

  // TEST 5
  console.log('\nTEST 5: Vollständige Daten -> readiness = ready...');
  const completeData: PlanningData = {
    moveDate: '2026-09-15',
    pickupAddress: { street: 'Hauptstraße 10', zip: '10115', city: 'Berlin', floor: '2', elevator: true },
    destinationAddress: { street: 'Gartenstraße 25', zip: '10117', city: 'Berlin', floor: '1', elevator: false },
    estimatedVolumeM3: 35
  };
  const evalComplete = evaluatePlanningReadiness(completeData);
  assert(evalComplete.readiness === 'ready', 'Readiness is ready when all mandatory fields present');
  assert(evalComplete.warnings.filter(w => w.severity === 'high').length === 0, 'No high severity warnings for complete data');

  // TEST 6
  console.log('\nTEST 6: Benutzeränderungen werden gespeichert...');
  const editedReview = planningService.updatePlanningData(caseId, review1.id, {
    moveDate: '2026-09-20',
    assemblyService: true,
    packingService: true
  });
  assert(editedReview?.planningData.moveDate === '2026-09-20', 'Updated move date saved');
  assert(editedReview?.planningData.assemblyService === true, 'Updated assembly service saved');
  assert(editedReview?.status === 'edited', 'Review status updated to edited');

  // TEST 7
  console.log('\nTEST 7: Review bestätigt -> Task "Disposition vorbereiten"...');
  const confirmedReview = planningService.confirmPlanningReview(caseId, review1.id);
  assert(confirmedReview?.status === 'confirmed', 'Review status is confirmed');

  const cAfterConfirm = caseService.getCase(caseId);
  const dispTask = cAfterConfirm?.tasks.find(t => t.title === 'Disposition vorbereiten');
  assert(!!dispTask, 'Task "Disposition vorbereiten" created');
  assert(dispTask?.status === 'Open', 'Disposition task is Open');

  const planTask = cAfterConfirm?.tasks.find(t => t.title === 'Auftrag planen');
  assert(planTask?.status === 'Completed', 'Task "Auftrag planen" completed');

  // TEST 8
  console.log('\nTEST 8: Doppelte OFFER_ACCEPTED-Events erzeugen kein zweites Review...');
  workflowEngine.emitEvent('OFFER_ACCEPTED', 'TestRunner', {
    caseId,
    offerDraftId: 'offer-draft-1'
  });
  await new Promise(r => setTimeout(r, 100));
  const cAfterDup = caseService.getCase(caseId);
  assert(cAfterDup?.planningReviews?.length === 1, 'Still exactly one PlanningReview after duplicate OFFER_ACCEPTED');

  // TEST 9
  console.log('\nTEST 9: Timeline-Einträge entstehen genau einmal...');
  const preparedEntries = cAfterDup?.timeline.filter(t => t.title === 'Planung vorbereitet') || [];
  assert(preparedEntries.length === 1, 'Timeline entry "Planung vorbereitet" exists exactly once');

  const confirmedEntries = cAfterDup?.timeline.filter(t => t.title === 'Planung bestätigt') || [];
  assert(confirmedEntries.some(t => t.title === 'Planung bestätigt'), 'Timeline entry "Planung bestätigt" exists');

  // TEST 10
  console.log('\nTEST 10: PlanningReview bleibt nach Persistenz erhalten...');
  caseService.flushPersistence();
  const cPersisted = caseService.getCase(caseId);
  assert(!!cPersisted?.planningReviews && cPersisted.planningReviews[0].id === review1.id, 'PlanningReview persisted and intact');
  assert(cPersisted!.planningReviews![0].status === 'confirmed', 'Persisted review retains confirmed status');

  console.log('\n====================================================');
  console.log('ALL PLANNING REVIEW TESTS PASSED PERFECTLY!');
  console.log('====================================================');
}

runPlanningReviewTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
