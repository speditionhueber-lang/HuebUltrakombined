import { emailTriageService } from './src/lib/email-triage-service';
import { caseService } from './src/lib/case-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { automationService } from './src/lib/automation-service';
import { learningService } from './src/lib/learning-service';
import { crmLookupService } from './src/lib/crm-lookup-service';
import { emailDraftService } from './src/lib/email-draft-service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Automated Email Triage & Draft Preparation Tests...\n');
  let passedCount = 0;

  // Setup / Reset state
  emailTriageService.resetForTesting();
  caseService.resetForTesting();
  learningService.resetForTesting();
  automationService.resetForTesting();

  // Test 1: Deduplication
  console.log('Test 1: Deduplication');
  const event1 = workflowEngine.emitEvent('EMAIL_RECEIVED', 'Outlook', {
    graphMessageId: 'msg_dup_100',
    subject: 'Neue Anfrage Umzug',
    bodyText: 'Ich möchte im Mai von Wien nach Graz umziehen.',
    senderEmail: 'klaus.test@example.com',
    senderName: 'Klaus Test'
  });
  const record1a = emailTriageService.processEmailTriage(event1);
  const record1b = emailTriageService.processEmailTriage(event1);
  assert(record1a.id === record1b.id, 'Duplicate message event must return identical triage record');
  console.log('✅ Test 1 PASSED: Deduplication works correctly');
  passedCount++;

  // Test 2: Category - new_customer_inquiry
  console.log('Test 2: Classification - new_customer_inquiry');
  const analysis2 = emailTriageService.analyzeEmailContent({
    subject: 'Anfrage Umzugsangebot 3 Zimmer',
    bodyText: 'Hallo, ich suche ein Angebot für meinen Umzug im Juni. Viele Grüße.'
  });
  assert(analysis2.category === 'new_customer_inquiry', `Expected new_customer_inquiry, got ${analysis2.category}`);
  console.log('✅ Test 2 PASSED: Category new_customer_inquiry detected');
  passedCount++;

  // Test 3: Category - existing_customer_update
  console.log('Test 3: Classification - existing_customer_update');
  const analysis3 = emailTriageService.analyzeEmailContent({
    subject: 'Termin verschieben und neue Adresse',
    bodyText: 'Sehr geehrte Damen und Herren, bitte ändern Sie den Umzugstermin auf den 15.08.'
  });
  assert(analysis3.category === 'existing_customer_update', `Expected existing_customer_update, got ${analysis3.category}`);
  console.log('✅ Test 3 PASSED: Category existing_customer_update detected');
  passedCount++;

  // Test 4: Category - missing_information_response
  console.log('Test 4: Classification - missing_information_response');
  const analysis4 = emailTriageService.analyzeEmailContent({
    subject: 'Nachreichung Unterlagen',
    bodyText: 'Hier sind die geforderten Fotos und die genaue Adresse lautet Hauptstraße 5.'
  });
  assert(analysis4.category === 'missing_information_response', `Expected missing_information_response, got ${analysis4.category}`);
  console.log('✅ Test 4 PASSED: Category missing_information_response detected');
  passedCount++;

  // Test 5: Category - offer_response
  console.log('Test 5: Classification - offer_response');
  const analysis5 = emailTriageService.analyzeEmailContent({
    subject: 'Re: Angebot ANG-2026-001',
    bodyText: 'Vielen Dank, ich nehme das Angebot hiermit an.'
  });
  assert(analysis5.category === 'offer_response', `Expected offer_response, got ${analysis5.category}`);
  assert(analysis5.recognizedReferences.offerNumber === 'ANG-2026-001', 'Offer number reference recognized');
  console.log('✅ Test 5 PASSED: Category offer_response detected');
  passedCount++;

  // Test 6: Category - invoice_question
  console.log('Test 6: Classification - invoice_question');
  const analysis6 = emailTriageService.analyzeEmailContent({
    subject: 'Frage zu Rechnung RE-2026-042',
    bodyText: 'Guten Tag, können Sie mir die Rechnungsnummer auf der MwSt Aufschlüsselung erklären?'
  });
  assert(analysis6.category === 'invoice_question', `Expected invoice_question, got ${analysis6.category}`);
  assert(analysis6.recognizedReferences.invoiceNumber === 'RE-2026-042', 'Invoice number reference recognized');
  console.log('✅ Test 6 PASSED: Category invoice_question detected');
  passedCount++;

  // Test 7: Category - payment_notification
  console.log('Test 7: Classification - payment_notification');
  const analysis7 = emailTriageService.analyzeEmailContent({
    subject: 'Zahlungsbestätigung',
    bodyText: 'Ich habe den Betrag von 450 EUR eben überwiesen. Anbei die Bestätigung.'
  });
  assert(analysis7.category === 'payment_notification', `Expected payment_notification, got ${analysis7.category}`);
  console.log('✅ Test 7 PASSED: Category payment_notification detected');
  passedCount++;

  // Test 8: Category - complaint
  console.log('Test 8: Classification - complaint');
  const analysis8 = emailTriageService.analyzeEmailContent({
    subject: 'Beschwerde wegen Schaden beim Umzug',
    bodyText: 'Unser Fernseher ist beschädigt worden. Ich erwarte umgehend eine Rückmeldung!'
  });
  assert(analysis8.category === 'complaint', `Expected complaint, got ${analysis8.category}`);
  assert(analysis8.isHighRisk === true, 'Complaint must be flagged as high risk');
  console.log('✅ Test 8 PASSED: Category complaint & high risk detected');
  passedCount++;

  // Test 9: Category - appointment_request
  console.log('Test 9: Classification - appointment_request');
  const analysis9 = emailTriageService.analyzeEmailContent({
    subject: 'Besichtigungstermin vereinbaren',
    bodyText: 'Wann haben Sie Zeit für einen Vor-Ort-Termin zur Besichtigung?'
  });
  assert(analysis9.category === 'appointment_request', `Expected appointment_request, got ${analysis9.category}`);
  console.log('✅ Test 9 PASSED: Category appointment_request detected');
  passedCount++;

  // Test 10: Category - general_question
  console.log('Test 10: Classification - general_question');
  const analysis10 = emailTriageService.analyzeEmailContent({
    subject: 'Frage zu den Öfffnungszeiten und Parken',
    bodyText: 'Wie sind Ihre Öffnungszeiten am Wochenende und gibt es Parkplätze?'
  });
  assert(analysis10.category === 'general_question', `Expected general_question, got ${analysis10.category}`);
  console.log('✅ Test 10 PASSED: Category general_question detected');
  passedCount++;

  // Test 11: Category - spam_or_irrelevant
  console.log('Test 11: Classification - spam_or_irrelevant');
  const analysis11 = emailTriageService.analyzeEmailContent({
    subject: 'Win a free lottery ticket',
    bodyText: 'Click here to claim your casino bonus crypto winnings unsub.'
  });
  assert(analysis11.category === 'spam_or_irrelevant', `Expected spam_or_irrelevant, got ${analysis11.category}`);
  console.log('✅ Test 11 PASSED: Category spam_or_irrelevant detected');
  passedCount++;

  // Test 12: Category - unclear
  console.log('Test 12: Classification - unclear');
  const analysis12 = emailTriageService.analyzeEmailContent({
    subject: '...',
    bodyText: 'Ok'
  });
  assert(analysis12.category === 'unclear', `Expected unclear, got ${analysis12.category}`);
  console.log('✅ Test 12 PASSED: Category unclear detected');
  passedCount++;

  // Test 13: Case Precedence 1 - conversationId
  console.log('Test 13: Case Precedence 1 - conversationId');
  const case13 = caseService.createCase({
    status: 'In Progress',
    source: 'Test',
    priority: 'medium',
    confidence: 'high',
    title: 'Case Conv 1'
  });
  case13.externalReferences = {
    outlook: {
      graphMessageIds: [],
      internetMessageId: [],
      conversationIds: ['conv_12345']
    } as any
  };
  caseService.saveCases();

  const res13 = emailTriageService.resolveCaseAssignment({
    category: 'general_question',
    confidence: 'high',
    reasoning: '',
    recognizedReferences: { conversationId: 'conv_12345' },
    recommendedAction: '',
    missingInformation: [],
    potentialRisks: []
  }, { conversationId: 'conv_12345' });

  assert(res13.matchType === 'exact', 'Precedence 1 conversationId match should be exact');
  assert(res13.assignedCaseId === case13.id, 'Should match case by conversationId');
  console.log('✅ Test 13 PASSED: conversationId match works');
  passedCount++;

  // Test 14: Case Precedence 2 - internetMessageId
  console.log('Test 14: Case Precedence 2 - internetMessageId');
  const case14 = caseService.createCase({
    status: 'In Progress',
    source: 'Test',
    priority: 'medium',
    confidence: 'high',
    title: 'Case Msg 1'
  });
  case14.externalReferences = {
    outlook: {
      graphMessageIds: [],
      internetMessageIds: ['<msg_xyz@mail.com>'],
      conversationIds: []
    }
  };
  caseService.saveCases();

  const res14 = emailTriageService.resolveCaseAssignment({
    category: 'general_question',
    confidence: 'high',
    reasoning: '',
    recognizedReferences: { internetMessageId: '<msg_xyz@mail.com>' },
    recommendedAction: '',
    missingInformation: [],
    potentialRisks: []
  }, { internetMessageId: '<msg_xyz@mail.com>' });

  assert(res14.matchType === 'exact', 'Precedence 2 internetMessageId match should be exact');
  assert(res14.assignedCaseId === case14.id, 'Should match case by internetMessageId');
  console.log('✅ Test 14 PASSED: internetMessageId match works');
  passedCount++;

  // Test 15: Case Precedence 3 - customerId
  console.log('Test 15: Case Precedence 3 - customerId');
  const case15 = caseService.createCase({
    status: 'In Progress',
    source: 'Test',
    priority: 'medium',
    confidence: 'high',
    customerId: 'cust_spec_999',
    title: 'Case Cust 1'
  });

  const res15 = emailTriageService.resolveCaseAssignment({
    category: 'general_question',
    confidence: 'high',
    reasoning: '',
    recognizedReferences: { customerId: 'cust_spec_999' },
    recommendedAction: '',
    missingInformation: [],
    potentialRisks: []
  }, { customerId: 'cust_spec_999' });

  assert(res15.matchType === 'exact', 'Precedence 3 customerId match should be exact');
  assert(res15.assignedCaseId === case15.id, 'Should match case by customerId');
  console.log('✅ Test 15 PASSED: customerId match works');
  passedCount++;

  // Test 16: Case Precedence 4 - Offer / Invoice Number
  console.log('Test 16: Case Precedence 4 - Offer / Invoice Number');
  const case16 = caseService.createCase({
    status: 'Waiting for Confirmation',
    source: 'Test',
    priority: 'medium',
    confidence: 'high',
    title: 'Case Offer 1'
  });
  case16.offerDrafts = [{
    id: 'off_1',
    caseId: case16.id,
    customerId: 'c1',
    status: 'sent',
    offerType: 'binding',
    documentNumber: 'ANG-2026-777',
    currency: 'EUR',
    items: [],
    subtotalNet: 100,
    netTotal: 100,
    vatRate: 20,
    vatAmount: 20,
    grossTotal: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    corrections: []
  }];
  caseService.saveCases();

  const res16 = emailTriageService.resolveCaseAssignment({
    category: 'offer_response',
    confidence: 'high',
    reasoning: '',
    recognizedReferences: { offerNumber: 'ANG-2026-777' },
    recommendedAction: '',
    missingInformation: [],
    potentialRisks: []
  }, {});

  assert(res16.matchType === 'exact', 'Precedence 4 offer number match should be exact');
  assert(res16.assignedCaseId === case16.id, 'Should match case by offer number');
  console.log('✅ Test 16 PASSED: Offer/Invoice number match works');
  passedCount++;

  // Test 17: Case Precedence 5 - Unique Email Address
  console.log('Test 17: Case Precedence 5 - Unique Email Address');
  const case17 = caseService.createCase({
    status: 'Planning',
    source: 'Test',
    priority: 'medium',
    confidence: 'high',
    title: 'Case Unique Email'
  });
  (case17 as any).email = 'unique.client@example.org';
  caseService.saveCases();

  const res17 = emailTriageService.resolveCaseAssignment({
    category: 'general_question',
    confidence: 'medium',
    reasoning: '',
    recognizedReferences: {},
    recommendedAction: '',
    missingInformation: [],
    potentialRisks: []
  }, { senderEmail: 'unique.client@example.org' });

  assert(res17.matchType === 'exact', 'Precedence 5 email match should be exact');
  assert(res17.assignedCaseId === case17.id, 'Should match case by unique email address');
  console.log('✅ Test 17 PASSED: Unique Email address match works');
  passedCount++;

  // Test 18: Multiple Matches Block Auto-Assignment
  console.log('Test 18: Multiple Matches Block Auto-Assignment');
  const case18a = caseService.createCase({
    status: 'Planning',
    source: 'Test',
    priority: 'medium',
    confidence: 'high',
    title: 'Case Multi A'
  });
  (case18a as any).email = 'multi.client@example.com';

  const case18b = caseService.createCase({
    status: 'In Progress',
    source: 'Test',
    priority: 'medium',
    confidence: 'high',
    title: 'Case Multi B'
  });
  (case18b as any).email = 'multi.client@example.com';
  caseService.saveCases();

  const res18 = emailTriageService.resolveCaseAssignment({
    category: 'general_question',
    confidence: 'medium',
    reasoning: '',
    recognizedReferences: {},
    recommendedAction: '',
    missingInformation: [],
    potentialRisks: []
  }, { senderEmail: 'multi.client@example.com' });

  assert(res18.matchType === 'multiple', 'Multiple open cases should yield matchType multiple');
  assert(res18.assignedCaseId === undefined, 'Auto-assignment must be blocked on multiple matches');
  console.log('✅ Test 18 PASSED: Multiple matches block auto-assignment');
  passedCount++;

  // Test 19: Exclude Closed/Cancelled/Archived Cases
  console.log('Test 19: Exclude Closed/Cancelled/Archived Cases');
  const case19Closed = caseService.createCase({
    status: 'Completed',
    source: 'Test',
    priority: 'low',
    confidence: 'high',
    title: 'Closed Case'
  });
  (case19Closed as any).email = 'closed.client@example.com';
  caseService.saveCases();

  const res19 = emailTriageService.resolveCaseAssignment({
    category: 'general_question',
    confidence: 'medium',
    reasoning: '',
    recognizedReferences: {},
    recommendedAction: '',
    missingInformation: [],
    potentialRisks: []
  }, { senderEmail: 'closed.client@example.com' });

  assert(res19.matchType === 'none', 'Closed cases must be excluded from matching');
  console.log('✅ Test 19 PASSED: Closed/Cancelled cases strictly excluded');
  passedCount++;

  // Test 20: High Risk Check - Complaint Flagging
  console.log('Test 20: High Risk Check - Complaint Flagging');
  const event20 = workflowEngine.emitEvent('EMAIL_RECEIVED', 'Outlook', {
    subject: 'Schwerwiegende Beschwerde und Schadensersatz',
    bodyText: 'Ihre Mitarbeiter haben mein Sofa beschädigt. Ich erwarte umgehend Schadensersatz!',
    senderEmail: 'klaus.test@example.com'
  });
  const record20 = emailTriageService.processEmailTriage(event20);
  assert(record20.analysis.isHighRisk === true, 'Complaint/damage must be flagged high risk');
  console.log('✅ Test 20 PASSED: High risk complaint flagged');
  passedCount++;

  // Test 21: High Risk Check - Legal Threat
  console.log('Test 21: High Risk Check - Legal Threat');
  const analysis21 = emailTriageService.analyzeEmailContent({
    subject: 'Anwaltliche Fristsetzung',
    bodyText: 'Ich werde die Sache an meinen Anwalt übergeben und gerichtlich vorgehen.'
  });
  assert(analysis21.potentialRisks.includes('rechtliche Drohung'), 'Legal threat risk recognized');
  assert(analysis21.isHighRisk === true, 'Legal threat must be high risk');
  console.log('✅ Test 21 PASSED: Legal threat flagged high risk');
  passedCount++;

  // Test 22: Policy Dry Run Mode
  console.log('Test 22: Policy Dry Run Mode');
  automationService.updatePolicy('EMAIL_TRIAGE', { enabled: true, mode: 'dry_run' });
  const event22 = workflowEngine.emitEvent('EMAIL_RECEIVED', 'Outlook', {
    subject: 'Allgemeine Frage zu Umzügen',
    bodyText: 'Bieten Sie auch Kartons zum Leihen an?',
    senderEmail: 'dryrun@example.com'
  });
  const record22 = emailTriageService.processEmailTriage(event22);
  assert(record22.mode === 'dry_run', 'Record mode should be dry_run');
  assert(record22.executedActions.includes('DRY_RUN_TRIAGE_SIMULATION'), 'Dry run simulation action recorded');
  console.log('✅ Test 22 PASSED: Dry run mode produces simulation record');
  passedCount++;

  // Test 23: Policy Disabled Defaults to Dry Run
  console.log('Test 23: Policy Disabled Defaults to Dry Run Behavior');
  automationService.updatePolicy('EMAIL_TRIAGE', { enabled: false, mode: 'active' });
  const event23 = workflowEngine.emitEvent('EMAIL_RECEIVED', 'Outlook', {
    subject: 'Test mit deaktivierter Policy',
    bodyText: 'Guten Tag.',
    senderEmail: 'disabled@example.com'
  });
  const record23 = emailTriageService.processEmailTriage(event23);
  assert(record23.mode === 'dry_run', 'Disabled policy must default to dry_run mode');
  console.log('✅ Test 23 PASSED: Disabled policy enforced as dry_run');
  passedCount++;

  // Test 24: Policy Active Mode Execution
  console.log('Test 24: Policy Active Mode Execution');
  automationService.updatePolicy('EMAIL_TRIAGE', { enabled: true, mode: 'active' });
  automationService.updatePolicy('LINK_EMAIL_TO_CASE', { enabled: true, mode: 'active' });
  automationService.updatePolicy('PREPARE_EMAIL_DRAFT', { enabled: true, mode: 'active' });

  const event24 = workflowEngine.emitEvent('EMAIL_RECEIVED', 'Outlook', {
    subject: 'Anfrage Umzug von Wien nach Linz',
    bodyText: 'Guten Tag, wir suchen ein Angebot für einen Umzug am 10.09. von Wien nach Linz. ca 50m³.',
    senderEmail: 'active.mode@example.com',
    senderName: 'Active User'
  });
  const record24 = emailTriageService.processEmailTriage(event24);
  assert(record24.mode === 'active', 'Active mode must record mode active');
  assert(record24.executedActions.includes('PREPARE_EMAIL_DRAFT'), 'Draft preparation executed');
  assert(record24.analysis.preparedDraftId !== undefined, 'Draft ID generated');
  console.log('✅ Test 24 PASSED: Active mode executes safe actions');
  passedCount++;

  // Test 25: Prepared Draft Status is strictly 'draft'
  console.log('Test 25: Prepared Draft Status is strictly draft');
  const activeCase25 = caseService.getCase(record24.assignedCaseId!);
  assert(activeCase25 !== undefined, 'Case should exist');
  const draft25 = activeCase25?.emailDrafts?.find(d => d.id === record24.analysis.preparedDraftId);
  assert(draft25 !== undefined, 'Draft should be present in case');
  assert(draft25?.status === 'draft', 'Draft status must be strictly "draft"');
  console.log('✅ Test 25 PASSED: Draft status is strictly draft');
  passedCount++;

  // Test 26: No Automatic Email Sending
  console.log('Test 26: No Automatic Email Sending');
  assert(draft25?.status !== 'sent' && draft25?.status !== 'approved', 'No automatic email sending allowed');
  console.log('✅ Test 26 PASSED: Verified zero automatic email sends');
  passedCount++;

  // Test 27: User Category Correction
  console.log('Test 27: User Category Correction');
  const ok27 = emailTriageService.confirmOrCorrectCategory(record24.id, 'appointment_request', 'Admin');
  assert(ok27 === true, 'Category correction succeeded');
  const updatedRecord27 = emailTriageService.getRecord(record24.id);
  assert(updatedRecord27?.analysis.category === 'appointment_request', 'Category updated');
  assert(updatedRecord27?.status === 'corrected', 'Status set to corrected');
  console.log('✅ Test 27 PASSED: User category correction recorded');
  passedCount++;

  // Test 28: User Case Assignment Correction
  console.log('Test 28: User Case Assignment Correction');
  const newCase28 = caseService.createCase({
    status: 'Draft',
    source: 'Test',
    priority: 'low',
    confidence: 'high',
    title: 'Target Case Correct'
  });
  const ok28 = emailTriageService.confirmOrCorrectCaseAssignment(record24.id, newCase28.id, 'Admin');
  assert(ok28 === true, 'Case assignment correction succeeded');
  const updatedRecord28 = emailTriageService.getRecord(record24.id);
  assert(updatedRecord28?.assignedCaseId === newCase28.id, 'Assigned case updated');
  console.log('✅ Test 28 PASSED: User case assignment correction recorded');
  passedCount++;

  // Test 29: Rollback Triage Execution
  console.log('Test 29: Rollback Triage Execution');
  const ok29 = emailTriageService.rollbackTriage(record24.id);
  assert(ok29 === true, 'Rollback succeeded');
  const rolledBackRecord = emailTriageService.getRecord(record24.id);
  assert(rolledBackRecord?.status === 'reverted', 'Record status set to reverted');
  const policy29 = automationService.getPolicy('EMAIL_TRIAGE');
  assert(policy29?.enabled === false, 'Policy paused on rollback');
  console.log('✅ Test 29 PASSED: Rollback reverts state and pauses policy');
  passedCount++;

  // Test 30: Learning Record Integration
  console.log('Test 30: Learning Record Integration');
  const learningRecords = learningService.getLearningRecords();
  assert(learningRecords.length > 0, 'Learning records captured during correction and rollback');
  console.log('✅ Test 30 PASSED: Learning system integrated successfully');
  passedCount++;

  console.log(`\n🎉 ALL ${passedCount} TEST SCENARIOS PASSED SUCCESSFULLY!`);
}

runTests().catch(err => {
  console.error('❌ Test suite failed with error:', err);
  process.exit(1);
});
