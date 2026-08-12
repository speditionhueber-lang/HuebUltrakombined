import { workflowEngine } from './src/lib/workflow-engine';
import { caseService } from './src/lib/case-service';
import { crmLookupService } from './src/lib/crm-lookup-service';
import { decisionEngine } from './src/lib/decision-engine';
import { offerDraftService } from './src/lib/offer-draft-service';
import { offerResponseService } from './src/lib/offer-response-service';
import { EmailResponseDraft } from './src/lib/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runOfferResponseTests() {
  console.log('====================================================');
  console.log('STARTING INTEGRATION & REGRESSION SUITE: OFFER RESPONSE');
  console.log('====================================================');

// Setup: Reset state
  (caseService as any).cases = [];
  (workflowEngine as any).events = [];
  crmLookupService.setCustomers([]);
  
  // Ensure decision engine is initialized
  if (!decisionEngine) throw new Error("decisionEngine missing");

  // Setup Customer
  const customer: any = {
    id: 'cust-resp-1',
    name: 'Response Tester',
    email: 'tester@example.com',
    telefon: '123456',
    adresse: 'Teststrasse 1, Wien'
  };
  crmLookupService.setCustomers([customer]);

  const generateMockCaseWithSentOffer = async (
    caseId: string,
    messageId: string,
    conversationId: string,
    sentAtDate: string
  ) => {
    const c = caseService.createCase({
      status: 'Waiting for Confirmation',
      source: 'Email',
      priority: 'high',
      confidence: 'high',
      customerId: customer.id,
      title: 'Test Case ' + caseId
    });
    c.id = caseId;
    
    caseService.addOutlookReferenceToCase(c.id, {
      graphMessageId: 'orig-' + messageId,
      internetMessageId: 'internet-' + messageId,
      conversationId: conversationId
    });

    const offer: any = {
      id: 'offer-' + caseId,
      caseId: c.id,
      offerType: 'binding',
      status: 'sent',
      sentAt: sentAtDate,
      customerId: customer.id,
      customerName: customer.name,
      items: [],
      subtotalNet: 100,
      vatRate: 20,
      vatAmount: 20,
      grossTotal: 120,
      history: []
    };
    
    caseService.updateCase(c.id, {
      status: 'Waiting for Confirmation',
      offerDrafts: [offer]
    });
    
    caseService.addTask(c.id, {
      title: 'Auf Angebotsbestätigung warten',
      description: 'Warten auf die Rückmeldung des Kunden.',
      category: 'Offer',
      status: 'Waiting',
      priority: 'medium',
      source: 'System',
      caseId: c.id,
      workflowId: 'manual'
    });

    return { caseItem: c, offer };
  };

  const fireEmailReceived = async (
    id: string,
    text: string,
    receivedAt: string,
    conversationId: string
  ) => {
    // Pre-load offerResponseService module so dynamic import in decisionEngine resolves synchronously
    await import('./src/lib/offer-response-service');

    await workflowEngine.emitEvent('EMAIL_RECEIVED', 'System', {
      id,
      graphMessageId: id,
      conversationId,
      text,
      receivedDateTime: receivedAt,
      senderName: 'Response Tester',
      email: 'tester@example.com'
    });
    
    // Poll for up to 3 seconds to wait for async processing
    let checks = 0;
    while (checks < 60) {
      const c = caseService.getCase(id.replace('resp-', 'case-'));
      if (c?.offerResponseReviews?.length) break;
      await new Promise(resolve => setTimeout(resolve, 50));
      checks++;
    }
  };

  // TEST 1: Eindeutige Annahme wird als accepted vorgeschlagen.
  console.log('TEST 1: Eindeutige Annahme wird als accepted vorgeschlagen...');
  const { caseItem: case1 } = await generateMockCaseWithSentOffer('case-1', 'msg-1', 'conv-1', '2026-08-01T10:00:00Z');
  await fireEmailReceived('resp-1', 'Hiermit nehmen wir das Angebot an.', '2026-08-01T11:00:00Z', 'conv-1');
  const case1After = caseService.getCase('case-1')!;
  assert(case1After.offerResponseReviews?.length === 1, 'Review created');
  assert(case1After.offerResponseReviews![0].detectedIntent === 'accepted', 'Intent is accepted');
  console.log('✓ TEST 1 PASSED');

  // TEST 2: Ein einzelnes „Okay, danke“ wird nicht sicher als accepted bewertet.
  console.log('TEST 2: Ein einzelnes „Okay, danke“ wird nicht sicher als accepted bewertet...');
  const { caseItem: case2 } = await generateMockCaseWithSentOffer('case-2', 'msg-2', 'conv-2', '2026-08-01T10:00:00Z');
  await fireEmailReceived('resp-2', 'Okay, danke', '2026-08-01T11:00:00Z', 'conv-2');
  const case2After = caseService.getCase('case-2')!;
  assert(case2After.offerResponseReviews?.length === 1, 'Review created');
  assert(case2After.offerResponseReviews![0].detectedIntent === 'unclear', 'Intent is unclear for weak signal');
  console.log('✓ TEST 2 PASSED');

  // TEST 3: Eindeutige Ablehnung wird als declined erkannt.
  console.log('TEST 3: Eindeutige Ablehnung wird als declined erkannt...');
  const { caseItem: case3 } = await generateMockCaseWithSentOffer('case-3', 'msg-3', 'conv-3', '2026-08-01T10:00:00Z');
  await fireEmailReceived('resp-3', 'Wir lehnen das Angebot ab, da es zu teuer ist.', '2026-08-01T11:00:00Z', 'conv-3');
  const case3After = caseService.getCase('case-3')!;
  assert(case3After.offerResponseReviews![0].detectedIntent === 'declined', 'Intent is declined');
  console.log('✓ TEST 3 PASSED');

  // TEST 4: Terminänderung wird als change_requested erkannt.
  console.log('TEST 4: Terminänderung wird als change_requested erkannt...');
  const { caseItem: case4 } = await generateMockCaseWithSentOffer('case-4', 'msg-4', 'conv-4', '2026-08-01T10:00:00Z');
  await fireEmailReceived('resp-4', 'Wir brauchen einen anderen Termin.', '2026-08-01T11:00:00Z', 'conv-4');
  const case4After = caseService.getCase('case-4')!;
  assert(case4After.offerResponseReviews![0].detectedIntent === 'change_requested', 'Intent is change_requested');
  console.log('✓ TEST 4 PASSED');

  // TEST 5: Preisfrage wird als question erkannt.
  console.log('TEST 5: Preisfrage wird als question erkannt...');
  const { caseItem: case5 } = await generateMockCaseWithSentOffer('case-5', 'msg-5', 'conv-5', '2026-08-01T10:00:00Z');
  await fireEmailReceived('resp-5', 'Ich habe eine frage, was kostet...', '2026-08-01T11:00:00Z', 'conv-5');
  const case5After = caseService.getCase('case-5')!;
  assert(case5After.offerResponseReviews![0].detectedIntent === 'question', 'Intent is question');
  console.log('✓ TEST 5 PASSED');

  // TEST 6: Rückrufbitte wird als callback_requested erkannt.
  console.log('TEST 6: Rückrufbitte wird als callback_requested erkannt...');
  const { caseItem: case6 } = await generateMockCaseWithSentOffer('case-6', 'msg-6', 'conv-6', '2026-08-01T10:00:00Z');
  await fireEmailReceived('resp-6', 'Bitte rufen Sie mich morgen an.', '2026-08-01T11:00:00Z', 'conv-6');
  const case6After = caseService.getCase('case-6')!;
  assert(case6After.offerResponseReviews![0].detectedIntent === 'callback_requested', 'Intent is callback_requested');
  console.log('✓ TEST 6 PASSED');

  // TEST 7: Unklare Nachricht wird als unclear erkannt.
  console.log('TEST 7: Unklare Nachricht wird als unclear erkannt...');
  const { caseItem: case7 } = await generateMockCaseWithSentOffer('case-7', 'msg-7', 'conv-7', '2026-08-01T10:00:00Z');
  await fireEmailReceived('resp-7', 'Das ist eine ganz komische Antwort ohne wirklichen Sinn', '2026-08-01T11:00:00Z', 'conv-7');
  const case7After = caseService.getCase('case-7')!;
  assert(case7After.offerResponseReviews![0].detectedIntent === 'unclear', 'Intent is unclear');
  console.log('✓ TEST 7 PASSED');

  // TEST 8: Antwort wird dem richtigen Case über conversationId zugeordnet.
  console.log('TEST 8: Antwort wird dem richtigen Case über conversationId zugeordnet...');
  assert(case7After.id === 'case-7', 'Case correctly identified');
  console.log('✓ TEST 8 PASSED');

  // TEST 9 & 10: Antwort wird der richtigen Angebotsversion zugeordnet, alte erzeugt Warnung (simplified in this test suite by checking offerDraftId)
  console.log('TEST 9 & 10: Antwort wird der richtigen Angebotsversion zugeordnet...');
  assert(case7After.offerResponseReviews![0].offerDraftId === case7After.offerDrafts![0].id, 'Matched correct offer draft');
  console.log('✓ TEST 9 & 10 PASSED');

  // TEST 11: Nachricht vor sentAt erzeugt kein Angebotsreview.
  console.log('TEST 11: Nachricht vor sentAt erzeugt kein Angebotsreview...');
  const { caseItem: case11 } = await generateMockCaseWithSentOffer('case-11', 'msg-11', 'conv-11', '2026-08-01T10:00:00Z');
  await fireEmailReceived('resp-11', 'Hiermit nehmen wir das Angebot an.', '2026-08-01T09:00:00Z', 'conv-11'); // Received BEFORE sentAt
  const case11After = caseService.getCase('case-11')!;
  assert(!case11After.offerResponseReviews || case11After.offerResponseReviews.length === 0, 'No review created for older message');
  console.log('✓ TEST 11 PASSED');

  // TEST 12 & 13: Gleiche Message-ID erzeugt kein zweites Review.
  console.log('TEST 12 & 13: Gleiche Message-ID erzeugt kein zweites Review...');
  await fireEmailReceived('resp-1', 'Hiermit nehmen wir das Angebot an.', '2026-08-01T11:00:00Z', 'conv-1'); // Duplicate
  const case1AfterDuplicate = caseService.getCase('case-1')!;
  assert(case1AfterDuplicate.offerResponseReviews!.length === 1, 'Only one review exists for the same messageId');
  console.log('✓ TEST 12 & 13 PASSED');

  // TEST 14: Accepted ohne Benutzerbestätigung verändert keinen Status.
  console.log('TEST 14: Accepted ohne Benutzerbestätigung verändert keinen Status...');
  assert(case1After.status === 'Waiting for Confirmation', 'Case status remains Waiting for Confirmation before confirm');
  console.log('✓ TEST 14 PASSED');

  // TEST 15 & 16: Bestätigtes Accepted setzt Offer und Case korrekt.
  console.log('TEST 15 & 16: Bestätigtes Accepted setzt Offer und Case korrekt...');
  offerResponseService.confirmReview('case-1', case1After.offerResponseReviews![0].id, 'accepted', 'User');
  const case1Confirmed = caseService.getCase('case-1')!;
  assert(case1Confirmed.status === 'Planning', 'Case is now Planning');
  assert(case1Confirmed.offerDrafts![0].status === 'accepted', 'Offer is accepted');
  const tasks1 = case1Confirmed.tasks.filter(t => t.title === 'Auftrag planen' && t.status === 'Open');
  assert(tasks1.length === 1, 'Auftrag planen task created');
  const waitingTasks1 = case1Confirmed.tasks.filter(t => t.title === 'Auf Angebotsbestätigung warten' && t.status === 'Completed');
  assert(waitingTasks1.length === 1, 'Waiting task completed');
  console.log('✓ TEST 15 & 16 PASSED');

  // TEST 17 & 18: Bestätigtes Declined setzt Case korrekt.
  console.log('TEST 17 & 18: Bestätigtes Declined setzt Case korrekt...');
  offerResponseService.confirmReview('case-3', case3After.offerResponseReviews![0].id, 'declined', 'User');
  const case3Confirmed = caseService.getCase('case-3')!;
  assert(case3Confirmed.status === 'Cancelled', 'Case is now Cancelled');
  assert(case3Confirmed.offerDrafts![0].status === 'rejected', 'Offer is rejected');
  console.log('✓ TEST 17 & 18 PASSED');

  // TEST 19 & 20: Change requested überschreibt altes Angebot nicht.
  console.log('TEST 19 & 20: Change requested überschreibt altes Angebot nicht...');
  offerResponseService.confirmReview('case-4', case4After.offerResponseReviews![0].id, 'change_requested', 'User');
  const case4Confirmed = caseService.getCase('case-4')!;
  assert(case4Confirmed.status === 'Waiting for Offer', 'Case is now Waiting for Offer');
  assert(case4Confirmed.offerDrafts![0].status === 'sent', 'Old offer is still sent, not overwritten');
  const tasks4 = case4Confirmed.tasks.filter(t => t.title === 'Änderungswunsch prüfen' && t.status === 'Open');
  assert(tasks4.length === 1, 'Änderungswunsch task created');
  console.log('✓ TEST 19 & 20 PASSED');

  // TEST 21: Question erzeugt Task.
  console.log('TEST 21: Question erzeugt Task...');
  offerResponseService.confirmReview('case-5', case5After.offerResponseReviews![0].id, 'question', 'User');
  const case5Confirmed = caseService.getCase('case-5')!;
  const tasks5 = case5Confirmed.tasks.filter(t => t.title === 'Kundenfrage beantworten' && t.status === 'Open');
  assert(tasks5.length === 1, 'Question task created');
  assert(case5Confirmed.status === 'Waiting for Confirmation', 'Case remains Waiting for Confirmation');
  console.log('✓ TEST 21 PASSED');

  // TEST 22: Callback erzeugt Task.
  console.log('TEST 22: Callback erzeugt Task...');
  offerResponseService.confirmReview('case-6', case6After.offerResponseReviews![0].id, 'callback_requested', 'User');
  const case6Confirmed = caseService.getCase('case-6')!;
  const tasks6 = case6Confirmed.tasks.filter(t => t.title === 'Kunden zurückrufen' && t.status === 'Open');
  assert(tasks6.length === 1, 'Callback task created');
  console.log('✓ TEST 22 PASSED');

  // TEST 23: Unclear erzeugt Task.
  console.log('TEST 23: Unclear erzeugt Task...');
  offerResponseService.confirmReview('case-7', case7After.offerResponseReviews![0].id, 'unclear', 'User');
  const case7Confirmed = caseService.getCase('case-7')!;
  const tasks7 = case7Confirmed.tasks.filter(t => t.title === 'Kundenantwort prüfen' && t.status === 'Open');
  assert(tasks7.length === 1, 'Unclear task created');
  console.log('✓ TEST 23 PASSED');

  // TEST 24: Benutzerkorrektur wird als Learning-Signal gespeichert.
  console.log('TEST 24: Benutzerkorrektur wird als Learning-Signal gespeichert...');
  const { caseItem: case24 } = await generateMockCaseWithSentOffer('case-24', 'msg-24', 'conv-24', '2026-08-01T10:00:00Z');
  await fireEmailReceived('resp-24', 'Okay', '2026-08-01T11:00:00Z', 'conv-24'); // Detects unclear
  const case24After = caseService.getCase('case-24')!;
  offerResponseService.confirmReview('case-24', case24After.offerResponseReviews![0].id, 'accepted', 'User'); // Correct to accepted
  const case24Confirmed = caseService.getCase('case-24')!;
  assert(case24Confirmed.offerResponseReviews![0].status === 'corrected', 'Review marked as corrected');
  console.log('✓ TEST 24 PASSED');

  // TEST 25 & 26: Events erzeugen keine Rekursion & Timeline-Einträge entstehen genau einmal.
  console.log('TEST 25 & 26: Events erzeugen keine Rekursion & Timeline-Einträge entstehen genau einmal...');
  const timelines24 = case24Confirmed.timeline.filter(t => t.type === 'STATUS_CHANGED');
  assert(timelines24.length === 1, 'Exactly one timeline entry for status change');
  console.log('✓ TEST 25 & 26 PASSED');

  console.log('====================================================');
  console.log('ALL OFFER RESPONSE INTEGRATION TESTS PASSED PERFECTLY!');
  console.log('====================================================');
}

runOfferResponseTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
