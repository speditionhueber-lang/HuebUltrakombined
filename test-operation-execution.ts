import { caseService } from './src/lib/case-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { operationPreparationService } from './src/lib/operation-preparation-service';
import { operationExecutionService } from './src/lib/operation-execution-service';
import { learningService } from './src/lib/learning-service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Operation Execution Test Suite (43 test cases)...\n');

  // Helper setup function to build a confirmed OperationPreparationReview
  const createMockCaseWithPrep = (id: string) => {
    const newCase = caseService.createCase({
      status: 'In Progress',
      source: 'Outlook',
      priority: 'high',
      confidence: 'high'
    });

    const cId = newCase.id;

    // Customer
    newCase.customerId = `cust_${cId}`;
    newCase.customerDraft = {
      id: `cd_${cId}`,
      caseId: cId,
      sourceEventId: 'ev1',
      source: 'Outlook',
      status: 'approved',
      confidence: 'high',
      fields: {
        name: { value: 'Max Mustermann', recognized: true, confidence: 'high', source: 'email' },
        phone: { value: '+43 664 1234567', recognized: true, confidence: 'high', source: 'email' },
        email: { value: 'max@example.at', recognized: true, confidence: 'high', source: 'email' },
        pickupAddress: { street: { value: 'Hauptstraße 12', recognized: true, confidence: 'high', source: 'email' }, zip: { value: '1010', recognized: true, confidence: 'high', source: 'email' }, city: { value: 'Wien', recognized: true, confidence: 'high', source: 'email' } },
        destinationAddress: { street: { value: 'Gasse 5', recognized: true, confidence: 'high', source: 'email' }, zip: { value: '1020', recognized: true, confidence: 'high', source: 'email' }, city: { value: 'Wien', recognized: true, confidence: 'high', source: 'email' } }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Offer draft
    newCase.offerDrafts = [{
      id: `off_${cId}`,
      caseId: cId,
      customerId: `cust_${cId}`,
      status: 'accepted',
      items: [{ id: '1', description: 'Umzugsservice', quantity: 1, unit: 'Pauschal', unitPrice: 500, total: 500, selected: true }],
      subtotalNet: 500,
      netTotal: 500,
      vatRate: 20,
      vatAmount: 100,
      grossTotal: 600,
      currency: 'EUR',
      offerType: 'binding',
      corrections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];

    const now = new Date();
    const jobStartIso = new Date(now.getTime() + 86400000).toISOString(); // tomorrow
    const jobEndIso = new Date(now.getTime() + 86400000 + 6 * 3600000).toISOString();

    // Create confirmed operation preparation review
    newCase.operationPreparationReviews = [{
      id: `prep_${cId}`,
      caseId: cId,
      planningReviewId: `pr_${cId}`,
      dispatchReviewId: `dr_${cId}`,
      calendarPlanningReviewId: `cal_${cId}`,
      tourPlanningReviewId: `tour_${cId}`,
      status: 'confirmed',
      readiness: 'ready',
      operationData: {
        jobDate: jobStartIso.split('T')[0],
        jobStartTime: jobStartIso,
        estimatedEndTime: jobEndIso,
        vehicleId: 'W-LKW-1',
        employeeIds: ['emp1', 'emp2'],
        customerId: `cust_${cId}`,
        customerName: 'Max Mustermann',
        customerPhone: '+43 664 1234567',
        customerEmail: 'max@example.at',
        pickupAddress: { street: 'Hauptstraße 12', zip: '1010', city: 'Wien' },
        destinationAddress: { street: 'Gasse 5', zip: '1020', city: 'Wien' },
        intermediateStops: [],
        estimatedWorkingMinutes: 360,
        estimatedDrivingMinutes: 45,
        bufferMinutes: 30,
        services: ['Umzugsservice', 'Möbelmontage'],
        requiredMaterials: [
          { id: 'mat1', name: 'Umzugskartons', category: 'Verpackung', quantityNeeded: 20, unit: 'Stück', status: 'confirmed_available' }
        ],
        requiredDocuments: [
          { id: 'doc1', title: 'Lieferschein', type: 'delivery_note', required: true, available: true, documentId: 'doc_123', source: 'document_service' }
        ],
        specialInstructions: ['Aufzug vorhanden']
      },
      checklist: [],
      reminders: [],
      warnings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    }];

    caseService.flushPersistence();
    return newCase;
  };

  // --- Test Group 1: Creation & Initialization ---
  console.log('--- Test Group 1: Creation & Initialization ---');

  const case1 = createMockCaseWithPrep('c1');
  const prepRev1 = case1.operationPreparationReviews![0];

  // Test 1: Creation from confirmed preparation review
  const exec1 = operationExecutionService.createOperationExecutionReview(case1.id, prepRev1.id);
  assert(exec1 !== null, 'Test 1: OperationExecutionReview successfully created');
  assert(exec1?.caseId === case1.id, 'Test 1b: caseId matches');

  // Test 2: Planned data snapshotting
  assert(exec1?.plannedData.vehicleId === 'W-LKW-1', 'Test 2a: Vehicle ID snapshotted');
  assert(exec1?.plannedData.employeeIds.length === 2, 'Test 2b: Crew snapshotted');
  assert(!!exec1?.plannedData.services.includes('Möbelmontage'), 'Test 2c: Services snapshotted');
  assert(exec1?.plannedData.plannedDurationMinutes === 360, 'Test 2d: Working minutes snapshotted');

  // Test 3: Initial status & readiness
  assert(exec1?.status === 'pending', 'Test 3a: Initial status is pending');
  assert(exec1?.readiness === 'not_started', 'Test 3b: Initial readiness is not_started');

  // Test 4: Idempotency on creation
  const exec1Dup = operationExecutionService.createOperationExecutionReview(case1.id, prepRev1.id);
  assert(exec1Dup?.id === exec1?.id, 'Test 4: Idempotent creation returns same review instance');

  // --- Test Group 2: Starting Execution ---
  console.log('\n--- Test Group 2: Starting Execution ---');

  let startedEventEmitted = false;
  workflowEngine.on('event', (ev) => {
    if (ev.type === 'OPERATION_EXECUTION_STARTED') startedEventEmitted = true;
  });

  const startIso = new Date().toISOString();

  // Test 5: Start execution updates status
  const execStarted = operationExecutionService.startOperationExecution(case1.id, exec1!.id, startIso);
  assert(execStarted?.status === 'in_progress', 'Test 5: Status transitioned to in_progress');

  // Test 6: actualStart timestamp recorded
  assert(execStarted?.actualData.actualStart === startIso, 'Test 6: actualStart timestamp recorded correctly');

  // Test 7: Case status updated
  const updatedCase1 = caseService.getCase(case1.id);
  assert(updatedCase1?.status === 'In Progress', 'Test 7: Case status updated to In Progress');

  // Test 8: Task "Einsatz durchführen" updated to In Progress
  const execTask = updatedCase1?.tasks.find(t => t.title.includes('Einsatz durchführen'));
  assert(execTask?.status === 'In Progress', 'Test 8: Task "Einsatz durchführen" updated to In Progress');

  // Test 9: Timeline entry created on start
  const timelineStart = updatedCase1?.timeline.find(t => t.title === 'Einsatz gestartet');
  assert(timelineStart !== undefined, 'Test 9: Timeline entry created for execution start');

  // Test 10: Event emitted
  assert(startedEventEmitted, 'Test 10: Event OPERATION_EXECUTION_STARTED emitted');

  // Test 11: Idempotency on starting execution
  const startDup = operationExecutionService.startOperationExecution(case1.id, exec1!.id);
  assert(startDup?.startedAt === startIso, 'Test 11: Double start does not override original start timestamp');

  // --- Test Group 3: Updating Actual Data & Calculations ---
  console.log('\n--- Test Group 3: Updating Actual Data & Calculations ---');

  const endIso = new Date(new Date(startIso).getTime() + 420 * 60000).toISOString(); // 7 hours = 420 mins

  // Test 12: Updating actuals with end time and break time
  const updatedActuals = operationExecutionService.updateActualData(case1.id, exec1!.id, {
    actualEnd: endIso,
    actualBreakMinutes: 30
  });
  assert(updatedActuals !== null, 'Test 12: Actual data updated successfully');

  // Test 13: Automatic calculation of working minutes (420 - 30 = 390 mins)
  assert(updatedActuals?.actualData.actualWorkingMinutes === 390, 'Test 13: Working minutes correctly calculated (390 mins)');

  // Test 14: Checklist update
  const endCheck = updatedActuals?.completionChecklist.find(c => c.id === 'c_end');
  assert(endCheck?.completed === true, 'Test 14: End time checklist item marked completed');

  // Test 15: Status transitioned to completion_review on end time
  assert(updatedActuals?.status === 'completion_review', 'Test 15: Status transitioned to completion_review');

  // --- Test Group 4: Deviations Detection ---
  console.log('\n--- Test Group 4: Deviations Detection ---');

  // Test 16: Duration deviation (390 vs planned 360 = 30 mins)
  const durationDev = updatedActuals?.deviations.find(d => d.type === 'duration');
  assert(durationDev !== undefined, 'Test 16: Duration deviation detected');

  // Test 17: Vehicle mismatch deviation
  operationExecutionService.updateActualData(case1.id, exec1!.id, { vehicleId: 'W-LKW-2' });
  const revVehDev = caseService.getCase(case1.id)?.operationExecutionReviews?.[0];
  const vehicleDev = revVehDev?.deviations.find(d => d.type === 'vehicle');
  assert(vehicleDev !== undefined, 'Test 17: Vehicle mismatch deviation detected');

  // Test 18: Crew mismatch deviation
  operationExecutionService.updateActualData(case1.id, exec1!.id, { employeeIds: ['emp1'] });
  const revCrewDev = caseService.getCase(case1.id)?.operationExecutionReviews?.[0];
  const crewDev = revCrewDev?.deviations.find(d => d.type === 'crew');
  assert(crewDev !== undefined, 'Test 18: Crew mismatch deviation detected');

  // Test 19: Uncompleted planned service deviation
  const uncompletedSrvDev = revCrewDev?.deviations.find(d => d.type === 'service');
  assert(uncompletedSrvDev !== undefined, 'Test 19: Uncompleted service deviation detected');

  // Test 20: Material usage deviation
  operationExecutionService.updateActualData(case1.id, exec1!.id, {
    materialsUsed: [{ id: 'mat1', name: 'Umzugskartons', plannedQuantity: 20, actualQuantity: 25, unit: 'Stück' }]
  });
  const revMatDev = caseService.getCase(case1.id)?.operationExecutionReviews?.[0];
  const matDev = revMatDev?.deviations.find(d => d.type === 'material');
  assert(matDev !== undefined, 'Test 20: Material usage deviation detected');

  // --- Test Group 5: Additional Services ---
  console.log('\n--- Test Group 5: Additional Services ---');

  // Test 21: Add additional service
  const revAddSrv = operationExecutionService.addAdditionalService(case1.id, exec1!.id, {
    description: 'Zusatzentsorgung Altmöbel',
    quantity: 2,
    unit: 'm3',
    billable: true,
    suggestedUnitPrice: 75
  });
  assert(revAddSrv?.actualData.additionalServices.length === 1, 'Test 21: Additional service added');

  // Test 22: Additional service properties
  const addSrv = revAddSrv?.actualData.additionalServices[0];
  assert(addSrv?.billable === true, 'Test 22a: Additional service is billable');
  assert(addSrv?.quantity === 2, 'Test 22b: Additional service quantity recorded');

  // Test 23: Additional service triggers deviation
  const addSrvDev = revAddSrv?.deviations.find(d => d.description.includes('Zusatzleistung'));
  assert(addSrvDev !== undefined, 'Test 23: Additional service deviation recorded');

  // --- Test Group 6: Incidents & Critical Blocker Management ---
  console.log('\n--- Test Group 6: Incidents & Critical Blocker Management ---');

  // Test 24: Add incident
  const revInc = operationExecutionService.addIncident(case1.id, exec1!.id, {
    type: 'damage',
    severity: 'high',
    title: 'Kratzer an Kommode',
    description: 'Beim Transport im Treppenhaus leicht an Wand gestreift.'
  });
  assert(revInc?.incidents.length === 1, 'Test 24: Incident recorded');

  // Test 25: Critical incident sets readiness to unresolved_incidents
  assert(revInc?.readiness === 'unresolved_incidents', 'Test 25: Readiness set to unresolved_incidents for high severity incident');

  // Test 26: Critical incident blocks completion
  const tryCompleteBlock = operationExecutionService.completeOperationExecution(case1.id, exec1!.id);
  assert(tryCompleteBlock?.status !== 'completed', 'Test 26: Critical incident blocks execution completion');
  assert(tryCompleteBlock?.errorMessage !== undefined, 'Test 26b: Error message set on blocked completion');

  // Test 27: Resolve incident
  const incId = revInc!.incidents[0].id;
  const revResolved = operationExecutionService.resolveIncident(case1.id, exec1!.id, incId, 'Kunde vor Ort mit € 50,- Preisnachlass geeinigt.');
  assert(revResolved?.incidents[0].resolved === true, 'Test 27: Incident resolved');

  // Test 28: Clearing incident readiness blocker
  assert(revResolved?.readiness !== 'unresolved_incidents', 'Test 28: Readiness cleared from unresolved_incidents after resolution');

  // --- Test Group 7: Customer Confirmation ---
  console.log('\n--- Test Group 7: Customer Confirmation ---');

  // Test 29: Customer confirmation status update
  operationExecutionService.updateActualData(case1.id, exec1!.id, {
    customerConfirmationStatus: 'confirmation_pending',
    completedServices: exec1!.actualData.completedServices.map(s => ({ ...s, completed: true }))
  });
  const revCustPending = caseService.getCase(case1.id)?.operationExecutionReviews?.[0];

  // Test 30: Missing customer confirmation readiness
  assert(revCustPending?.readiness === 'missing_customer_confirmation', 'Test 30: Readiness indicates missing customer confirmation');

  // Confirm customer
  operationExecutionService.updateActualData(case1.id, exec1!.id, {
    customerConfirmationStatus: 'confirmed',
    completedServices: exec1!.actualData.completedServices.map(s => ({ ...s, completed: true }))
  });

  // --- Test Group 8: Controlled Completion ---
  console.log('\n--- Test Group 8: Controlled Completion ---');

  let completedEventEmitted = false;
  workflowEngine.on('event', (ev) => {
    if (ev.type === 'OPERATION_EXECUTION_COMPLETED') completedEventEmitted = true;
  });

  // Test 31: Complete execution
  const completedRev = operationExecutionService.completeOperationExecution(case1.id, exec1!.id, { confirmedBy: 'Max Admin' });
  assert(completedRev?.status === 'completed', 'Test 31: Operation execution successfully completed');

  // Test 32: Timestamps and confirmation user recorded
  assert(completedRev?.completedAt !== undefined, 'Test 32a: completedAt timestamp set');
  assert(completedRev?.confirmedBy === 'Max Admin', 'Test 32b: confirmedBy user recorded');

  // Test 33: Task "Einsatz durchführen" completed
  const caseAfterComplete = caseService.getCase(case1.id);
  const taskExec = caseAfterComplete?.tasks.find(t => t.title.includes('Einsatz durchführen'));
  assert(taskExec?.status === 'Completed', 'Test 33: Task "Einsatz durchführen" marked Completed');

  // Test 34: Task "Rechnungsentwurf vorbereiten" created
  const taskInv = caseAfterComplete?.tasks.find(t => t.title.includes('Rechnungsentwurf vorbereiten'));
  assert(taskInv !== undefined, 'Test 34a: Next task "Rechnungsentwurf vorbereiten" created');
  assert(taskInv?.category === 'Invoice', 'Test 34b: Invoice task has category Invoice');

  // Test 35: Case status set to Completed
  assert(caseAfterComplete?.status === 'Completed', 'Test 35: Case status set to Completed');

  // Test 36: Learning service insight recorded
  let insightSaved = false;
  const insights = learningService.getInsightsForCase(case1.id);
  if (insights && insights.some(i => i.workflowType === 'operation_execution')) {
    insightSaved = true;
  }
  assert(insightSaved, 'Test 36: Insight recorded in Learning Service on completion');

  // Test 37: Event OPERATION_EXECUTION_COMPLETED emitted
  assert(completedEventEmitted, 'Test 37: Event OPERATION_EXECUTION_COMPLETED emitted');

  // Test 38: Idempotency on completion
  const completedDup = operationExecutionService.completeOperationExecution(case1.id, exec1!.id);
  assert(completedDup?.status === 'completed', 'Test 38: Double complete returns completed review without error');

  // --- Test Group 9: Follow-up / Nacharbeit Required Flow ---
  console.log('\n--- Test Group 9: Follow-up / Nacharbeit Required Flow ---');

  const case2 = createMockCaseWithPrep('c2');
  const prepRev2 = case2.operationPreparationReviews![0];
  const exec2 = operationExecutionService.createOperationExecutionReview(case2.id, prepRev2.id);

  operationExecutionService.startOperationExecution(case2.id, exec2!.id);
  operationExecutionService.updateActualData(case2.id, exec2!.id, {
    actualEnd: new Date().toISOString(),
    customerConfirmationStatus: 'confirmed',
    completedServices: exec2!.actualData.completedServices.map(s => ({ ...s, completed: true }))
  });

  // Test 39: Complete with follow-up required
  const followUpRev = operationExecutionService.completeOperationExecution(case2.id, exec2!.id, {
    followUpRequired: true,
    followUpNotes: 'Restliche 3 Kartons müssen morgen nachgeliefert werden.'
  });
  assert(followUpRev?.followUpRequired === true, 'Test 39: followUpRequired flag set');

  // Test 40: Case status remains In Progress when follow-up required
  const case2AfterFollowUp = caseService.getCase(case2.id);
  assert(case2AfterFollowUp?.status === 'In Progress', 'Test 40: Case status remains In Progress when follow-up required');

  // Test 41: Task "Nacharbeit durchführen" created, no invoice task
  const followUpTask = case2AfterFollowUp?.tasks.find(t => t.title.includes('Nacharbeit durchführen'));
  const noInvTask = case2AfterFollowUp?.tasks.find(t => t.title.includes('Rechnungsentwurf vorbereiten'));
  assert(followUpTask !== undefined, 'Test 41a: Task "Nacharbeit durchführen" created');
  assert(noInvTask === undefined, 'Test 41b: Rechnungsentwurf task NOT created while follow-up is active');

  // --- Test Group 10: Operation Cancellation ---
  console.log('\n--- Test Group 10: Operation Cancellation ---');

  const case3 = createMockCaseWithPrep('c3');
  const prepRev3 = case3.operationPreparationReviews![0];
  const exec3 = operationExecutionService.createOperationExecutionReview(case3.id, prepRev3.id);

  // Test 42: Cancel operation execution
  const cancelRev = operationExecutionService.cancelOperationExecution(case3.id, exec3!.id, 'Kunde hat vor Ort storniert wegen Wasserschaden.');
  assert(cancelRev?.status === 'cancelled', 'Test 42a: Status transitioned to cancelled');
  assert(cancelRev?.cancelReason === 'Kunde hat vor Ort storniert wegen Wasserschaden.', 'Test 42b: Cancel reason recorded');

  // Test 43: Cancellation task & event
  const case3AfterCancel = caseService.getCase(case3.id);
  const cancelTask = case3AfterCancel?.tasks.find(t => t.title.includes('Einsatzabbruch prüfen'));
  assert(cancelTask !== undefined, 'Test 43: Task "Einsatzabbruch prüfen" created');

  console.log('\n🎉 ALL 43 OPERATION EXECUTION TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
