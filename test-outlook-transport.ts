import { sendOutlookMessage, setOutlookMailTransportOverride, OutlookMailTransport } from './src/lib/outlook-service';
import { caseService, CaseService } from './src/lib/case-service';
import { emailDraftService } from './src/lib/email-draft-service';
import { workflowEngine } from './src/lib/workflow-engine';

// Mock localStorage if in Node environment
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

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`✓ ${description}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${description}`);
    failed++;
  }
}

async function runOutlookTransportTests() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED TESTS: OUTLOOK TRANSPORT & GRAPH INTEGRITY (12 MANDATORY SCENARIOS)');
  console.log('====================================================\n');

  // Clear state before starting
  localStorage.clear();
  setOutlookMailTransportOverride(null);

  // ----------------------------------------------------
  // TEST 1: Graph Reply liefert 202 -> status sent & EMAIL_SENT event
  // ----------------------------------------------------
  localStorage.setItem('ms_graph_access_token', 'token-test-1');
  let emailSentEventCount = 0;
  const unsubscribeT1 = workflowEngine.subscribe('EMAIL_SENT', () => {
    emailSentEventCount++;
  });

  const fetchT1 = (async (url: string) => {
    if (url.includes('/reply')) {
      return { ok: true, status: 202, json: async () => ({}) };
    }
    return { ok: false, status: 400, json: async () => ({}) };
  }) as any;

  const caseT1 = caseService.createCase({ title: 'Test 1 Reply', source: 'Email' });
  const draftT1 = emailDraftService.createDraftForCase(caseT1.id, {
    purpose: 'request_missing_information',
    originalSenderEmail: 'k@ex.com',
    sourceMessageId: 'msg-999',
    requestedFields: [{ field: 'pickup_address', label: 'Abholadresse', reason: 'fehlt', required: true }]
  })!;

  // Override fetch for this call
  const origFetch = globalThis.fetch;
  globalThis.fetch = fetchT1;

  const resT1 = await caseService.confirmEmailDraftSend(caseT1.id, draftT1.id);
  const updatedCaseT1 = caseService.getCase(caseT1.id)!;
  const draftStateT1 = updatedCaseT1.emailDrafts?.find(d => d.id === draftT1.id);

  assert(
    resT1.success &&
    draftStateT1?.status === 'sent' &&
    emailSentEventCount === 1,
    'TEST 1: Graph Reply liefert 202 -> status sent, delivery graph & genau ein EMAIL_SENT Event'
  );
  unsubscribeT1();

  // ----------------------------------------------------
  // TEST 2: Fehlender Access Token -> authentication_required, draft failed, kein EMAIL_SENT
  // ----------------------------------------------------
  localStorage.removeItem('ms_graph_access_token');
  let emailSentCountT2 = 0;
  const unsubscribeT2 = workflowEngine.subscribe('EMAIL_SENT', () => { emailSentCountT2++; });

  const caseT2 = caseService.createCase({ title: 'Test 2 No Token', source: 'Email' });
  const draftT2 = emailDraftService.createDraftForCase(caseT2.id, {
    purpose: 'acknowledgement',
    originalSenderEmail: 'k2@ex.com'
  })!;

  const resT2 = await caseService.confirmEmailDraftSend(caseT2.id, draftT2.id);
  const updatedCaseT2 = caseService.getCase(caseT2.id)!;
  const draftStateT2 = updatedCaseT2.emailDrafts?.find(d => d.id === draftT2.id);

  assert(
    !resT2.success &&
    draftStateT2?.status === 'failed' &&
    emailSentCountT2 === 0,
    'TEST 2: Fehlender Access Token -> status failed, kein EMAIL_SENT'
  );
  unsubscribeT2();

  // ----------------------------------------------------
  // TEST 3: Netzwerk nicht erreichbar -> network_error, draft bleibt erhalten
  // ----------------------------------------------------
  localStorage.setItem('ms_graph_access_token', 'token-test-3');
  globalThis.fetch = (async () => {
    throw new TypeError('Network request failed');
  }) as any;

  const caseT3 = caseService.createCase({ title: 'Test 3 Network Error', source: 'Email' });
  const draftT3 = emailDraftService.createDraftForCase(caseT3.id, {
    purpose: 'acknowledgement',
    originalSenderEmail: 'k3@ex.com'
  })!;

  const resT3 = await caseService.confirmEmailDraftSend(caseT3.id, draftT3.id);
  const updatedCaseT3 = caseService.getCase(caseT3.id)!;
  const draftStateT3 = updatedCaseT3.emailDrafts?.find(d => d.id === draftT3.id);
  const taskStateT3 = updatedCaseT3.tasks.find(t => t.referenceId === draftT3.id);

  assert(
    !resT3.success &&
    draftStateT3?.status === 'failed' &&
    taskStateT3?.status !== 'Completed',
    'TEST 3: Netzwerkfehler -> network_error, draft bleibt erhalten, task nicht completed'
  );

  // ----------------------------------------------------
  // TEST 4: Graph 401 -> authentication_required, Token gelöscht
  // ----------------------------------------------------
  localStorage.setItem('ms_graph_access_token', 'invalid-token-401');
  localStorage.setItem('outlook_logged_in', 'true');
  globalThis.fetch = (async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: { message: 'Access token expired' } })
  })) as any;

  const resT4 = await sendOutlookMessage({
    subject: 'Subj',
    bodyText: 'Text',
    recipients: [{ email: 'test@ex.com' }]
  });

  assert(
    !resT4.success &&
    resT4.reason === 'authentication_required' &&
    localStorage.getItem('ms_graph_access_token') === null,
    'TEST 4: Graph 401 -> authentication_required & Loginstatus zurückgesetzt'
  );

  // ----------------------------------------------------
  // TEST 5: Graph 403 -> authentication_required/graph_error, kein Erfolg
  // ----------------------------------------------------
  localStorage.setItem('ms_graph_access_token', 'forbidden-token');
  globalThis.fetch = (async () => ({
    ok: false,
    status: 403,
    json: async () => ({ error: { message: 'Access denied' } })
  })) as any;

  const resT5 = await sendOutlookMessage({
    subject: 'Subj',
    bodyText: 'Text',
    recipients: [{ email: 'test@ex.com' }]
  });

  assert(
    !resT5.success &&
    (resT5.reason === 'authentication_required' || resT5.reason === 'graph_error'),
    'TEST 5: Graph 403 -> Fehlermeldung & kein Erfolg'
  );

  // ----------------------------------------------------
  // TEST 6: Graph 429 mit Retry-After
  // ----------------------------------------------------
  localStorage.setItem('ms_graph_access_token', 'rate-limit-token');
  globalThis.fetch = (async () => ({
    ok: false,
    status: 429,
    headers: { get: (h: string) => (h.toLowerCase() === 'retry-after' ? '15' : null) },
    json: async () => ({})
  })) as any;

  const resT6 = await sendOutlookMessage({
    subject: 'Subj',
    bodyText: 'Text',
    recipients: [{ email: 'test@ex.com' }]
  });

  assert(
    !resT6.success &&
    resT6.reason === 'rate_limited' &&
    resT6.retryAfter === 15,
    'TEST 6: Graph 429 -> rate_limited & retryAfter=15 aus Header gelesen'
  );

  // ----------------------------------------------------
  // TEST 7: Graph 500 -> graph_error
  // ----------------------------------------------------
  localStorage.setItem('ms_graph_access_token', 'valid-token');
  globalThis.fetch = (async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: { message: 'Internal Server Error' } })
  })) as any;

  const resT7 = await sendOutlookMessage({
    subject: 'Subj',
    bodyText: 'Text',
    recipients: [{ email: 'test@ex.com' }]
  });

  assert(
    !resT7.success &&
    resT7.reason === 'graph_error',
    'TEST 7: Graph 500 -> graph_error & manueller Versuch weiterhin möglich'
  );

  // ----------------------------------------------------
  // TEST 8: Doppelklick -> genau ein Fetch-Aufruf
  // ----------------------------------------------------
  localStorage.setItem('ms_graph_access_token', 'valid-token-8');
  let fetchCallCountT8 = 0;
  globalThis.fetch = (async () => {
    fetchCallCountT8++;
    await new Promise(r => setTimeout(r, 50));
    return { ok: true, status: 202, json: async () => ({}) };
  }) as any;

  const caseT8 = caseService.createCase({ title: 'Double Click Case', source: 'Email' });
  const draftT8 = emailDraftService.createDraftForCase(caseT8.id, {
    purpose: 'acknowledgement',
    originalSenderEmail: 'k8@ex.com'
  })!;

  const p1 = caseService.confirmEmailDraftSend(caseT8.id, draftT8.id);
  const p2 = caseService.confirmEmailDraftSend(caseT8.id, draftT8.id);
  await Promise.all([p1, p2]);

  assert(
    fetchCallCountT8 === 1,
    'TEST 8: Doppelklick-Schutz -> Genau 1 Fetch-Aufruf bei paralleler Ausführung'
  );

  // ----------------------------------------------------
  // TEST 9: Reload nach sent -> kein erneuter Versand
  // ----------------------------------------------------
  const caseT9 = caseService.createCase({ title: 'Sent Case Reload', source: 'Email' });
  const draftT9 = emailDraftService.createDraftForCase(caseT9.id, {
    purpose: 'acknowledgement',
    originalSenderEmail: 'k9@ex.com'
  })!;
  draftT9.status = 'sent';
  caseService.updateEmailDraft(caseT9.id, draftT9);
  caseService.flushPersistence();

  // Re-hydrate
  const rehydratedServiceT9 = new CaseService();
  const restoredDraftT9 = rehydratedServiceT9.getCase(caseT9.id)?.emailDrafts?.find(d => d.id === draftT9.id);

  assert(
    restoredDraftT9?.status === 'sent',
    'TEST 9: Reload nach sent -> Status bleibt sent, kein erneuter Versand'
  );

  // ----------------------------------------------------
  // TEST 10: Hydration mit status sending -> reset to failed
  // ----------------------------------------------------
  const caseT10 = caseService.createCase({ title: 'Sending Interrupted', source: 'Email' });
  const draftT10 = emailDraftService.createDraftForCase(caseT10.id, {
    purpose: 'acknowledgement',
    originalSenderEmail: 'k10@ex.com'
  })!;

  // Simulate sending state saved to storage before crash/reload
  draftT10.status = 'sending';
  caseService.updateEmailDraft(caseT10.id, draftT10);
  caseService.flushPersistence();

  const rehydratedServiceT10 = new CaseService();
  const restoredDraftT10 = rehydratedServiceT10.getCase(caseT10.id)?.emailDrafts?.find(d => d.id === draftT10.id);

  assert(
    restoredDraftT10?.status === 'failed' &&
    !!restoredDraftT10?.errorMessage?.includes('unterbrochen'),
    'TEST 10: Hydration mit status sending -> Automatisch auf failed zurückgesetzt mit Hinweis'
  );

  // ----------------------------------------------------
  // TEST 11: Lokaler Fallback ohne Token -> Niemals status sent
  // ----------------------------------------------------
  localStorage.removeItem('ms_graph_access_token');
  const caseT11 = caseService.createCase({ title: 'Offline Fallback Check', source: 'Email' });
  const draftT11 = emailDraftService.createDraftForCase(caseT11.id, {
    purpose: 'request_missing_information',
    originalSenderEmail: 'k11@ex.com',
    requestedFields: [{ field: 'pickup_address', label: 'Abholadresse', reason: 'fehlt', required: true }]
  })!;

  const resT11 = await caseService.confirmEmailDraftSend(caseT11.id, draftT11.id);
  const updatedCaseT11 = caseService.getCase(caseT11.id)!;
  const draftStateT11 = updatedCaseT11.emailDrafts?.find(d => d.id === draftT11.id);

  assert(
    !resT11.success &&
    draftStateT11?.status !== 'sent' &&
    updatedCaseT11.status !== 'Waiting for Customer',
    'TEST 11: Ohne Token -> Niemals status sent, Case nicht auf Waiting for Customer gesetzt'
  );

  // ----------------------------------------------------
  // TEST 12: Test-Mock-Transport
  // ----------------------------------------------------
  const mockTransport: OutlookMailTransport = {
    async sendReply(req) {
      return {
        success: true,
        delivery: 'simulated',
        statusCode: 200,
        message: 'Injected Test Mock Transport'
      };
    }
  };

  setOutlookMailTransportOverride(mockTransport);
  const mockRes = await sendOutlookMessage({
    subject: 'Mock Subj',
    bodyText: 'Mock Body',
    recipients: [{ email: 'mock@ex.com' }]
  });

  setOutlookMailTransportOverride(null); // Reset override

  assert(
    mockRes.success &&
    mockRes.delivery === 'simulated',
    'TEST 12: Test-Mock-Transport -> Erfolgreich nur über explizit injizierten Transport'
  );

  // Restore fetch
  globalThis.fetch = origFetch;

  console.log('\n====================================================');
  console.log(`OUTLOOK TRANSPORT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runOutlookTransportTests().catch(err => {
  console.error('Outlook transport test error:', err);
  process.exit(1);
});
