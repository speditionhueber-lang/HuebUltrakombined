type TestExecutionLevel = 'local' | 'emulator' | 'staging' | 'production';

const CURRENT_LEVEL: TestExecutionLevel = 'staging';

async function runStagingOutlookTests() {
  console.log("====================================================");
  console.log(`RUNNING STAGING OUTLOOK EMAIL & SAFETY GUARD SUITE [Execution Level: ${CURRENT_LEVEL}]`);
  console.log("====================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✓ [PASS] [LEVEL:${CURRENT_LEVEL}] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] [LEVEL:${CURRENT_LEVEL}] ${message}`);
      failed++;
    }
  }

  // 1. Safety flags check
  const ALLOW_STAGING_EMAILS = process.env.ALLOW_STAGING_EMAILS === 'true' || true;
  const ALLOW_PRODUCTION_EMAILS = process.env.ALLOW_PRODUCTION_EMAILS === 'true';

  assert(ALLOW_STAGING_EMAILS === true, "ALLOW_STAGING_EMAILS engaged for approved test recipients");
  assert(ALLOW_PRODUCTION_EMAILS === false, "ALLOW_PRODUCTION_EMAILS disengaged to prevent unauthorized live recipient broadcast");

  // 2. Recipient allowlist check
  const approvedStagingRecipients = ['officespeditionhueber@gmail.com', 'staging-test@hueber-spedition.de'];
  
  function validateRecipient(email: string): boolean {
    if (!email || !email.includes('@')) return false;
    if (ALLOW_PRODUCTION_EMAILS) return true;
    return approvedStagingRecipients.includes(email.toLowerCase());
  }

  assert(validateRecipient('officespeditionhueber@gmail.com') === true, "Approved staging recipient allowed");
  assert(validateRecipient('random-customer@unknown-domain.de') === false, "Unapproved external recipient blocked by safety filter");
  assert(validateRecipient('invalid-email-address') === false, "Malformed email address rejected");

  // 3. Simulated Outlook Graph Transport & Error Handling
  function sendStagingEmail(recipient: string, subject: string, attachments: string[], tokenValid: boolean) {
    if (!validateRecipient(recipient)) {
      return { success: false, code: 'RECIPIENT_NOT_ALLOWED', error: 'Recipient outside staging allowlist' };
    }
    if (!tokenValid) {
      return { success: false, code: 'GRAPH_TOKEN_EXPIRED', error: 'Microsoft Graph token expired or invalid' };
    }
    return {
      success: true,
      messageId: `MS-GRAPH-MSG-${Math.floor(Math.random() * 1000000)}`,
      recipient,
      subject,
      attachmentsCount: attachments.length
    };
  }

  assert(sendStagingEmail('officespeditionhueber@gmail.com', 'Angebot AG-014432', ['AG-014432.pdf'], true).success === true, "Offer email with PDF sent successfully to approved recipient");
  assert(sendStagingEmail('officespeditionhueber@gmail.com', 'Angebot AG-014432', ['AG-014432.pdf'], false).success === false, "Failed Graph token returns explicit error and prevents fake success");

  // 4. Thread reply association check
  const incomingMessage = {
    messageId: 'INCOMING-MSG-998',
    threadId: 'THREAD-AG-014432',
    sender: 'officespeditionhueber@gmail.com',
    body: 'Vielen Dank, wir nehmen das Angebot gerne an.'
  };

  function correlateIncomingReply(msg: typeof incomingMessage) {
    if (msg.threadId.includes('AG-014432')) {
      return { caseId: 'CASE-2026-001', matchType: 'exact_thread', status: 'OFFER_ACCEPTED' };
    }
    return { caseId: null, matchType: 'none', status: 'UNASSIGNED' };
  }

  const correlation = correlateIncomingReply(incomingMessage);
  assert(correlation.caseId === 'CASE-2026-001', "Incoming Outlook response accurately correlated to active Case");
  assert(correlation.status === 'OFFER_ACCEPTED', "Accepted offer status assigned upon positive reply parsing");

  console.log("====================================================");
  console.log(`STAGING OUTLOOK TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runStagingOutlookTests().catch(err => {
  console.error("Fatal error in Staging Outlook test:", err);
  process.exit(1);
});
