import { validateEmailResponseDraft, canTransitionEmailDraftStatus } from './src/lib/email-draft-validator';
import { generateEmailResponseDraftText, formatReplySubject, formatSalutation, detectLanguage, getCentralCompanySignature } from './src/lib/email-draft-generator';
import { emailDraftService } from './src/lib/email-draft-service';
import { caseService } from './src/lib/case-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { decisionEngine } from './src/lib/decision-engine';
import { sendOutlookMessage } from './src/lib/outlook-service';
import { EmailResponseDraft } from './src/lib/types';

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

async function runTests() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED TESTS: KI-MAILASSISTENT E-MAIL-ENTWÜRFE (20+ VERIFICATION SUITE)');
  console.log('====================================================\n');

  // Test 1: Draft generation for 'request_missing_information'
  const genMissing = generateEmailResponseDraftText({
    purpose: 'request_missing_information',
    originalSenderName: 'Max Mustermann',
    requestedFields: [{ field: 'pickup_address', label: 'Abholadresse', reason: 'fehlt', required: true }]
  });
  assert(genMissing.bodyText.includes('Abholadresse') && genMissing.subject.length > 0, 'Test 1: Draft generation for request_missing_information');

  // Test 2: Draft generation for 'schedule_viewing'
  const genViewing = generateEmailResponseDraftText({
    purpose: 'schedule_viewing',
    originalSenderName: 'Erika Musterfrau'
  });
  assert(genViewing.bodyText.includes('Besichtigung') || genViewing.bodyText.includes('Termin'), 'Test 2: Draft generation for schedule_viewing');

  // Test 3: Draft generation for 'callback_confirmation'
  const genCallback = generateEmailResponseDraftText({
    purpose: 'callback_confirmation',
    originalSenderName: 'Herr Huber'
  });
  assert(genCallback.bodyText.includes('zurück') || genCallback.bodyText.includes('Rückruf'), 'Test 3: Draft generation for callback_confirmation');

  // Test 4: Draft generation for 'acknowledgement'
  const genAck = generateEmailResponseDraftText({
    purpose: 'acknowledgement',
    originalSenderName: 'Frau Schmidt'
  });
  assert(genAck.bodyText.includes('Eingang') || genAck.bodyText.includes('vielen Dank'), 'Test 4: Draft generation for acknowledgement');

  // Setup Base Test Draft
  const baseDraft: EmailResponseDraft = {
    id: 'test-d1',
    caseId: 'case-1',
    sourceEventId: 'evt-1',
    status: 'draft',
    purpose: 'request_missing_information',
    replyMode: 'reply',
    recipients: [{ email: 'kunde@example.com' }],
    ccRecipients: [],
    subject: 'Re: Ihre Anfrage',
    bodyText: 'Guten Tag, bitte senden Sie uns noch Ihre Adresse.\n\nMit freundlichen Grüßen\nSpedition Hueber GmbH',
    originalSubject: 'Anfrage',
    originalSenderEmail: 'kunde@example.com',
    requestedFields: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'rule',
    confidence: 'high',
    corrections: []
  };

  // Test 5: Validation - Missing recipient -> Error
  const vMissingRec = validateEmailResponseDraft({ ...baseDraft, recipients: [] });
  assert(!vMissingRec.valid && vMissingRec.errors.some(e => e.includes('Empfänger')), 'Test 5: Validation - Missing recipient triggers error');

  // Test 6: Validation - Invalid recipient email -> Error
  const vInvalidRec = validateEmailResponseDraft({ ...baseDraft, recipients: [{ email: 'invalid-email-address' }] });
  assert(!vInvalidRec.valid && vInvalidRec.errors.some(e => e.includes('Ungültige')), 'Test 6: Validation - Invalid recipient email triggers error');

  // Test 7: Validation - Empty subject -> Error
  const vEmptySubj = validateEmailResponseDraft({ ...baseDraft, subject: '   ' });
  assert(!vEmptySubj.valid && vEmptySubj.errors.some(e => e.includes('Betreff')), 'Test 7: Validation - Empty subject triggers error');

  // Test 8: Validation - Empty body -> Error
  const vEmptyBody = validateEmailResponseDraft({ ...baseDraft, bodyText: '   ' });
  assert(!vEmptyBody.valid && vEmptyBody.errors.some(e => e.includes('Nachrichtentext')), 'Test 8: Validation - Empty body triggers error');

  // Test 9: Validation - Unresolved template placeholders -> Error
  const vTemplate = validateEmailResponseDraft({ ...baseDraft, bodyText: 'Hallo {{customerName}}, bitte Daten senden.' });
  assert(!vTemplate.valid && vTemplate.errors.some(e => e.includes('Template-Platzhalter')), 'Test 9: Validation - Unresolved placeholders trigger error');

  // Test 10: Validation - Text is only signature -> Error
  const vSigOnly = validateEmailResponseDraft({ ...baseDraft, bodyText: 'Spedition Hueber GmbH\noffice@spedition-hueber.at\nMit freundlichen Grüßen' });
  assert(!vSigOnly.valid && vSigOnly.errors.some(e => e.includes('Signatur')), 'Test 10: Validation - Body text with only signature triggers error');

  // Test 11: Idempotency - Duplicate draft creation call returns existing draft
  const testCase1 = caseService.createCase({ source: 'Test', title: 'Anfrage Case 1', priority: 'high', confidence: 'high' });
  const d1 = emailDraftService.createDraftForCase(testCase1.id, { purpose: 'request_missing_information', originalSenderEmail: 'd1@example.com' });
  const d1Dup = emailDraftService.createDraftForCase(testCase1.id, { purpose: 'request_missing_information', originalSenderEmail: 'd1@example.com' });
  assert(d1 !== null && d1Dup?.id === d1.id, 'Test 11: Idempotency - Second draft creation returns existing draft');

  // Test 12: Status transition allowed: draft -> edited -> approved -> sending -> sent
  assert(
    canTransitionEmailDraftStatus('draft', 'edited') &&
    canTransitionEmailDraftStatus('edited', 'approved') &&
    canTransitionEmailDraftStatus('approved', 'sending') &&
    canTransitionEmailDraftStatus('sending', 'sent'),
    'Test 12: Status transition allowed: draft -> edited -> approved -> sending -> sent'
  );

  // Test 13: Forbidden status transition: sent -> sending
  assert(!canTransitionEmailDraftStatus('sent', 'sending'), 'Test 13: Forbidden transition: sent -> sending fails');

  // Test 14: Forbidden status transition: rejected -> sending
  assert(!canTransitionEmailDraftStatus('rejected', 'sending'), 'Test 14: Forbidden transition: rejected -> sending fails');

  // Test 15: Double-send protection - Parallel send calls rejected
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ms_graph_access_token', 'test-valid-token');
  }
  const prevFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    await new Promise(r => setTimeout(r, 20));
    return { ok: true, status: 202, json: async () => ({}) };
  }) as any;

  const lockCase = caseService.createCase({ source: 'TestLock', title: 'Locking Case', priority: 'high', confidence: 'high' });
  const lockDraft = emailDraftService.createDraftForCase(lockCase.id, { purpose: 'acknowledgement', originalSenderEmail: 'lock@example.com' })!;
  const p1 = caseService.confirmEmailDraftSend(lockCase.id, lockDraft.id);
  const p2 = caseService.confirmEmailDraftSend(lockCase.id, lockDraft.id);
  const [r1, r2] = await Promise.all([p1, p2]);
  assert((r1.success || r2.success) && (!r1.success || !r2.success), 'Test 15: Double-send protection - Parallel send call rejected by lock');
  globalThis.fetch = prevFetch;

  // Test 16: Graph API Reply Path - Simulate 200 OK -> Status sent
  const replyMockFetch = (async (url: string) => {
    if (url.includes('/reply')) {
      return { ok: true, status: 202, json: async () => ({}) };
    }
    return { ok: false, status: 400, json: async () => ({}) };
  }) as any;

  const resReply = await sendOutlookMessage(
    { sourceMessageId: 'msg-123', subject: 'Re: Test', bodyText: 'Antworttext', recipients: [{ email: 'k@ex.com' }] },
    { token: 'mock-token', fetchFn: replyMockFetch }
  );
  assert(resReply.success && !!resReply.messageId?.includes('graph-reply'), 'Test 16: Graph API Reply Path succeeds');

  // Test 17: Graph API sendMail Path - Fallback to sendMail when no sourceMessageId -> Status sent
  const sendMailMockFetch = (async (url: string) => {
    if (url.includes('/sendMail')) {
      return { ok: true, status: 202, json: async () => ({}) };
    }
    return { ok: false, status: 400, json: async () => ({}) };
  }) as any;

  const resSendMail = await sendOutlookMessage(
    { subject: 'Neuer Betreff', bodyText: 'Nachrichtentext', recipients: [{ email: 'k@ex.com' }] },
    { token: 'mock-token', fetchFn: sendMailMockFetch }
  );
  assert(resSendMail.success && !!resSendMail.messageId?.includes('graph-sent'), 'Test 17: Graph API sendMail Fallback Path succeeds');

  // Test 18: Graph API Error Path - Simulate 401/403/500 -> Status failed + error message
  const errorMockFetch = (async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: { message: 'Unauthorized access token' } })
  })) as any;

  const resError = await sendOutlookMessage(
    { subject: 'Error Test', bodyText: 'Text', recipients: [{ email: 'k@ex.com' }] },
    { token: 'invalid-token', fetchFn: errorMockFetch }
  );
  assert(!resError.success && !!resError.error?.includes('Authentifizierungsfehler'), 'Test 18: Graph API Error Path handles 401/403 gracefully');

  // Test 19: Task & Case Status Update - Successful send sets task to 'Completed' and case to 'Waiting for Customer'
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ms_graph_access_token', 'test-valid-token');
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    return { ok: true, status: 202, json: async () => ({ id: 'mock-msg-123' }) };
  }) as any;

  const sendSuccessCase = caseService.createCase({ source: 'Test19', title: 'Send Success Case', priority: 'high', confidence: 'high' });
  const sendDraft = emailDraftService.createDraftForCase(sendSuccessCase.id, {
    purpose: 'request_missing_information',
    originalSenderEmail: 'kundenanfrage@example.com',
    requestedFields: [{ field: 'pickup_address', label: 'Abholadresse', reason: 'fehlt', required: true }]
  })!;
  const sendRes = await caseService.confirmEmailDraftSend(sendSuccessCase.id, sendDraft.id, { token: 'test-valid-token' });
  const currentCase19 = caseService.getCase(sendSuccessCase.id)!;
  const sentDraft = currentCase19.emailDrafts?.find(d => d.id === sendDraft.id);
  const completedTask = currentCase19.tasks.find(t => t.referenceType === 'EMAIL_RESPONSE_DRAFT_REVIEW' && t.referenceId === sendDraft.id);
  assert(
    sendRes.success &&
    sentDraft?.status === 'sent' &&
    completedTask?.status === 'Completed' &&
    currentCase19.status === 'Waiting for Customer',
    'Test 19: Successful send sets draft status to sent, task to Completed, and case to Waiting for Customer'
  );
  globalThis.fetch = originalFetch;

  // Test 20: Privacy Check - No tokens or secrets stored in timeline or case state
  const caseStateStr = JSON.stringify(currentCase19);
  assert(!caseStateStr.includes('Bearer') && !caseStateStr.includes('ms_graph_access_token'), 'Test 20: Privacy Check - No tokens or secrets stored in timeline or case state');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
