import { caseService } from './src/lib/case-service';
import { offerDraftService } from './src/lib/offer-draft-service';
import { emailDraftService } from './src/lib/email-draft-service';
import { documentService } from './src/lib/document-service';
import { evaluateOfferSendReadiness } from './src/lib/offer-send-validator';
import { automationService } from './src/lib/automation-service';
import { setOutlookMailTransportOverride, sendOutlookMessage } from './src/lib/outlook-service';
import { workflowEngine, WorkflowEvent } from './src/lib/workflow-engine';
import { generateEmailResponseDraftText } from './src/lib/email-draft-generator';
import { crmLookupService } from './src/lib/crm-lookup-service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runAllOfferSendTests() {
  console.log('====================================================');
  console.log('STARTING INTEGRATION & REGRESSION SUITE: OFFER SENDING');
  console.log('====================================================\n');

  // Clear state before running
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  documentService.clear();

  // Test 1: Offer Draft without PDF cannot be sent
  console.log('TEST 1: Offer Draft without PDF cannot be sent...');
  const case1 = caseService.createCase({
    title: 'Test Case 1',
    source: 'E-Mail',
    priority: 'high',
    confidence: 'high'
  });
  const mockCustomer1: any = {
    id: 'cust-1',
    name: 'Max Mustermann',
    email: 'max@example.com',
    telefon: '012345678',
    adresse: 'Hauptstraße 1, Wien',
    abholadresse: { strasse: 'Hauptstraße 1', ort: 'Wien' },
    zieladresse: { strasse: 'Neugasse 10', ort: 'Wien' },
    umzugsdetails: { gewuenschterUmzugstermin: '2026-09-01', umzugsgroesse: '80 m²' }
  };
  crmLookupService.setCustomers([mockCustomer1]);
  caseService.updateCase(case1.id, { customerId: mockCustomer1.id });
  const offerDraft1 = offerDraftService.createOfferDraftForCase(case1.id, { offerType: 'orientation' });
  assert(!!offerDraft1, 'Offer draft 1 created');
  const readiness1 = evaluateOfferSendReadiness(case1, offerDraft1, null, mockCustomer1);
  assert(!readiness1.ready, 'Draft without PDF must NOT be ready to send');
  console.log('✓ TEST 1 PASSED');

  // Test 2: Missing document blocks send
  console.log('TEST 2: Missing document blocks send...');
  const fakeDraft2 = { ...offerDraft1!, status: 'pdf_created' as const, documentId: 'doc-missing-123' };
  const readiness2 = evaluateOfferSendReadiness(case1, fakeDraft2, null, mockCustomer1);
  assert(!readiness2.ready, 'Missing document in documentService must block send');
  console.log('✓ TEST 2 PASSED');

  // Test 3: Invalid recipient email blocks send
  console.log('TEST 3: Invalid recipient email blocks send...');
  const doc3 = documentService.registerDocument({
    id: 'doc-test-3',
    customerId: 'cust-3',
    customerName: 'No Email Customer',
    type: 'Orientierungsangebot',
    docNumber: 'OA-003',
    date: '2026-08-03',
    dataUrl: 'data:application/pdf;base64,JVBERi0xLjQ...'
  });
  const fakeDraft3 = { ...offerDraft1!, status: 'pdf_created' as const, documentId: 'doc-test-3' };
  const readiness3 = evaluateOfferSendReadiness(case1, fakeDraft3, doc3, { id: 'c3', name: 'Test', email: 'invalid-email' } as any);
  assert(!readiness3.ready, 'Invalid email must block send');
  console.log('✓ TEST 3 PASSED');

  // Test 4: Orientation offer generates non-binding email wording
  console.log('TEST 4: Orientation offer generates non-binding email wording...');
  const textOrientation = generateEmailResponseDraftText({
    purpose: 'offer_delivery',
    offerType: 'orientation',
    docNumber: 'OA-100',
    originalSenderName: 'Anna Schmidt'
  });
  assert(textOrientation.bodyText.includes('unverbindliches Orientierungsangebot'), 'Must contain "unverbindliches Orientierungsangebot"');
  console.log('✓ TEST 4 PASSED');

  // Test 5: Binding offer generates matching email wording
  console.log('TEST 5: Binding offer generates matching email wording...');
  const textBinding = generateEmailResponseDraftText({
    purpose: 'offer_delivery',
    offerType: 'binding',
    docNumber: 'AG-200',
    originalSenderName: 'Anna Schmidt'
  });
  assert(textBinding.bodyText.includes('unser Angebot'), 'Must contain "unser Angebot"');
  assert(!textBinding.bodyText.includes('unverbindliches Orientierungsangebot'), 'Binding offer must NOT say "unverbindliches"');
  console.log('✓ TEST 5 PASSED');

  // Test 6: Attachment reference stored in draft, but NO Base64 data in draft
  console.log('TEST 6: Attachment reference stored in draft, but NO Base64 data in draft...');
  const emailDraft6 = emailDraftService.createDraftForCase(case1.id, {
    purpose: 'offer_delivery',
    offerDraftId: offerDraft1!.id,
    documentId: 'doc-test-3',
    fileName: 'Orientierungsangebot_OA-003.pdf',
    originalSenderEmail: 'max@example.com'
  });
  assert(!!emailDraft6, 'Email draft created');
  assert(!!emailDraft6!.attachments && emailDraft6!.attachments.length === 1, 'Attachment reference exists');
  assert(emailDraft6!.attachments![0].documentId === 'doc-test-3', 'Attachment reference holds documentId');
  assert(!('dataUrl' in emailDraft6!.attachments![0]), 'No dataUrl stored in attachment reference');
  console.log('✓ TEST 6 PASSED');

  // Test 7 & 8: PDF loaded immediately before send from Document Service & prefix removed
  console.log('TEST 7 & 8: PDF loaded immediately before send from Document Service & prefix removed...');
  documentService.registerDocument({
    id: 'doc-test-7',
    customerId: mockCustomer1.id,
    customerName: mockCustomer1.name,
    type: 'Orientierungsangebot',
    docNumber: 'OA-007',
    date: '2026-08-03',
    dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJTI1MiAwIG9iaiA8PAovTGVuZ3RoIDM2Cj4+CnN0cmVhbQpCVDc3NyA3NzcgVGQgKFRlc3QgUERGKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnRyYWlsZXIgPD4KJSVFT0YK'
  });
  const draft7 = emailDraftService.createDraftForCase(case1.id, {
    purpose: 'offer_delivery',
    offerDraftId: offerDraft1!.id,
    documentId: 'doc-test-7',
    fileName: 'Angebot.pdf',
    originalSenderEmail: 'max@example.com',
    forceNew: true
  });
  draft7!.status = 'approved';

  let capturedTransportReq: any = null;
  setOutlookMailTransportOverride({
    async sendReply(req) {
      capturedTransportReq = req;
      return { success: true, delivery: 'simulated', statusCode: 200, message: 'Sent' };
    }
  });

  const execRes7 = await automationService.executeApprovedEmailDraft(draft7!, case1.id);
  if (!execRes7.success) {
    console.error('execRes7 failed with error:', execRes7.error);
  }
  assert(execRes7.success, 'Automation send executed successfully');
  assert(!!capturedTransportReq, 'Transport received request');
  assert(!!capturedTransportReq.attachments && capturedTransportReq.attachments.length === 1, 'Transport received attachment');
  assert(capturedTransportReq.attachments[0].contentBytes.startsWith('JVBERi0x'), 'Base64 prefix stripped correctly');
  console.log('✓ TEST 7 & 8 PASSED');

  // Test 9: Empty or invalid PDF blocks send
  console.log('TEST 9: Empty or invalid PDF blocks send...');
  documentService.registerDocument({
    id: 'doc-test-invalid',
    customerId: mockCustomer1.id,
    customerName: mockCustomer1.name,
    type: 'Orientierungsangebot',
    docNumber: 'OA-009',
    date: '2026-08-03',
    dataUrl: 'data:text/plain;base64,invalid'
  });
  const draft9 = emailDraftService.createDraftForCase(case1.id, {
    purpose: 'offer_delivery',
    documentId: 'doc-test-invalid',
    fileName: 'Invalid.pdf',
    originalSenderEmail: 'max@example.com',
    forceNew: true
  });
  draft9!.status = 'approved';
  const execRes9 = await automationService.executeApprovedEmailDraft(draft9!, case1.id);
  assert(!execRes9.success, 'Invalid PDF mime type must block send');
  console.log('✓ TEST 9 PASSED');

  // Test 10, 11, 12, 15, 16, 17, 18: Full Graph send with attachments sequence
  console.log('TEST 10-18: Full Graph send with attachments sequence...');
  // Reset transport override to null so sendOutlookMessage uses globalThis.fetch
  setOutlookMailTransportOverride(null);

  const fetchCalls: Array<{ url: string; method: string; body?: any }> = [];
  const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();
    const method = init?.method || 'GET';
    let bodyObj = null;
    if (init?.body && typeof init.body === 'string') {
      try { bodyObj = JSON.parse(init.body); } catch (_) {}
    }
    fetchCalls.push({ url: urlStr, method, body: bodyObj });

    if (urlStr.includes('/createReply')) {
      return new Response(JSON.stringify({ id: 'graph-reply-draft-123' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/attachments')) {
      return new Response(JSON.stringify({ id: 'att-id-123', name: 'Angebot_AG-100.pdf' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('/send')) {
      return new Response(null, { status: 202 });
    }
    return new Response(JSON.stringify({ id: 'msg-456' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  // Setup Case with valid Offer PDF
  const case10 = caseService.createCase({
    title: 'Test Case 10',
    source: 'E-Mail',
    priority: 'high',
    confidence: 'high'
  });
  const customer10: any = {
    id: 'cust-10',
    name: 'Bernd Berger',
    email: 'bernd@example.com',
    telefon: '06641234567',
    adresse: 'Gasse 5, Graz',
    abholadresse: { strasse: 'Gasse 5', ort: 'Graz' },
    zieladresse: { strasse: 'Allee 12', ort: 'Graz' },
    umzugsdetails: { gewuenschterUmzugstermin: '2026-10-15', umzugsgroesse: '100 m²' }
  };
  crmLookupService.setCustomers([mockCustomer1, customer10]);
  caseService.updateCase(case10.id, { customerId: customer10.id });
  const offerDraft10 = offerDraftService.createOfferDraftForCase(case10.id, { offerType: 'binding' });
  const pdfGenRes10 = await offerDraftService.generateOfferPDFForDraft(case10.id, offerDraft10!.id);
  assert(pdfGenRes10.success, 'PDF generated');

  const emailDraft10 = caseService.getCase(case10.id)!.emailDrafts!.find(d => d.purpose === 'offer_delivery');
  assert(!!emailDraft10, 'Offer email draft automatically created');
  emailDraft10!.sourceMessageId = 'source-msg-999';

  const emittedEvents: WorkflowEvent[] = [];
  const unsubscribe = workflowEngine.subscribe('event', (evt) => {
    emittedEvents.push(evt);
  });

  // Execute confirm email send
  const confirmRes10 = await caseService.confirmEmailDraftSend(case10.id, emailDraft10!.id, { fetchFn: mockFetch as any, token: 'fake-token' } as any);
  unsubscribe();

  if (!confirmRes10.success) {
    console.error('confirmRes10 failed with error:', confirmRes10.error);
  }
  assert(confirmRes10.success, 'Confirm email send succeeded');

  // Verify fetch sequence: createReply -> attachments -> send
  assert(fetchCalls.length >= 3, 'At least 3 Graph API calls made');
  assert(fetchCalls[0].url.includes('/createReply'), 'First call is createReply (Test 10)');
  assert(fetchCalls[1].url.includes('/attachments'), 'Second call is attachments (Test 11 & 12)');
  assert(fetchCalls[1].body?.['@odata.type'] === '#microsoft.graph.fileAttachment', 'Attachment has correct Graph odata type');
  assert(fetchCalls[2].url.includes('/send'), 'Third call is send (Test 12)');

  // Verify states
  const updatedCase10 = caseService.getCase(case10.id)!;
  const updatedEmail10 = updatedCase10.emailDrafts!.find(d => d.id === emailDraft10!.id)!;
  const updatedOffer10 = updatedCase10.offerDrafts!.find(o => o.id === offerDraft10!.id)!;

  assert(updatedEmail10.status === 'sent', 'Email draft status set to sent (Test 15)');
  assert(updatedOffer10.status === 'sent', 'Offer draft status set to sent (Test 16)');
  assert(updatedCase10.status === 'Waiting for Confirmation', 'Case status updated to Waiting for Confirmation (Test 24)');

  const emailSentEvents = emittedEvents.filter(e => e.type === 'EMAIL_SENT');
  const offerSentEvents = emittedEvents.filter(e => e.type === 'OFFER_SENT');
  assert(emailSentEvents.length === 1, 'Exactly one EMAIL_SENT event emitted (Test 17)');
  assert(offerSentEvents.length === 1, 'Exactly one OFFER_SENT event emitted (Test 18)');

  console.log('✓ TEST 10-18 PASSED');

  // Test 13: Attachment error prevents send
  console.log('TEST 13: Attachment error prevents send...');
  const mockFetchAttachmentError = async (url: string | URL | Request) => {
    const urlStr = url.toString();
    if (urlStr.includes('/createReply')) return new Response(JSON.stringify({ id: 'draft-att-fail' }), { status: 200 });
    if (urlStr.includes('/attachments')) return new Response(JSON.stringify({ error: { message: 'Upload failed' } }), { status: 500 });
    if (urlStr.includes('/send')) throw new Error('Send should NOT be called!');
    return new Response(null, { status: 200 });
  };

  const case13 = caseService.createCase({ title: 'Test 13', source: 'E-Mail', priority: 'high', confidence: 'high' });
  caseService.updateCase(case13.id, { customerId: customer10.id });
  const offerDraft13 = offerDraftService.createOfferDraftForCase(case13.id, { offerType: 'orientation' });
  await offerDraftService.generateOfferPDFForDraft(case13.id, offerDraft13!.id);
  const emailDraft13 = caseService.getCase(case13.id)!.emailDrafts!.find(d => d.purpose === 'offer_delivery')!;
  emailDraft13.sourceMessageId = 'msg-13';

  const confirmRes13 = await caseService.confirmEmailDraftSend(case13.id, emailDraft13.id, { fetchFn: mockFetchAttachmentError as any, token: 'token' } as any);
  assert(!confirmRes13.success, 'Attachment error must fail send process');
  const reLoadedCase13 = caseService.getCase(case13.id)!;
  assert(reLoadedCase13.emailDrafts!.find(d => d.id === emailDraft13.id)!.status === 'failed', 'Draft status must be failed');
  assert(reLoadedCase13.offerDrafts!.find(o => o.id === offerDraft13!.id)!.status === 'pdf_created', 'Offer draft status remains pdf_created');
  console.log('✓ TEST 13 PASSED');

  // Test 19: Double-click produces exactly one send process
  console.log('TEST 19: Double-click produces exactly one send process...');
  const case19 = caseService.createCase({ title: 'Test 19', source: 'E-Mail', priority: 'high', confidence: 'high' });
  caseService.updateCase(case19.id, { customerId: customer10.id });
  const offerDraft19 = offerDraftService.createOfferDraftForCase(case19.id, { offerType: 'binding' });
  await offerDraftService.generateOfferPDFForDraft(case19.id, offerDraft19!.id);
  const emailDraft19 = caseService.getCase(case19.id)!.emailDrafts!.find(d => d.purpose === 'offer_delivery')!;

  let sendCount = 0;
  const mockFetchSlow = async (url: string | URL | Request) => {
    const urlStr = url.toString();
    if (urlStr.includes('/send') || urlStr.includes('/sendMail')) sendCount++;
    await new Promise(r => setTimeout(r, 50));
    return new Response(JSON.stringify({ id: 'msg-slow' }), { status: 200 });
  };

  setOutlookMailTransportOverride(null);
  const [p1, p2] = await Promise.all([
    caseService.confirmEmailDraftSend(case19.id, emailDraft19.id, { fetchFn: mockFetchSlow as any, token: 'token' } as any),
    caseService.confirmEmailDraftSend(case19.id, emailDraft19.id, { fetchFn: mockFetchSlow as any, token: 'token' } as any)
  ]);

  assert((p1.success && !p2.success) || (!p1.success && p2.success), 'One send call succeeds and the other is locked out');
  assert(sendCount === 1, 'Graph API send endpoint called exactly once');
  console.log('✓ TEST 19 PASSED');

  // Test 22: Offer Draft is not automatically re-sent
  console.log('TEST 22: Offer Draft is not automatically re-sent...');
  const case22 = caseService.getCase(case10.id)!;
  const sentOfferDraft22 = case22.offerDrafts!.find(o => o.status === 'sent')!;
  const readiness22 = evaluateOfferSendReadiness(case22, sentOfferDraft22, null, customer10);
  assert(!readiness22.ready, 'Sent offer draft must NOT be ready for re-sending');
  console.log('✓ TEST 22 PASSED');

  // Test 23, 25, 26: Tasks, Timeline & Workflow Event cleanliness
  console.log('TEST 23, 25, 26: Tasks, Timeline & Workflow Event cleanliness...');
  const case23 = caseService.getCase(case10.id)!;
  assert(case23.tasks.some(t => t.title === 'Auf Angebotsbestätigung warten' && t.status === 'Waiting'), 'Task "Auf Angebotsbestätigung warten" present and Waiting (Test 23)');

  for (const entry of case23.timeline) {
    assert(!entry.description?.includes('data:application/pdf'), 'Timeline entry contains no PDF Base64 (Test 25)');
    assert((entry.description?.length || 0) < 500, 'Timeline entry description is reasonably concise');
  }

  for (const evt of emittedEvents) {
    if (evt.payload) {
      const payloadStr = JSON.stringify(evt.payload);
      assert(!payloadStr.includes('data:application/pdf'), 'Workflow event contains no PDF Base64 (Test 26)');
    }
  }
  console.log('✓ TEST 23, 25, 26 PASSED');

  console.log('\n====================================================');
  console.log('ALL OFFER SEND INTEGRATION TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');
}

runAllOfferSendTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
