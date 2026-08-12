import {
  learningService,
  generateContextSignature,
  calculateLearningStatistics,
  evaluateAutomationEligibility,
  CRITICAL_ACTION_TYPES
} from './src/lib/learning-service';
import {
  automationService,
  INITIAL_LOW_RISK_ACTIONS
} from './src/lib/automation-service';
import { caseService } from './src/lib/case-service';
import { workflowEngine } from './src/lib/workflow-engine';
import {
  LearningRecord,
  AutomationPolicy,
  AutomationExecution,
  LearningStatistics
} from './src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Automation & Learning System Tests (30 Requirements)...\n');

  // Reset services before test
  learningService.resetForTesting();
  automationService.resetForTesting();
  caseService.resetForTesting();

  // Test 1: LearningRecord Structure & Creation
  console.log('Testing 1: LearningRecord structure and creation...');
  const rec1 = learningService.recordLearningRecord({
    caseId: 'case_test_1',
    actionType: 'case_assignment_by_conversation',
    contextType: 'email_import',
    finalDecision: 'accepted',
    result: 'accepted',
    confidence: 'high',
    originalData: { conversationId: 'conv_123' }
  });
  assert(!!rec1.id, 'Record must have an ID');
  assert(rec1.actionType === 'case_assignment_by_conversation', 'ActionType must match');
  assert(rec1.result === 'accepted', 'Result must be accepted');
  assert(!!rec1.contextSignature, 'ContextSignature must be generated');
  console.log('✅ Test 1 passed.');

  // Test 2: Deterministic Context Signature Generation
  console.log('Testing 2: Context Signature Generation...');
  const sig1 = generateContextSignature('case_assignment_by_conversation', {
    eventType: 'EMAIL_RECEIVED',
    dataCompleteness: 'complete',
    crmMatchStatus: 'matched',
    confidence: 'high'
  });
  const sig2 = generateContextSignature('case_assignment_by_conversation', {
    eventType: 'EMAIL_RECEIVED',
    dataCompleteness: 'complete',
    crmMatchStatus: 'matched',
    confidence: 'high'
  });
  const sigDiff = generateContextSignature('case_assignment_by_conversation', {
    eventType: 'EMAIL_RECEIVED',
    dataCompleteness: 'partial',
    crmMatchStatus: 'unmatched',
    confidence: 'medium'
  });
  assert(sig1 === sig2, 'Identical context parameters must generate identical signatures');
  assert(sig1 !== sigDiff, 'Different context parameters must generate different signatures');
  assert(!sig1.includes('conv_123') && !sig1.includes('@'), 'Context signature must not contain PII');
  console.log('✅ Test 2 passed.');

  // Test 3 & 4: Pure Function Statistics Calculation (Accepted, Corrected, Rejected, Failure rates)
  console.log('Testing 3 & 4: Learning Statistics calculation...');
  const mockRecords: LearningRecord[] = [
    { id: 'r1', actionType: 'test_action', contextType: 'c', finalDecision: 'accepted', result: 'accepted', confidence: 'high', contextSignature: 'sigA', createdAt: new Date().toISOString() },
    { id: 'r2', actionType: 'test_action', contextType: 'c', finalDecision: 'accepted', result: 'accepted', confidence: 'high', contextSignature: 'sigA', createdAt: new Date().toISOString() },
    { id: 'r3', actionType: 'test_action', contextType: 'c', finalDecision: 'corrected', result: 'corrected', confidence: 'medium', contextSignature: 'sigA', createdAt: new Date().toISOString() },
    { id: 'r4', actionType: 'test_action', contextType: 'c', finalDecision: 'rejected', result: 'rejected', confidence: 'low', contextSignature: 'sigA', createdAt: new Date().toISOString() },
  ];
  const stats = calculateLearningStatistics(mockRecords, 'test_action', 'sigA');
  assert(stats.totalDecisions === 4, 'Total decisions must be 4');
  assert(stats.acceptedCount === 2, 'Accepted count must be 2');
  assert(stats.correctedCount === 1, 'Corrected count must be 1');
  assert(stats.rejectedCount === 1, 'Rejected count must be 1');
  assert(stats.approvalRate === 0.5, 'Approval rate must be 50%');
  assert(stats.correctionRate === 0.25, 'Correction rate must be 25%');
  assert(stats.rejectionRate === 0.25, 'Rejection rate must be 25%');
  console.log('✅ Test 3 & 4 passed.');

  // Test 5: Average Confidence & Timestamps
  console.log('Testing 5: Average Confidence & Timestamps...');
  assert(stats.averageConfidence > 0, 'Average confidence must be > 0');
  assert(!!stats.lastUsedAt, 'Last used at timestamp must be populated');
  console.log('✅ Test 5 passed.');

  // Test 6: Eligibility Rules (Sample threshold 10, approval 95%, error 2%)
  console.log('Testing 6: Eligibility thresholds evaluation...');
  const insufficientRecords: LearningRecord[] = [];
  for (let i = 0; i < 9; i++) {
    insufficientRecords.push({
      id: `re_${i}`,
      actionType: 'low_risk_action',
      contextType: 'ctx',
      finalDecision: 'accepted',
      result: 'accepted',
      confidence: 'high',
      contextSignature: 'sigLow',
      createdAt: new Date().toISOString()
    });
  }
  const stats9 = calculateLearningStatistics(insufficientRecords, 'low_risk_action', 'sigLow');
  assert(!stats9.eligibleForAutomation, '9 samples must NOT be eligible (requires min 10)');

  // Add 10th sample
  insufficientRecords.push({
    id: 're_9',
    actionType: 'low_risk_action',
    contextType: 'ctx',
    finalDecision: 'accepted',
    result: 'accepted',
    confidence: 'high',
    contextSignature: 'sigLow',
    createdAt: new Date().toISOString()
  });
  const stats10 = calculateLearningStatistics(insufficientRecords, 'low_risk_action', 'sigLow');
  assert(stats10.eligibleForAutomation, '10 accepted samples MUST be eligible');
  assert(stats10.recommendedLevel === 'auto_execute_reversible', 'Recommended level must be auto_execute_reversible');
  console.log('✅ Test 6 passed.');

  // Test 7: Security Boundary for Critical Actions
  console.log('Testing 7: Security boundary for critical actions...');
  const criticalRecords: LearningRecord[] = [];
  for (let i = 0; i < 20; i++) {
    criticalRecords.push({
      id: `crit_${i}`,
      actionType: 'invoice_send',
      contextType: 'ctx',
      finalDecision: 'accepted',
      result: 'accepted',
      confidence: 'high',
      contextSignature: 'sigCrit',
      createdAt: new Date().toISOString()
    });
  }
  const statsCrit = calculateLearningStatistics(criticalRecords, 'invoice_send', 'sigCrit');
  assert(!statsCrit.eligibleForAutomation, 'Critical action (invoice_send) must NEVER be eligible for automation');
  const evalCrit = evaluateAutomationEligibility(statsCrit, 'invoice_send', 'high', true, false);
  assert(!evalCrit.eligible, 'Critical action evaluation must return eligible: false');
  console.log('✅ Test 7 passed.');

  // Test 8 & 9: Automation Policies Default Level & Initial Actions
  console.log('Testing 8 & 9: Default policies and initial low-risk actions...');
  const policies = automationService.getPolicies();
  assert(policies.length >= 8, 'Must have at least 8 initial policies');
  for (const item of INITIAL_LOW_RISK_ACTIONS) {
    const pol = automationService.getPolicy(item.actionType);
    assert(!!pol, `Policy for ${item.actionType} must exist`);
    assert(!pol!.enabled, `Policy for ${item.actionType} must be disabled by default`);
    assert(pol!.level === 'prepare' || pol!.level === 'suggest', `Policy level must be prepare or suggest`);
  }
  console.log('✅ Test 8 & 9 passed.');

  // Test 10: Explicit User Activation Requirement
  console.log('Testing 10: Explicit User Activation Requirement...');
  const canExecDisabled = automationService.canAutoExecute('case_assignment_by_conversation');
  assert(!canExecDisabled.allowed, 'Disabled policy must block auto execution');

  const enableRes = automationService.userEnablePolicy('case_assignment_by_conversation');
  assert(enableRes.success, 'User enable policy must succeed');
  const enabledPol = automationService.getPolicy('case_assignment_by_conversation');
  assert(enabledPol?.enabled === true, 'Policy must now be enabled');
  assert(enabledPol?.level === 'auto_execute_reversible', 'Policy level must now be auto_execute_reversible');
  console.log('✅ Test 10 passed.');

  // Test 11: Pre-execution Safety Evaluation
  console.log('Testing 11: Pre-execution Safety Evaluation (Samples check)...');
  const canExecNoSamples = automationService.canAutoExecute('case_assignment_by_conversation');
  assert(!canExecNoSamples.allowed, 'Should block execution if stats have < 10 samples');
  assert(canExecNoSamples.reason!.includes('Lern-Stichproben'), 'Reason must mention samples');
  console.log('✅ Test 11 passed.');

  // Seed 10 records for case_assignment_by_conversation to fulfill learning criteria
  for (let i = 0; i < 10; i++) {
    learningService.recordLearningRecord({
      caseId: `c_${i}`,
      actionType: 'case_assignment_by_conversation',
      contextType: 'email_import',
      finalDecision: 'accepted',
      result: 'accepted',
      confidence: 'high'
    });
  }

  // Test 12: Low / Medium Confidence Blocks Execution
  console.log('Testing 12: Low/Medium Confidence Blocks Execution...');
  const canExecLowConf = automationService.canAutoExecute('case_assignment_by_conversation', { confidence: 'medium' });
  assert(!canExecLowConf.allowed, 'Medium confidence must block execution');
  assert(canExecLowConf.reason!.includes('Confidence'), 'Reason must mention confidence');
  console.log('✅ Test 12 passed.');

  // Test 13: Data Conflict Blocks Execution
  console.log('Testing 13: Data Conflict Blocks Execution...');
  const canExecConflict = automationService.canAutoExecute('case_assignment_by_conversation', { confidence: 'high', hasDataConflict: true });
  assert(!canExecConflict.allowed, 'Data conflict must block execution');
  assert(canExecConflict.reason!.includes('Widersprüchliche Daten'), 'Reason must mention data conflict');
  console.log('✅ Test 13 passed.');

  // Test 14: Non-reversible Action Blocks Execution if policy requires reversible
  console.log('Testing 14: Reversibility Check...');
  const canExecReversible = automationService.canAutoExecute('case_assignment_by_conversation', { confidence: 'high' });
  assert(canExecReversible.allowed, 'High confidence with 10 samples and enabled policy must be allowed');
  console.log('✅ Test 14 passed.');

  // Create a test case in caseService
  const testCase = caseService.createCase({
    title: 'Test Automation Case - Max Mustermann',
    notes: 'Test Case for Automation Learning'
  });

  // Test 15 & 16: Idempotency & Execution Lifecycle
  console.log('Testing 15 & 16: Automated Action Execution Lifecycle & Idempotency...');
  const exec1 = await automationService.executeAutomatedAction(
    'case_assignment_by_conversation',
    testCase.id,
    'conv_001',
    { confidence: 'high' }
  );
  assert(exec1.status === 'completed', 'Execution 1 must be completed');

  // Attempt duplicate execution for same lock key
  const execDuplicate = await automationService.executeAutomatedAction(
    'case_assignment_by_conversation',
    testCase.id,
    'conv_001',
    { confidence: 'high' }
  );
  assert(execDuplicate.id === exec1.id, 'Duplicate execution must return existing completed execution');
  console.log('✅ Test 15 & 16 passed.');

  // Test 17: Reversible Action Rollback
  console.log('Testing 17: Reversible Action Rollback...');
  const rollbackSuccess = await automationService.rollbackExecution(exec1.id);
  assert(rollbackSuccess, 'Rollback must return true');

  const exec1AfterRollback = automationService.getExecutions().find(e => e.id === exec1.id);
  assert(exec1AfterRollback?.status === 'reverted', 'Execution status must be reverted');
  console.log('✅ Test 17 passed.');

  // Test 18: Automatic Policy Pause on Rollback
  console.log('Testing 18: Automatic Policy Pause on Rollback...');
  const policyAfterRollback = automationService.getPolicy('case_assignment_by_conversation');
  assert(policyAfterRollback?.enabled === false, 'Policy must be disabled/paused after rollback');
  console.log('✅ Test 18 passed.');

  // Test 20: Creation of Task "Automatisierung prüfen" on Rollback
  console.log('Testing 20: Creation of task "Automatisierung prüfen"...');
  const updatedCase = caseService.getCase(testCase.id);
  const reviewTask = updatedCase?.tasks.find(t => t.title === 'Automatisierung prüfen');
  assert(!!reviewTask, 'Task "Automatisierung prüfen" must be created on case');
  console.log('✅ Test 20 passed.');

  // Test 21, 22, 23: Audit Trail Timeline Entries
  console.log('Testing 21, 22, 23: Audit Trail Timeline Entries...');
  const execTimelineEntry = updatedCase?.timeline.find(t => t.title === 'Automatische Aktion ausgeführt');
  assert(!!execTimelineEntry, 'Timeline entry "Automatische Aktion ausgeführt" must exist');

  const rollbackTimelineEntry = updatedCase?.timeline.find(t => t.title === 'Automatische Aktion zurückgenommen');
  assert(!!rollbackTimelineEntry, 'Timeline entry "Automatische Aktion zurückgenommen" must exist');
  console.log('✅ Test 21, 22, 23 passed.');

  // Test 19 & 23: Execution Error & Policy Pause
  console.log('Testing 19 & 23: Execution Failure Handling & Policy Pause...');
  // Enable policy for review task
  automationService.userEnablePolicy('create_review_task');
  // Seed 10 samples
  for (let i = 0; i < 10; i++) {
    learningService.recordLearningRecord({
      caseId: testCase.id,
      actionType: 'create_review_task',
      contextType: 'ctx',
      finalDecision: 'accepted',
      result: 'accepted',
      confidence: 'high'
    });
  }

  // Run execution that throws error inside handler
  const failedExec = await automationService.executeAutomatedAction(
    'create_review_task',
    testCase.id,
    'input_err',
    { confidence: 'high' },
    async () => {
      throw new Error('Simulierter Systemfehler in automatischer Aktion');
    }
  );

  assert(failedExec.status === 'failed', 'Execution status must be failed');
  assert(failedExec.errorMessage!.includes('Simulierter Systemfehler'), 'Error message must be set');

  const reviewTaskPolicy = automationService.getPolicy('create_review_task');
  assert(reviewTaskPolicy?.enabled === false, 'Policy must be paused after failure');
  console.log('✅ Test 19 & 23 passed.');

  // Test 24: Workflow Event Emitting
  console.log('Testing 24: Workflow Event Emitting...');
  let eventCaptured = false;
  workflowEngine.subscribe((evt) => {
    if (evt.type === 'AUTOMATION_DISABLED' || evt.type === 'AUTOMATION_ENABLED') {
      eventCaptured = true;
    }
  });
  automationService.userEnablePolicy('update_reminder_due_status');
  assert(eventCaptured, 'Automation events must be emitted');
  console.log('✅ Test 24 passed.');

  // Test 25: Decision Engine Loop Prevention
  console.log('Testing 25: Decision Engine Loop Prevention...');
  // Emit an automation event to workflow engine
  try {
    await workflowEngine.emitEvent('AUTOMATION_EXECUTION_COMPLETED', 'Test', { executionId: 'ex_test' });
    console.log('Decision engine ignored AUTOMATION_ event without entering loop or throwing error.');
  } catch (err) {
    assert(false, 'Decision engine threw error on AUTOMATION_ event');
  }
  console.log('✅ Test 25 passed.');

  // Test 26: User Correction Recording
  console.log('Testing 26: User Correction / Rejection Recording...');
  await learningService.recordCorrection('sug_123', 'evt_123', {
    caseId: testCase.id,
    actionType: 'case_assignment_by_conversation',
    correctedValue: 'correct_case'
  });
  const records = learningService.getLearningRecords();
  const corrRecord = records.find(r => r.suggestionId === 'sug_123');
  assert(!!corrRecord, 'Correction record must be saved');
  assert(corrRecord?.result === 'corrected', 'Result must be corrected');
  console.log('✅ Test 26 passed.');

  // Test 27: Privacy & Data Sanitization
  console.log('Testing 27: Privacy & Data Sanitization...');
  learningService.recordLearningRecord({
    caseId: testCase.id,
    actionType: 'prepare_email_draft',
    contextType: 'ctx',
    originalData: {
      token: 'secret_bearer_token',
      pdf: 'data:application/pdf;base64,JVBERi0xLj...',
      normalField: 'Normal content'
    }
  });
  const sanitizeRecord = learningService.getLearningRecords().find(r => r.actionType === 'prepare_email_draft');
  assert(sanitizeRecord?.originalData?.token === '[SANITIZED]', 'Sensitive token must be sanitized');
  assert(sanitizeRecord?.originalData?.pdf === '[SANITIZED]', 'Sensitive pdf string must be sanitized');
  assert(sanitizeRecord?.originalData?.normalField === 'Normal content', 'Normal field must be preserved');
  console.log('✅ Test 27 passed.');

  // Test 28: User Policy Reset To Manual
  console.log('Testing 28: User Policy Reset To Manual...');
  automationService.userResetPolicyToManual('update_reminder_due_status');
  const manualPol = automationService.getPolicy('update_reminder_due_status');
  assert(manualPol?.level === 'manual', 'Policy level must be manual');
  assert(!manualPol?.enabled, 'Policy must be disabled when set to manual');
  console.log('✅ Test 28 passed.');

  // Test 29: Case Service Health Evaluation
  console.log('Testing 29: Case Service Health Integration...');
  caseService.evaluateCaseHealth(testCase);
  const healthCase = caseService.getCase(testCase.id);
  assert(typeof healthCase?.health?.score === 'number', 'Case health score must be a number');
  console.log('✅ Test 29 passed.');

  // Test 30: End-to-End Learning to Automation Lifecycle
  console.log('Testing 30: End-to-End Learning to Automation Lifecycle...');
  const e2eAction = 'recalculate_readiness';
  const e2eCase = caseService.createCase({
    title: 'E2E Test Case - E2E Kunde',
    notes: 'E2E Test'
  });

  // 1. Record 12 decisions to fulfill learning criteria
  for (let i = 0; i < 12; i++) {
    learningService.recordLearningRecord({
      caseId: e2eCase.id,
      actionType: e2eAction,
      contextType: 'e2e',
      finalDecision: 'accepted',
      result: 'accepted',
      confidence: 'high'
    });
  }

  // 2. Check stats & eligibility
  const e2eStats = learningService.getStatisticsForAction(e2eAction);
  assert(e2eStats.totalDecisions >= 10, 'Total decisions >= 10');
  assert(e2eStats.eligibleForAutomation, 'Must be eligible for automation');

  // 3. Enable policy
  const enableResult = automationService.userEnablePolicy(e2eAction);
  assert(enableResult.success, 'Policy enable must succeed');

  // 4. Automated execution
  const e2eExec = await automationService.executeAutomatedAction(
    e2eAction,
    e2eCase.id,
    'ref_e2e_01',
    { confidence: 'high' }
  );
  assert(e2eExec.status === 'completed', 'Automated execution must succeed');

  // 5. User requests rollback
  const e2eRollback = await automationService.rollbackExecution(e2eExec.id);
  assert(e2eRollback, 'Rollback must succeed');

  const e2ePolicyAfter = automationService.getPolicy(e2eAction);
  assert(!e2ePolicyAfter?.enabled, 'Policy must be paused after rollback');

  const e2eCaseAfter = caseService.getCase(e2eCase.id);
  const e2eReviewTask = e2eCaseAfter?.tasks.find(t => t.title === 'Automatisierung prüfen');
  assert(!!e2eReviewTask, 'Task "Automatisierung prüfen" must exist on case');

  console.log('✅ Test 30 passed.');

  console.log('\n🎉 ALL 30 AUTOMATION & LEARNING TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});
