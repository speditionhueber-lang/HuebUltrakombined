import { caseService, Case } from '../src/lib/case-service';
import { invoiceDraftService } from '../src/lib/invoice-draft-service';
import { emailDraftService } from '../src/lib/email-draft-service';
import { documentService } from '../src/lib/document-service';
import { evaluateInvoiceSendReadiness } from '../src/lib/invoice-send-validator';
import { automationService } from '../src/lib/automation-service';
import { setOutlookMailTransportOverride } from '../src/lib/outlook-service';
import { workflowEngine } from '../src/lib/workflow-engine';
import { EmailResponseDraft } from '../src/lib/types';

async function runInvoiceSendTests() {
  console.log('=== Starting Controlled Invoice Shipping Tests ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Setup Test Case
  const caseId = `case-inv-send-test-${Date.now()}`;
  const caseData: Partial<Case> = {
    title: 'Herr Markus Sommer - Umzug Berlin',
    status: 'In Progress',
    customerDraft: {
      id: `cd-${caseId}`,
      caseId,
      sourceEventId: 'ev1',
      source: 'Outlook',
      status: 'approved',
      confidence: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: {
        name: { value: 'Markus Sommer', recognized: true, confidence: 'high', source: 'manual' },
        email: { value: 'markus.sommer@example.com', recognized: true, confidence: 'high', source: 'manual' },
        phone: { value: '+49 170 9876543', recognized: true, confidence: 'high', source: 'manual' },
        pickupAddress: {},
        destinationAddress: {}
      }
    },
    operationExecutionReviews: [
      {
        id: `exec-${caseId}`,
        caseId,
        operationPreparationReviewId: 'prep-1',
        calendarPlanningReviewId: 'cal-1',
        tourPlanningReviewId: 'tour-1',
        plannedData: {} as any,
        deviations: [],
        completionChecklist: [],
        readiness: 'ready_to_complete',
        status: 'completed',
        actualData: {
          employeeIds: [],
          materialsUsed: [],
          actualEnd: '2026-08-01T15:30:00Z',
          completedServices: [
            { id: 'item-1', label: 'Umzug Service Standard', planned: true, completed: true, partiallyCompleted: false, source: 'offer' }
          ],
          additionalServices: [
            { id: 'add-1', description: 'Halteverbotszone Eilauftrag', quantity: 1, unit: 'Stk', customerApproved: true, billable: true, createdAt: new Date().toISOString() }
          ]
        },
        incidents: [],
        followUpRequired: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    offerDrafts: [
      {
        id: `offer-${caseId}`,
        caseId,
        customerId: 'cust-1',
        offerType: 'binding',
        currency: 'EUR',
        subtotalNet: 1000.00,
        status: 'approved',
        documentNumber: 'ANG-2026-00123',
        netTotal: 1000.00,
        vatRate: 20,
        vatAmount: 200.00,
        grossTotal: 1200.00,
        items: [
          { id: 'item-1', description: 'Umzug Service Standard', unitPrice: 1000.00, quantity: 1, unit: 'Psch', total: 1000.00, category: 'Zusatzleistung', selected: true }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        corrections: []
      }
    ],
    invoiceDrafts: [],
    emailDrafts: [],
    tasks: [],
    timeline: []
  };

  const createdCase = caseService.createCase(caseData);
  createdCase.operationExecutionReviews = caseData.operationExecutionReviews;
  createdCase.offerDrafts = caseData.offerDrafts;
  const actualCaseId = createdCase.id;
  console.log(`[1] Created Test Case ID: ${actualCaseId}`);

  // 2. Generate Invoice Draft
  const draftResult = invoiceDraftService.createInvoiceDraftForCase(actualCaseId);
  assert(!!draftResult, 'Invoice draft created from completed execution');
  assert(draftResult?.status === 'draft', 'Draft status is draft');

  // 3. Register PDF and Receivable
  const regResult = await invoiceDraftService.generateInvoicePDFAndRegister(actualCaseId, draftResult!.id);
  assert(!!regResult, 'Invoice PDF generated and registered');
  assert(!!regResult?.document.id, 'Document ID assigned');
  assert(!!regResult?.receivable.id, 'Receivable created');

  const refreshedCase = caseService.getCase(actualCaseId)!;
  const invoiceDraft = refreshedCase.invoiceDrafts?.find(i => i.id === draftResult!.id);
  assert(!!invoiceDraft, 'Invoice draft present in case');
  assert(invoiceDraft?.status === 'pdf_created', 'Invoice draft status is pdf_created');

  // 4. Verify Invoice Email Draft creation
  const invoiceEmailDraft = refreshedCase.emailDrafts?.find(d => d.purpose === 'invoice_delivery');
  assert(!!invoiceEmailDraft, 'Invoice Email Draft automatically created with purpose "invoice_delivery"');
  assert(invoiceEmailDraft?.attachments?.length === 1, 'Email draft contains PDF attachment reference');
  assert(invoiceEmailDraft?.recipients[0].email === 'markus.sommer@example.com', 'Email draft recipient matches customer email');
  assert(!!invoiceEmailDraft?.subject.includes(invoiceDraft!.invoiceNumber!), 'Email draft subject contains invoice number');

  // 5. Test Invoice Send Readiness Check
  const readiness = evaluateInvoiceSendReadiness(refreshedCase, invoiceDraft, invoiceEmailDraft);
  assert(readiness.ready === true, 'evaluateInvoiceSendReadiness returns ready: true');
  assert(readiness.errors.length === 0, 'No readiness errors');

  // 6. Test Controlled Email Send (Outlook Graph API simulation)
  setOutlookMailTransportOverride({
    async sendReply(req) {
      return {
        success: true,
        delivery: 'graph',
        graphMessageId: 'msg-outlook-inv-123',
        statusCode: 200
      };
    }
  });

  let capturedEvent: string | null = null;
  const unsubscribe = workflowEngine.subscribe((event) => {
    if (event.type === 'INVOICE_SENT') {
      capturedEvent = event.type;
    }
  });

  const sendResult = await caseService.confirmEmailDraftSend(actualCaseId, invoiceEmailDraft!.id);
  console.log('sendResult:', sendResult);

  unsubscribe();

  assert(sendResult.success === true, 'confirmEmailDraftSend succeeded via Graph API');
  assert(capturedEvent === 'INVOICE_SENT', 'INVOICE_SENT workflow event was emitted');

  // 7. Verify Post-Send State
  const postSendCase = caseService.getCase(actualCaseId)!;
  const sentEmailDraft = postSendCase.emailDrafts?.find(d => d.id === invoiceEmailDraft!.id);
  assert(sentEmailDraft?.status === 'sent', 'Email draft status updated to "sent"');
  assert(!!sentEmailDraft?.sentAt, 'sentAt timestamp set on email draft');

  const sentInvoiceDraft = postSendCase.invoiceDrafts?.find(i => i.id === invoiceDraft!.id);
  assert(!!sentInvoiceDraft?.sentAt, 'sentAt timestamp set on invoice draft');

  const receivable = caseService.getReceivables(actualCaseId)[0];
  assert(receivable.status === 'open', 'Receivable status remains "open"');

  const sendTask = postSendCase.tasks.find(t => t.title.includes('Rechnung versenden'));
  assert(sendTask?.status === 'Completed', 'Task "Rechnung versenden" is Completed');

  const monitorTask = postSendCase.tasks.find(t => t.title.includes('Zahlung überwachen'));
  assert(monitorTask?.status === 'Waiting', 'Task "Zahlung überwachen" is Waiting');

  const timelineEntry = postSendCase.timeline.find(t => t.title.includes('Rechnung per E-Mail versendet'));
  assert(!!timelineEntry, 'Timeline entry for sent invoice added');

  // 8. Test Idempotency / Already Sent Rejection
  const duplicateReadiness = evaluateInvoiceSendReadiness(postSendCase, sentInvoiceDraft, sentEmailDraft);
  assert(duplicateReadiness.ready === false, 'Duplicate send readiness check fails');
  assert(duplicateReadiness.status === 'already_sent', 'Readiness status is "already_sent"');

  console.log(`\n=== Test Summary: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runInvoiceSendTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
