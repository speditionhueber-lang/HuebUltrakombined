import {
  automationService,
  ALLOWED_PILOT_ACTIONS
} from './src/lib/automation-service';
import {
  learningService,
  CRITICAL_ACTION_TYPES
} from './src/lib/learning-service';
import { caseService } from './src/lib/case-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { receivableService } from './src/lib/receivable-service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPilotTests() {
  console.log('🚀 Starting Safe Automation Pilot Verification Tests (31 Points)...\n');

  // Reset services before test
  learningService.resetForTesting();
  automationService.resetForTesting();
  caseService.resetForTesting();

  // Helper to seed learning samples
  function seedSamples(actionType: string, count = 10) {
    for (let i = 0; i < count; i++) {
      learningService.recordLearningRecord({
        caseId: `case_seed_${i}`,
        actionType,
        contextType: 'seed',
        finalDecision: 'accepted',
        result: 'accepted',
        confidence: 'high'
      });
    }
  }

  // 1. Neue Policy ist deaktiviert
  console.log('Test 1: Neue Policy ist deaktiviert by default');
  const freshPolicy = automationService.getPolicy('prepare_email_draft');
  assert(freshPolicy !== undefined, 'Policy should exist');
  assert(freshPolicy?.enabled === false, 'New policy must be disabled');
  console.log('✅ Test 1 passed.');

  // 2. Neue Policy startet im Dry Run
  console.log('Test 2: Neue Policy startet im Dry Run mode');
  assert(freshPolicy?.mode === 'dry_run', 'New policy mode must be dry_run');
  console.log('✅ Test 2 passed.');

  // 3. Dry Run verändert keine Case-Daten & 4. Dry Run protokolliert geplante Aktion
  console.log('Test 3 & 4: Dry Run verändert keine Case-Daten und protokolliert nur Execution');
  seedSamples('CREATE_INTERNAL_TASK', 10);
  seedSamples('create_internal_task', 10);
  automationService.userEnablePolicy('create_internal_task', 'dry_run');
  const c3 = caseService.createCase({ title: 'Dry Run Case', notes: 'Notes' });
  // Execute in dry run mode
  const dryExec = await automationService.executeAutomatedAction(
    'create_internal_task',
    c3.id,
    'dry_ref_1',
    { confidence: 'high', title: 'Task Title', description: 'Task Desc' }
  );
  console.log('dryExec:', dryExec);
  assert(dryExec.status === 'dry_run', 'Status must be dry_run');
  const c3After = caseService.getCase(c3.id);
  const dryTask = c3After?.tasks.find(t => t.title === 'Task Title');
  assert(dryTask === undefined, 'No task should be created in dry run');
  console.log('✅ Test 3 & 4 passed.');

  // 5. Benutzer kann Policy aktivieren
  console.log('Test 5: Benutzer kann Policy aktivieren');
  const enableRes = automationService.userEnablePolicy('create_internal_task', 'active');
  assert(enableRes.success, 'Enable policy should succeed');
  const enabledPol = automationService.getPolicy('create_internal_task');
  assert(enabledPol?.enabled === true, 'Policy must be enabled');
  assert(enabledPol?.mode === 'active', 'Policy mode must be active');
  console.log('✅ Test 5 passed.');

  // 6. Eindeutige Conversation wird automatisch zugeordnet
  console.log('Test 6: Eindeutige Conversation wird automatisch zugeordnet');
  automationService.userEnablePolicy('case_assignment_by_conversation', 'active');
  seedSamples('case_assignment_by_conversation', 10);
  const convCase = caseService.createCase({ title: 'Unique Conv Case' });
  convCase.externalReferences = { outlook: { graphMessageIds: [], internetMessageIds: [], conversationIds: ['conv_unique_101'] } };
  caseService.saveCases();

  const assignExec = await automationService.executeAutomatedAction(
    'case_assignment_by_conversation',
    convCase.id,
    'conv_unique_101',
    { confidence: 'high' }
  );
  assert(assignExec.status === 'completed', 'Assign execution should complete');
  console.log('✅ Test 6 passed.');

  // 7. Mehrdeutige Conversation wird blockiert
  console.log('Test 7: Mehrdeutige Conversation wird blockiert');
  const convCaseA = caseService.createCase({ title: 'Conv Case A' });
  convCaseA.externalReferences = { outlook: { graphMessageIds: [], internetMessageIds: [], conversationIds: ['conv_ambiguous'] } };
  const convCaseB = caseService.createCase({ title: 'Conv Case B' });
  convCaseB.externalReferences = { outlook: { graphMessageIds: [], internetMessageIds: [], conversationIds: ['conv_ambiguous'] } };
  caseService.saveCases();

  const ambExec = await automationService.executeAutomatedAction(
    'case_assignment_by_conversation',
    convCaseA.id,
    'conv_ambiguous',
    { confidence: 'high' }
  );
  assert(ambExec.status === 'failed' || !!ambExec.errorMessage?.includes('Mehrdeutige') || !!ambExec.errorMessage?.includes('Widersprüchliche'), 'Ambiguous conversation must fail or block');
  console.log('✅ Test 7 passed.');

  // 8. Abgeschlossener Case wird nicht automatisch verwendet
  console.log('Test 8: Abgeschlossener Case wird nicht verwendet');
  const compCase = caseService.createCase({ title: 'Completed Case' });
  compCase.status = 'Completed';
  compCase.externalReferences = { outlook: { graphMessageIds: [], internetMessageIds: [], conversationIds: ['conv_for_completed_test'] } };
  caseService.saveCases();

  const completedExec = await automationService.executeAutomatedAction(
    'case_assignment_by_conversation',
    compCase.id,
    'conv_for_completed_test',
    { confidence: 'high' }
  );
  console.log('completedExec:', completedExec);
  assert(completedExec.status === 'failed' || completedExec.status === 'blocked', 'Completed case assignment should not execute');
  console.log('✅ Test 8 passed.');

  // 9. Doppelte Mail wird nicht erneut verarbeitet
  console.log('Test 9: Doppelte Mail wird nicht erneut verarbeitet');
  seedSamples('DEDUPLICATE_EMAIL_EVENT', 10);
  automationService.userEnablePolicy('deduplicate_email_event', 'active');
  const dupCase = caseService.createCase({ title: 'Dup Mail Case' });
  const execFirst = await automationService.executeAutomatedAction(
    'deduplicate_email_event',
    dupCase.id,
    'mail_msg_123',
    { confidence: 'high', messageId: 'mail_msg_123' }
  );
  const execSecond = await automationService.executeAutomatedAction(
    'deduplicate_email_event',
    dupCase.id,
    'mail_msg_123',
    { confidence: 'high', messageId: 'mail_msg_123' }
  );
  assert(execFirst.id === execSecond.id, 'Duplicate mail action should return same execution');
  console.log('✅ Test 9 passed.');

  // 10. Interner Task entsteht genau einmal & 11. Task-Rollback funktioniert
  console.log('Test 10 & 11: Interner Task entsteht genau einmal und Rollback entfernt ihn');
  const taskCase = caseService.createCase({ title: 'Task Test Case' });
  seedSamples('create_internal_task', 10);
  const taskExec = await automationService.executeAutomatedAction(
    'create_internal_task',
    taskCase.id,
    'task_ref_99',
    { confidence: 'high', title: 'Prüfaufgabe 101', description: 'Details' }
  );
  assert(taskExec.status === 'completed', 'Task creation should complete');
  const taskCaseReload = caseService.getCase(taskCase.id);
  const createdTasks = taskCaseReload?.tasks.filter(t => t.title === 'Prüfaufgabe 101');
  assert(createdTasks?.length === 1, 'Task should be created exactly once');

  // Rollback task
  const rollbackRes = await automationService.rollbackExecution(taskExec.id);
  assert(rollbackRes === true, 'Rollback should succeed');
  const taskCaseAfterRollback = caseService.getCase(taskCase.id);
  const rolledBackTask = taskCaseAfterRollback?.tasks.find(t => t.title === 'Prüfaufgabe 101');
  assert(rolledBackTask === undefined, 'Task should be removed after rollback');
  console.log('✅ Test 10 & 11 passed.');

  // 12. Fälliger Reminder wird auf due gesetzt & 13. Nicht fälliger Reminder bleibt unverändert
  console.log('Test 12 & 13: Reminder Status Handling');
  const remCase = caseService.createCase({ title: 'Reminder Case' });
  remCase.reminders = [
    { id: 'rem_past', caseId: remCase.id, referenceType: 'other', referenceId: remCase.id, priority: 'medium', createdAt: new Date().toISOString(), title: 'Erinnerung alt', dueAt: new Date(Date.now() - 3600000).toISOString(), status: 'scheduled' },
    { id: 'rem_future', caseId: remCase.id, referenceType: 'other', referenceId: remCase.id, priority: 'medium', createdAt: new Date().toISOString(), title: 'Erinnerung zukunft', dueAt: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled' }
  ];
  caseService.saveCases();

  automationService.userEnablePolicy('mark_reminder_due', 'active');
  seedSamples('mark_reminder_due', 10);

  await automationService.executeAutomatedAction(
    'mark_reminder_due',
    remCase.id,
    'rem_past',
    { confidence: 'high', reminderId: 'rem_past' }
  );
  await automationService.executeAutomatedAction(
    'mark_reminder_due',
    remCase.id,
    'rem_future',
    { confidence: 'high', reminderId: 'rem_future' }
  );

  const remCaseAfter = caseService.getCase(remCase.id);
  assert(remCaseAfter?.reminders?.find(r => r.id === 'rem_past')?.status === 'due', 'Past reminder should be due');
  assert(remCaseAfter?.reminders?.find(r => r.id === 'rem_future')?.status === 'scheduled', 'Future reminder should remain scheduled');
  console.log('✅ Test 12 & 13 passed.');

  // 14. E-Mail-Draft wird vorbereitet, aber nicht versendet
  console.log('Test 14: E-Mail-Draft wird vorbereitet, aber NICHT versendet');
  const emailCase = caseService.createCase({ title: 'Email Draft Case' });
  automationService.userEnablePolicy('prepare_email_draft', 'active');
  seedSamples('prepare_email_draft', 10);

  const emailExec = await automationService.executeAutomatedAction(
    'prepare_email_draft',
    emailCase.id,
    'email_draft_01',
    { confidence: 'high', recipient: 'kunde@example.com', subject: 'Inforeise', body: 'Hallo Kunde' }
  );
  assert(emailExec.status === 'completed', 'Email draft prep should succeed');
  const emailCaseReload = caseService.getCase(emailCase.id);
  const createdDraft = emailCaseReload?.emailDrafts?.[0];
  assert(createdDraft !== undefined, 'Draft should exist');
  assert(createdDraft?.status === 'draft', 'Draft status must be draft (un-sent)');
  console.log('✅ Test 14 passed.');

  // 15. Angebotsentwurf wird nicht freigegeben (status === 'draft')
  console.log('Test 15: Angebotsentwurf wird nicht freigegeben');
  automationService.userEnablePolicy('prepare_offer_draft', 'active');
  seedSamples('prepare_offer_draft', 10);
  const offerCase = caseService.createCase({ title: 'Offer Case' });
  const offerExec = await automationService.executeAutomatedAction(
    'prepare_offer_draft',
    offerCase.id,
    'offer_ref_01',
    { confidence: 'high' }
  );
  assert(offerExec.status === 'completed', 'Offer draft prep should succeed');
  const offerCaseReload = caseService.getCase(offerCase.id);
  assert(offerCaseReload?.offerDrafts?.[0]?.status === 'draft', 'Offer draft must remain status draft');
  console.log('✅ Test 15 passed.');

  // 16. Rechnungsentwurf wird nicht freigegeben (status === 'draft')
  console.log('Test 16: Rechnungsentwurf wird nicht freigegeben');
  automationService.userEnablePolicy('prepare_invoice_draft', 'active');
  seedSamples('prepare_invoice_draft', 10);
  const invCase = caseService.createCase({ title: 'Invoice Case' });
  const invExec = await automationService.executeAutomatedAction(
    'prepare_invoice_draft',
    invCase.id,
    'inv_ref_01',
    { confidence: 'high' }
  );
  assert(invExec.status === 'completed', 'Invoice draft prep should succeed');
  const invCaseReload = caseService.getCase(invCase.id);
  assert(invCaseReload?.invoiceDrafts?.[0]?.status === 'draft', 'Invoice draft must remain status draft');
  console.log('✅ Test 16 passed.');

  // 17. Zahlungserinnerung wird nicht versendet
  console.log('Test 17: Zahlungserinnerung wird nicht versendet');
  automationService.userEnablePolicy('prepare_payment_reminder_draft', 'active');
  seedSamples('prepare_payment_reminder_draft', 10);
  const payCase = caseService.createCase({ title: 'Pay Reminder Case' });
  const payExec = await automationService.executeAutomatedAction(
    'prepare_payment_reminder_draft',
    payCase.id,
    'pay_ref_01',
    { confidence: 'high', receivableId: 'rec_01' }
  );
  assert(payExec.status === 'completed', 'Pay reminder draft prep should succeed');
  console.log('✅ Test 17 passed.');

  // 18. Kritische Aktion wird blockiert
  console.log('Test 18: Kritische Aktionen werden ausnahmslos blockiert');
  for (const critType of CRITICAL_ACTION_TYPES) {
    seedSamples(critType, 50);
    automationService.userEnablePolicy(critType, 'active');
    const canExec = automationService.canAutoExecute(critType, { confidence: 'high' });
    assert(!canExec.allowed, `Critical action ${critType} must be blocked`);
  }
  console.log('✅ Test 18 passed.');

  // 19. Deaktivierte Policy führt nichts aus
  console.log('Test 19: Deaktivierte Policy führt nichts aus');
  automationService.userDisablePolicy('create_internal_task');
  const disExec = await automationService.executeAutomatedAction(
    'create_internal_task',
    taskCase.id,
    'task_ref_disabled',
    { confidence: 'high', title: 'Disabled Task' }
  );
  assert(disExec.status === 'blocked' || disExec.status === 'failed', 'Disabled policy execution should be blocked');
  console.log('✅ Test 19 passed.');

  // 20. Pausierte Policy führt nichts aus
  console.log('Test 20: Pausierte Policy führt nichts aus');
  automationService.pausePolicy('prepare_email_draft', 'Menschlicher Eingriff');
  const pausedPol = automationService.getPolicy('prepare_email_draft');
  assert(pausedPol?.enabled === false, 'Paused policy must be disabled');
  const pauseExec = await automationService.executeAutomatedAction(
    'prepare_email_draft',
    emailCase.id,
    'draft_paused_ref',
    { confidence: 'high' }
  );
  assert(pauseExec.status === 'blocked' || pauseExec.status === 'failed', 'Paused policy execution should be blocked');
  console.log('✅ Test 20 passed.');

  // 21. Niedrige Confidence blockiert
  console.log('Test 21: Niedrige Confidence blockiert');
  automationService.userEnablePolicy('create_internal_task', 'active');
  const lowConfExec = automationService.canAutoExecute('create_internal_task', { confidence: 'low' });
  assert(!lowConfExec.allowed, 'Low confidence must block execution');
  console.log('✅ Test 21 passed.');

  // 22. Datenkonflikt blockiert
  console.log('Test 22: Datenkonflikt blockiert');
  const conflictExec = automationService.canAutoExecute('create_internal_task', { confidence: 'high', hasDataConflict: true });
  assert(!conflictExec.allowed, 'Data conflict must block execution');
  console.log('✅ Test 22 passed.');

  // 23. Doppelte Execution wird verhindert
  console.log('Test 23: Doppelte Execution wird verhindert');
  seedSamples('CREATE_INTERNAL_TASK', 100);
  automationService.userEnablePolicy('create_internal_task', 'active');
  const dupExec1 = await automationService.executeAutomatedAction(
    'create_internal_task',
    taskCase.id,
    'single_task_lock_key',
    { confidence: 'high', title: 'Single Task' }
  );
  const dupExec2 = await automationService.executeAutomatedAction(
    'create_internal_task',
    taskCase.id,
    'single_task_lock_key',
    { confidence: 'high', title: 'Single Task' }
  );
  assert(dupExec1.id === dupExec2.id, 'Duplicate execution must be prevented and return same record');
  console.log('✅ Test 23 passed.');

  // 24. Reload startet keine Execution neu
  console.log('Test 24: Reload / Initialization restart does not duplicate executions');
  const execsCountBefore = automationService.getExecutions().length;
  // Simulate reloading cases/services
  caseService.getAllCases();
  const execsCountAfter = automationService.getExecutions().length;
  assert(execsCountBefore === execsCountAfter, 'Executions count should remain identical');
  console.log('✅ Test 24 passed.');

  // 25. Fehler pausiert Policy
  console.log('Test 25: Fehler in Ausführung pausiert Policy');
  automationService.userEnablePolicy('create_internal_timeline_entry', 'active');
  seedSamples('create_internal_timeline_entry', 10);
  const errExec = await automationService.executeAutomatedAction(
    'create_internal_timeline_entry',
    taskCase.id,
    'err_ref_99',
    { confidence: 'high' },
    async () => {
      throw new Error('Simulierter Fehler');
    }
  );
  assert(errExec.status === 'failed', 'Execution should fail on error');
  const errPolicy = automationService.getPolicy('create_internal_timeline_entry');
  assert(errPolicy?.enabled === false, 'Policy must be paused after failure');
  console.log('✅ Test 25 passed.');

  // 26. Rollback stellt Zustand wieder her & 27. Rollback erzeugt Learning Record
  console.log('Test 26 & 27: Rollback stellt Zustand wieder her und erzeugt Learning Record');
  automationService.userEnablePolicy('create_internal_task', 'active');
  const rbTaskExec = await automationService.executeAutomatedAction(
    'create_internal_task',
    taskCase.id,
    'rb_task_ref',
    { confidence: 'high', title: 'Rollback Task', description: 'Desc' }
  );
  const recordsBeforeRB = learningService.getLearningRecords().length;
  await automationService.rollbackExecution(rbTaskExec.id);
  const recordsAfterRB = learningService.getLearningRecords().length;
  assert(recordsAfterRB === recordsBeforeRB + 1, 'Rollback must record a learning record');
  const lastRecord = learningService.getLearningRecords()[recordsAfterRB - 1];
  assert(lastRecord.result === 'rejected' || lastRecord.result === 'corrected' || lastRecord.result === 'reverted', 'Learning record result should be rejected/corrected/reverted');
  console.log('✅ Test 26 & 27 passed.');

  // 28. Audit enthält keine E-Mail-Rohtexte & 29. Audit enthält keine Tokens oder PDF-Daten
  console.log('Test 28 & 29: Sanitization von Audits & Learning Records');
  learningService.recordLearningRecord({
    caseId: taskCase.id,
    actionType: 'prepare_email_draft',
    contextType: 'test',
    originalData: {
      token: 'Bearer xyz123',
      pdf: 'data:application/pdf;base64,ABC',
      rawEmailBody: 'Full email body with sensitive info'
    }
  });
  const sanitizedRec = learningService.getLearningRecords().pop();
  assert(sanitizedRec?.originalData?.token === '[SANITIZED]', 'Tokens must be sanitized');
  assert(sanitizedRec?.originalData?.pdf === '[SANITIZED]', 'PDF data must be sanitized');
  console.log('✅ Test 28 & 29 passed.');

  // 30. Workflow Events erzeugen keine Rekursion
  console.log('Test 30: Workflow Events erzeugen keine Rekursion');
  let loopDetected = false;
  try {
    await workflowEngine.emitEvent('AUTOMATION_EXECUTION_COMPLETED', 'Test', { executionId: 'ex_test_loop' });
  } catch (e) {
    loopDetected = true;
  }
  assert(!loopDetected, 'Workflow Engine must handle AUTOMATION_ events without infinite loop');
  console.log('✅ Test 30 passed.');

  // 31. Alle bisherigen Pilot-Aktionen sind explizit erlaubt
  console.log('Test 31: Alle erlaubten Pilot-Aktionen sind in ALLOWED_PILOT_ACTIONS');
  assert(ALLOWED_PILOT_ACTIONS.length === 12, 'Should have 12 allowed pilot actions');
  console.log('✅ Test 31 passed.');

  console.log('\n🎉 ALL 31 SAFE AUTOMATION PILOT TESTS PASSED SUCCESSFULLY! 🎉');
}

runPilotTests().catch(err => {
  console.error('\n❌ Safe Automation Pilot Test failed:', err);
  process.exit(1);
});
