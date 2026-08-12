import { caseService, Case } from './src/lib/case-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { dispatchService } from './src/lib/dispatch-service';
import { decisionEngine } from './src/lib/decision-engine';
import {
  calendarPlanningService,
  evaluateCalendarPlanningReadiness,
  detectCalendarConflicts
} from './src/lib/calendar-planning-service';
import {
  CalendarPlanningReview,
  ProposedSchedule
} from './src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runTests() {
  console.log('🚀 Starting Calendar Planning Review test suite...');
  decisionEngine.initialize();
  console.log('Workflow engine event listeners:', workflowEngine.listenerCount('event'));

  // 1. evaluateCalendarPlanningReadiness - Full valid review -> ready
  {
    const validReview: Partial<CalendarPlanningReview> = {
      status: 'pending',
      selectedVehicleId: 'v-3_5t',
      selectedEmployeeIds: ['emp-1', 'emp-2'],
      proposedSchedule: {
        date: '2026-09-15',
        jobStartTime: '08:00',
        estimatedEndTime: '12:00',
        estimatedDurationMinutes: 240,
        bufferMinutes: 45,
        pickupAddress: { street: 'Musterstr. 1', city: 'Berlin' },
        destinationAddress: { street: 'Zielstr. 2', city: 'Berlin' },
        title: 'Umzug Test'
      },
      conflicts: []
    };
    const res = evaluateCalendarPlanningReadiness(validReview);
    assert(res.readiness === 'ready', 'Test 1: Should be ready');
    console.log('✅ Test 1 Passed: Valid review evaluates to "ready"');
  }

  // 2. evaluateCalendarPlanningReadiness - Missing date -> missing_date
  {
    const res = evaluateCalendarPlanningReadiness({
      proposedSchedule: { date: '', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 0, pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't' },
      selectedVehicleId: 'v-1',
      selectedEmployeeIds: ['emp-1']
    });
    assert(res.readiness === 'missing_date', 'Test 2: Should be missing_date');
    console.log('✅ Test 2 Passed: Missing date evaluates to "missing_date"');
  }

  // 3. evaluateCalendarPlanningReadiness - Missing start time -> missing_time
  {
    const res = evaluateCalendarPlanningReadiness({
      proposedSchedule: { date: '2026-09-15', jobStartTime: '', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 0, pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't' },
      selectedVehicleId: 'v-1',
      selectedEmployeeIds: ['emp-1']
    });
    assert(res.readiness === 'missing_time', 'Test 3: Should be missing_time');
    console.log('✅ Test 3 Passed: Missing start time evaluates to "missing_time"');
  }

  // 4. evaluateCalendarPlanningReadiness - Missing vehicle -> missing_vehicle
  {
    const res = evaluateCalendarPlanningReadiness({
      proposedSchedule: { date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 0, pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't' },
      selectedVehicleId: '',
      selectedEmployeeIds: ['emp-1']
    });
    assert(res.readiness === 'missing_vehicle', 'Test 4: Should be missing_vehicle');
    console.log('✅ Test 4 Passed: Missing vehicle evaluates to "missing_vehicle"');
  }

  // 5. evaluateCalendarPlanningReadiness - Missing employees -> missing_employees
  {
    const res = evaluateCalendarPlanningReadiness({
      proposedSchedule: { date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 0, pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't' },
      selectedVehicleId: 'v-1',
      selectedEmployeeIds: []
    });
    assert(res.readiness === 'missing_employees', 'Test 5: Should be missing_employees');
    console.log('✅ Test 5 Passed: Missing employees evaluates to "missing_employees"');
  }

  // 6. evaluateCalendarPlanningReadiness - Incomplete address -> incomplete_information
  {
    const res = evaluateCalendarPlanningReadiness({
      proposedSchedule: { date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 0, pickupAddress: { street: '', city: '' }, destinationAddress: { street: 'c', city: 'd' }, title: 't' },
      selectedVehicleId: 'v-1',
      selectedEmployeeIds: ['emp-1']
    });
    assert(res.readiness === 'incomplete_information', 'Test 6: Should be incomplete_information');
    console.log('✅ Test 6 Passed: Incomplete address evaluates to "incomplete_information"');
  }

  // 7. evaluateCalendarPlanningReadiness - High conflict -> conflict
  {
    const res = evaluateCalendarPlanningReadiness({
      proposedSchedule: { date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 0, pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't' },
      selectedVehicleId: 'v-1',
      selectedEmployeeIds: ['emp-1'],
      conflicts: [{ id: '1', type: 'vehicle_overlap', title: 'Overlap', description: 'Overlap', severity: 'high' }]
    });
    assert(res.readiness === 'conflict', 'Test 7: Should be conflict');
    console.log('✅ Test 7 Passed: High conflict evaluates to "conflict"');
  }

  // 8. detectCalendarConflicts - Vehicle overlap
  {
    const proposed: ProposedSchedule = {
      date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 30,
      pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't'
    };
    const otherCase: Partial<Case> = {
      id: 'case_other_1',
      calendarPlanningReviews: [{
        id: 'cpr_other', caseId: 'case_other_1', planningReviewId: 'p1', dispatchReviewId: 'd1', status: 'confirmed',
        selectedVehicleId: 'v-lkw-1', selectedEmployeeIds: ['emp-3'], conflicts: [], warnings: [], readiness: 'ready', createdAt: '', updatedAt: '',
        proposedSchedule: { date: '2026-09-15', jobStartTime: '09:00', estimatedEndTime: '13:00', estimatedDurationMinutes: 240, bufferMinutes: 30, pickupAddress: {}, destinationAddress: {}, title: 'other' }
      }] as any
    };
    const confs = detectCalendarConflicts(proposed, 'v-lkw-1', ['emp-1'], 'case_curr', [otherCase as Case]);
    assert(confs.some(c => c.type === 'vehicle_overlap'), 'Test 8: Should detect vehicle_overlap');
    console.log('✅ Test 8 Passed: Detected vehicle overlap');
  }

  // 9. detectCalendarConflicts - Employee overlap
  {
    const proposed: ProposedSchedule = {
      date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 30,
      pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't'
    };
    const otherCase: Partial<Case> = {
      id: 'case_other_2',
      calendarPlanningReviews: [{
        id: 'cpr_other_2', caseId: 'case_other_2', planningReviewId: 'p1', dispatchReviewId: 'd1', status: 'confirmed',
        selectedVehicleId: 'v-2', selectedEmployeeIds: ['emp-shared'], conflicts: [], warnings: [], readiness: 'ready', createdAt: '', updatedAt: '',
        proposedSchedule: { date: '2026-09-15', jobStartTime: '10:00', estimatedEndTime: '14:00', estimatedDurationMinutes: 240, bufferMinutes: 30, pickupAddress: {}, destinationAddress: {}, title: 'other' }
      }] as any
    };
    const confs = detectCalendarConflicts(proposed, 'v-1', ['emp-shared'], 'case_curr', [otherCase as Case]);
    assert(confs.some(c => c.type === 'employee_overlap'), 'Test 9: Should detect employee_overlap');
    console.log('✅ Test 9 Passed: Detected employee overlap');
  }

  // 10. detectCalendarConflicts - Parallel case
  {
    const proposed: ProposedSchedule = {
      date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 30,
      pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't'
    };
    const otherCase: Partial<Case> = {
      id: 'case_other_3',
      calendarPlanningReviews: [{
        id: 'cpr_other_3', caseId: 'case_other_3', planningReviewId: 'p1', dispatchReviewId: 'd1', status: 'confirmed',
        selectedVehicleId: 'v-diff', selectedEmployeeIds: ['emp-diff'], conflicts: [], warnings: [], readiness: 'ready', createdAt: '', updatedAt: '',
        proposedSchedule: { date: '2026-09-15', jobStartTime: '08:30', estimatedEndTime: '11:30', estimatedDurationMinutes: 180, bufferMinutes: 30, pickupAddress: {}, destinationAddress: {}, title: 'other' }
      }] as any
    };
    const confs = detectCalendarConflicts(proposed, 'v-1', ['emp-1'], 'case_curr', [otherCase as Case]);
    assert(confs.some(c => c.type === 'parallel_case'), 'Test 10: Should detect parallel_case');
    console.log('✅ Test 10 Passed: Detected parallel case');
  }

  // 11. detectCalendarConflicts - Tight schedule
  {
    const proposed: ProposedSchedule = {
      date: '2026-09-15', jobStartTime: '12:15', estimatedEndTime: '16:00', estimatedDurationMinutes: 225, bufferMinutes: 45,
      pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't'
    };
    const otherCase: Partial<Case> = {
      id: 'case_other_4',
      calendarPlanningReviews: [{
        id: 'cpr_other_4', caseId: 'case_other_4', planningReviewId: 'p1', dispatchReviewId: 'd1', status: 'confirmed',
        selectedVehicleId: 'v-diff', selectedEmployeeIds: ['emp-diff'], conflicts: [], warnings: [], readiness: 'ready', createdAt: '', updatedAt: '',
        proposedSchedule: { date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 45, pickupAddress: {}, destinationAddress: {}, title: 'other' }
      }] as any
    };
    const confs = detectCalendarConflicts(proposed, 'v-1', ['emp-1'], 'case_curr', [otherCase as Case]);
    assert(confs.some(c => c.type === 'tight_schedule'), 'Test 11: Should detect tight_schedule');
    console.log('✅ Test 11 Passed: Detected tight schedule');
  }

  // 12. detectCalendarConflicts - Outside working hours
  {
    const proposed: ProposedSchedule = {
      date: '2026-09-15', jobStartTime: '05:00', estimatedEndTime: '09:00', estimatedDurationMinutes: 240, bufferMinutes: 30,
      pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't'
    };
    const confs = detectCalendarConflicts(proposed, 'v-1', ['emp-1'], 'case_curr', []);
    assert(confs.some(c => c.type === 'outside_working_hours'), 'Test 12: Should detect outside_working_hours');
    console.log('✅ Test 12 Passed: Detected outside working hours');
  }

  // 13. detectCalendarConflicts - Invalid time range
  {
    const proposed: ProposedSchedule = {
      date: '2026-09-15', jobStartTime: '14:00', estimatedEndTime: '12:00', estimatedDurationMinutes: -120, bufferMinutes: 30,
      pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't'
    };
    const confs = detectCalendarConflicts(proposed, 'v-1', ['emp-1'], 'case_curr', []);
    assert(confs.some(c => c.type === 'invalid_time_range'), 'Test 13: Should detect invalid_time_range');
    console.log('✅ Test 13 Passed: Detected invalid time range');
  }

  // 14. detectCalendarConflicts - Duplicate case
  {
    const proposed: ProposedSchedule = {
      date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 30,
      pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't'
    };
    const currCase: Partial<Case> = {
      id: 'case_curr_dup',
      calendarPlanningReviews: [{
        id: 'cpr_dup', caseId: 'case_curr_dup', planningReviewId: 'p1', dispatchReviewId: 'd1', status: 'scheduled', calendarEventId: 'evt_123',
        selectedVehicleId: 'v-1', selectedEmployeeIds: ['emp-1'], conflicts: [], warnings: [], readiness: 'ready', createdAt: '', updatedAt: '',
        proposedSchedule: proposed
      }] as any
    };
    const confs = detectCalendarConflicts(proposed, 'v-1', ['emp-1'], 'case_curr_dup', [currCase as Case]);
    assert(confs.some(c => c.type === 'duplicate_case'), 'Test 14: Should detect duplicate_case');
    console.log('✅ Test 14 Passed: Detected duplicate case');
  }

  // 15. detectCalendarConflicts - No conflicts
  {
    const proposed: ProposedSchedule = {
      date: '2026-09-15', jobStartTime: '08:00', estimatedEndTime: '12:00', estimatedDurationMinutes: 240, bufferMinutes: 30,
      pickupAddress: { street: 'a', city: 'b' }, destinationAddress: { street: 'c', city: 'd' }, title: 't'
    };
    const confs = detectCalendarConflicts(proposed, 'v-1', ['emp-1'], 'case_curr_clean', []);
    assert(confs.length === 0, 'Test 15: Should have zero conflicts');
    console.log('✅ Test 15 Passed: No conflicts for clean schedule');
  }

  // 16. Process Chain: DISPATCH_REVIEW_CONFIRMED -> createCalendarPlanningReview
  const caseItem = caseService.createCase({
    source: 'Test',
    priority: 'high',
    title: 'Umzug Integration Test',
    tags: ['Integration']
  });

  // Setup mock planning and dispatch reviews
  caseItem.planningReviews = [{
    id: 'pr_test_1',
    caseId: caseItem.id,
    customerId: 'c_1',
    offerDraftId: 'o_1',
    status: 'confirmed',
    readiness: 'ready',
    warnings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    planningData: {
      moveDate: '2026-10-01',
      timeWindow: '08:00',
      estimatedVolumeM3: 25,
      pickupAddress: { street: 'Startgasse 5', zip: '1010', city: 'Wien', floor: '2', elevator: false },
      destinationAddress: { street: 'Zielstraße 12', zip: '1020', city: 'Wien', floor: '1', elevator: true }
    }
  }];

  caseItem.dispatchReviews = [{
    id: 'dr_test_1',
    caseId: caseItem.id,
    planningReviewId: 'pr_test_1',
    status: 'pending',
    readiness: 'ready',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    vehicleSuggestion: [{ id: 'v-3_5t', vehicleType: '3,5t Transporter', count: 1, reason: 'Volumen', recommended: true }],
    crewSuggestion: [
      { id: 'c-driver', role: 'Fahrer', count: 1, reason: 'Führung', recommended: true },
      { id: 'c-mover', role: 'Möbelpacker', count: 2, reason: 'Tragen', recommended: true }
    ],
    durationSuggestion: { estimatedHours: 4, bufferHours: 1, reason: '4h Arbeitszeit' },
    riskAnalysis: []
  }];

  // Confirm dispatch review
  const confirmedReview = dispatchService.confirmDispatchReview(caseItem.id, 'dr_test_1');
  await new Promise(r => setTimeout(r, 200));

  const updatedCase = caseService.getCase(caseItem.id)!;
  assert(updatedCase.calendarPlanningReviews !== undefined && updatedCase.calendarPlanningReviews.length > 0, 'Test 16: calendarPlanningReviews created');
  const cpr = updatedCase.calendarPlanningReviews![0];
  console.log('✅ Test 16 Passed: DISPATCH_REVIEW_CONFIRMED triggered createCalendarPlanningReview');

  // 17. Review incorporates suggestions
  assert(cpr.selectedVehicleId === 'v-3_5t', 'Test 17: Vehicle suggested incorporated');
  assert(cpr.selectedEmployeeIds.length >= 3, 'Test 17: Employee count incorporated');
  console.log('✅ Test 17 Passed: Review creation incorporated vehicle & crew suggestions');

  // 18. Review sets Europe/Vienna time calculations
  assert(cpr.proposedSchedule.date === '2026-10-01', 'Test 18: Move date correctly set');
  assert(cpr.proposedSchedule.jobStartTime === '08:00', 'Test 18: Job start time set');
  assert(cpr.proposedSchedule.estimatedDurationMinutes === 300, 'Test 18: 4h (240m) + 1h buffer (60m) = 300m duration');
  assert(cpr.proposedSchedule.estimatedEndTime === '13:00', 'Test 18: 08:00 + 300m = 13:00');
  console.log('✅ Test 18 Passed: Time calculations and schedule properties correctly calculated');

  // 19. updateCalendarPlanningReview updates schedule and recalculates readiness
  let updatedEventEmitted = false;
  const updateListener = (evt: any) => {
    if (evt.type === 'CALENDAR_PLANNING_REVIEW_UPDATED') updatedEventEmitted = true;
  };
  workflowEngine.subscribe('event', updateListener);

  calendarPlanningService.updateCalendarPlanningReview(caseItem.id, cpr.id, {
    proposedSchedule: {
      date: '2026-10-02',
      jobStartTime: '09:00',
      estimatedDurationMinutes: 180,
      bufferMinutes: 30
    } as any,
    selectedVehicleId: 'v-7_5t'
  });

  const cprUpdated = caseService.getCase(caseItem.id)!.calendarPlanningReviews![0];
  assert(cprUpdated.status === 'edited', 'Test 19: Status updated to edited');
  assert(cprUpdated.proposedSchedule.date === '2026-10-02', 'Test 19: Date updated');
  assert(cprUpdated.proposedSchedule.estimatedEndTime === '12:00', 'Test 19: 09:00 + 180m = 12:00');
  console.log('✅ Test 19 Passed: updateCalendarPlanningReview updated properties & re-evaluated');

  // 20. Event emitted
  assert(updatedEventEmitted, 'Test 20: CALENDAR_PLANNING_REVIEW_UPDATED event emitted');
  console.log('✅ Test 20 Passed: CALENDAR_PLANNING_REVIEW_UPDATED event emitted');

  // 21. Confirm planning fails if missing mandatory fields (e.g. no vehicle selected)
  cprUpdated.selectedVehicleId = '';
  const confirmFailRes = calendarPlanningService.confirmCalendarPlanningReview(caseItem.id, cprUpdated.id);
  assert(confirmFailRes?.status === 'failed', 'Test 21: Confirmation failed due to missing vehicle');
  console.log('✅ Test 21 Passed: Confirm planning failed when readiness is missing_vehicle');

  // Restore vehicle for successful test
  calendarPlanningService.updateCalendarPlanningReview(caseItem.id, cprUpdated.id, {
    selectedVehicleId: 'v-7_5t'
  });

  // 22. Confirm planning succeeds when ready
  let createdEventEmitted = false;
  const createdListener = (evt: any) => {
    if (evt.type === 'CALENDAR_EVENT_CREATED') createdEventEmitted = true;
  };
  workflowEngine.subscribe('event', createdListener);

  const confirmSuccRes = calendarPlanningService.confirmCalendarPlanningReview(caseItem.id, cprUpdated.id)!;
  assert(confirmSuccRes.status === 'scheduled', 'Test 22: Status set to scheduled');
  assert(confirmSuccRes.calendarEventId !== undefined, 'Test 22: calendarEventId assigned');
  console.log('✅ Test 22 Passed: Confirm planning set status to "scheduled"');

  // 23. Confirm planning creates calendar event
  assert(confirmSuccRes.calendarEventId!.startsWith('evt_'), 'Test 23: Calendar event ID generated');
  console.log('✅ Test 23 Passed: Calendar event created in storage');

  // 24. Confirm planning updates Case status to Scheduled
  const scheduledCase = caseService.getCase(caseItem.id)!;
  assert(scheduledCase.status === 'Scheduled', 'Test 24: Case status set to Scheduled');
  console.log('✅ Test 24 Passed: Case status updated to "Scheduled"');

  // 25. Confirm planning completes task "Kalender vorbereiten"
  const prepTask = scheduledCase.tasks.find(t => t.title === 'Kalender vorbereiten');
  assert(prepTask !== undefined && prepTask.status === 'Completed', 'Test 25: Task Kalender vorbereiten completed');
  console.log('✅ Test 25 Passed: Task "Kalender vorbereiten" completed');

  // 26. Confirm planning creates task "Einsatz durchführen"
  const execTask = scheduledCase.tasks.find(t => t.title === 'Einsatz durchführen');
  assert(execTask !== undefined && execTask.status === 'Open', 'Test 26: Task Einsatz durchführen created');
  console.log('✅ Test 26 Passed: Task "Einsatz durchführen" created with status Open');

  // 27. Confirm planning adds timeline entry "Kalendereintrag erstellt"
  const timelineEntry = scheduledCase.timeline.find(t => t.title === 'Kalendereintrag erstellt');
  assert(timelineEntry !== undefined, 'Test 27: Timeline entry added');
  console.log('✅ Test 27 Passed: Timeline entry "Kalendereintrag erstellt" added');

  // 28. Confirm planning emits CALENDAR_EVENT_CREATED event
  assert(createdEventEmitted, 'Test 28: CALENDAR_EVENT_CREATED event emitted');
  console.log('✅ Test 28 Passed: CALENDAR_EVENT_CREATED event emitted');

  // 29. Idempotency check: Calling confirm again returns existing scheduled review
  const reConfirmRes = calendarPlanningService.confirmCalendarPlanningReview(caseItem.id, cprUpdated.id)!;
  assert(reConfirmRes.status === 'scheduled', 'Test 29: Re-confirm returns scheduled review');
  assert(scheduledCase.tasks.filter(t => t.title === 'Einsatz durchführen').length === 1, 'Test 29: No duplicate task created');
  console.log('✅ Test 29 Passed: Idempotency maintained, no duplicate entries created');

  // 30. Reject planning updates status to rejected
  const caseItem2 = caseService.createCase({ source: 'Test', priority: 'medium', title: 'Reject Test', tags: [] });
  caseItem2.dispatchReviews = [{
    id: 'dr_test_2', caseId: caseItem2.id, planningReviewId: 'p2', status: 'confirmed', readiness: 'ready', createdAt: '', updatedAt: '',
    vehicleSuggestion: [], crewSuggestion: [], durationSuggestion: { estimatedHours: 2, bufferHours: 0, reason: '' }, riskAnalysis: []
  }];
  const review2 = calendarPlanningService.createCalendarPlanningReview(caseItem2.id, 'dr_test_2')!;
  const rejRes = calendarPlanningService.rejectCalendarPlanningReview(caseItem2.id, review2.id, 'Unpassender Termin');
  assert(rejRes?.status === 'rejected', 'Test 30: Status rejected');
  const case2Updated = caseService.getCase(caseItem2.id)!;
  assert(case2Updated.timeline.some(t => t.title === 'Kalenderplanung abgelehnt'), 'Test 30: Reject timeline entry added');
  console.log('✅ Test 30 Passed: Reject planning updated status to "rejected" and added timeline entry');

  console.log('\n🎉 ALL 30 CALENDAR PLANNING TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
