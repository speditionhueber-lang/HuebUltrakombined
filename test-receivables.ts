import { caseService, Case } from './src/lib/case-service';
import {
  receivableService,
  evaluateReceivableStatus,
  calculateReceivableBalance,
  evaluateReceivableDueState,
  evaluatePaymentReminderReadiness
} from './src/lib/receivable-service';
import { setOutlookMailTransportOverride } from './src/lib/outlook-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { Receivable } from './src/lib/types';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runReceivableTests() {
  console.log('\n=== STARTE RECEIVABLE & PAYMENT REMINDER TEST SUITE ===\n');

  // Setup mock mail transport override for test environment
  setOutlookMailTransportOverride({
    async sendReply(req) {
      return {
        success: true,
        delivery: 'simulated',
        statusCode: 200,
        message: `Mock sent to ${req.recipients?.[0]?.email}`
      };
    }
  });

  // 1. Test evaluateReceivableStatus
  console.log('Test 1: Statusberechnung evaluateReceivableStatus');
  assert(
    evaluateReceivableStatus({ originalAmount: 1000, paidAmount: 0, dueDate: '2026-12-31' }, '2026-08-01') === 'open',
    'Unfällige Rechnung ohne Zahlung -> open'
  );
  assert(
    evaluateReceivableStatus({ originalAmount: 1000, paidAmount: 400, dueDate: '2026-12-31' }, '2026-08-01') === 'partially_paid',
    'Teilbezahlte Rechnung vor Fälligkeit -> partially_paid'
  );
  assert(
    evaluateReceivableStatus({ originalAmount: 1000, paidAmount: 1000, dueDate: '2026-12-31' }, '2026-08-01') === 'paid',
    'Vollständig bezahlte Rechnung -> paid'
  );
  assert(
    evaluateReceivableStatus({ originalAmount: 1000, paidAmount: 0, dueDate: '2026-07-01' }, '2026-08-01') === 'overdue',
    'Überfällige Rechnung ohne Zahlung -> overdue'
  );

  // 2. Test sticky status behavior
  console.log('\nTest 2: Sticky Status (disputed, cancelled, written_off)');
  assert(
    evaluateReceivableStatus({ originalAmount: 1000, paidAmount: 0, status: 'disputed', dueDate: '2026-01-01' }, '2026-08-01') === 'disputed',
    'Status disputed bleibt unverändert'
  );
  assert(
    evaluateReceivableStatus({ originalAmount: 1000, paidAmount: 0, status: 'cancelled', dueDate: '2026-01-01' }, '2026-08-01') === 'cancelled',
    'Status cancelled bleibt unverändert'
  );

  // 3. Test calculateReceivableBalance
  console.log('\nTest 3: Saldenberechnung calculateReceivableBalance');
  const dummyReceivable: Receivable = {
    id: 'rec-test-1',
    caseId: 'case-test-1',
    customerId: 'cust-1',
    invoiceDraftId: 'inv-1',
    invoiceNumber: 'RE-2026-1001',
    invoiceDate: '2026-07-01',
    dueDate: '2026-07-15',
    originalAmount: 1200.50,
    paidAmount: 0,
    outstandingAmount: 1200.50,
    status: 'open',
    payments: [
      { id: 'p1', amount: 300.25, date: '2026-07-05', method: 'bank_transfer' },
      { id: 'p2', amount: 200.25, date: '2026-07-10', method: 'bank_transfer' }
    ],
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z'
  };

  const calculated = calculateReceivableBalance(dummyReceivable, '2026-07-20');
  assert(calculated.paidAmount === 500.50, 'Gezahlter Betrag ist exakt 500.50 €');
  assert(calculated.outstandingAmount === 700.00, 'Offener Restbetrag ist exakt 700.00 €');
  assert(calculated.status === 'overdue', 'Status ist overdue (nach Fälligkeit)');

  // 4. Test evaluateReceivableDueState
  console.log('\nTest 4: Urgency / Due state Levels');
  assert(
    evaluateReceivableDueState({ ...dummyReceivable, dueDate: '2026-08-10' }, '2026-08-01') === 'not_due',
    'Vor Fälligkeit -> not_due'
  );
  assert(
    evaluateReceivableDueState({ ...dummyReceivable, dueDate: '2026-08-01' }, '2026-08-01') === 'due_today',
    'Am Fälligkeitstag -> due_today'
  );
  assert(
    evaluateReceivableDueState({ ...dummyReceivable, dueDate: '2026-07-28' }, '2026-08-01') === 'overdue_1_7_days',
    '4 Tage drüber -> overdue_1_7_days'
  );
  assert(
    evaluateReceivableDueState({ ...dummyReceivable, dueDate: '2026-07-20' }, '2026-08-01') === 'overdue_8_14_days',
    '12 Tage drüber -> overdue_8_14_days'
  );
  assert(
    evaluateReceivableDueState({ ...dummyReceivable, dueDate: '2026-07-01' }, '2026-08-01') === 'overdue_over_14_days',
    '31 Tage drüber -> overdue_over_14_days'
  );

  // 5. Integration Test on Case & Record Payment
  console.log('\nTest 5: Zahlung verbuchen (recordPayment) & Validierung');
  const testCase = caseService.createCase({ title: 'Manual Test Case', source: 'Email' });
  testCase.customerDraft = {
    id: 'cd-1',
    caseId: testCase.id,
    sourceEventId: 'ev1',
    source: 'email',
    confidence: 'high',
    originalExtractedData: {},
    corrections: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: {
      name: { value: 'Max Mustermann', recognized: true, source: 'email', confidence: 'high' },
      email: { value: 'max@example.com', recognized: true, source: 'email', confidence: 'high' },
      phone: { value: '', recognized: false, source: 'email', confidence: 'low' },
      pickupAddress: { raw: { value: '', recognized: false, source: 'email', confidence: 'low' } },
      destinationAddress: { raw: { value: '', recognized: false, source: 'email', confidence: 'low' } }
    }
  } as any;

  const testReceivable: Receivable = {
    id: 'rec-case-1',
    caseId: testCase.id,
    customerId: 'cust-100',
    invoiceDraftId: 'inv-draft-100',
    invoiceNumber: 'RE-2026-0099',
    invoiceDate: '2026-07-01',
    dueDate: '2026-07-14',
    originalAmount: 500.00,
    paidAmount: 0,
    outstandingAmount: 500.00,
    status: 'overdue',
    payments: [],
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z'
  };

  testCase.receivables = [testReceivable];
  caseService.saveCases();

  // Test payment <= 0
  const invalidPay = receivableService.recordPayment(testCase.id, testReceivable.id, { amount: -10, date: '2026-07-05' });
  assert(!invalidPay.success, 'Negativer Zahlungsbetrag abgelehnt');

  // Test overpayment requirement
  const overpay = receivableService.recordPayment(testCase.id, testReceivable.id, { amount: 600, date: '2026-07-05' });
  assert(!overpay.success, 'Überzahlung ohne allowOverpayment abgelehnt');

  // Record valid partial payment
  let recordedEvents: string[] = [];
  const eventListener = (e: any) => {
    recordedEvents.push(e.type);
  };
  workflowEngine.on('event', eventListener);

  const partialPay = receivableService.recordPayment(testCase.id, testReceivable.id, {
    amount: 200,
    date: '2026-07-05',
    method: 'bank_transfer',
    reference: 'Gutschrift #1'
  });

  assert(partialPay.success, 'Teilzahlung über 200 € erfolgreich verbucht');
  assert(partialPay.receivable?.paidAmount === 200, 'Gezahlter Betrag ist 200 €');
  assert(partialPay.receivable?.outstandingAmount === 300, 'Restbetrag ist 300 €');
  assert(partialPay.receivable?.status === 'overdue', 'Status nach Teilzahlung weiterhin overdue da nach DueDate');

  // Test duplicate payment protection
  const dupPay = receivableService.recordPayment(testCase.id, testReceivable.id, {
    amount: 200,
    date: '2026-07-05',
    method: 'bank_transfer',
    reference: 'Gutschrift #1'
  });
  assert(!dupPay.success, 'Duplikat-Zahlung geschützt & abgelehnt');

  // Record remaining payment to complete invoice
  const fullPay = receivableService.recordPayment(testCase.id, testReceivable.id, {
    amount: 300,
    date: '2026-07-06',
    method: 'bank_transfer'
  });

  assert(fullPay.success, 'Restzahlung über 300 € erfolgreich verbucht');
  assert(fullPay.receivable?.status === 'paid', 'Rechnungsstatus jetzt paid');
  assert(!!fullPay.receivable?.paidAt, 'paidAt Zeitstempel wurde gesetzt');
  assert(recordedEvents.includes('INVOICE_PAID'), 'INVOICE_PAID Event wurde emittiert');

  // 6. Payment update & delete
  console.log('\nTest 6: Zahlung bearbeiten und löschen');
  const payId = fullPay.payment?.id!;
  const delResult = receivableService.deletePayment(testCase.id, testReceivable.id, payId);
  assert(delResult.success, 'Zahlungseintrag gelöscht');
  assert(delResult.receivable?.paidAmount === 200, 'Gezahlter Betrag korrigiert auf 200 €');
  assert(delResult.receivable?.status === 'overdue', 'Status zurück auf overdue');

  // 7. Mark as disputed
  console.log('\nTest 7: Forderung als strittig markieren (disputed)');
  const dispResult = receivableService.markReceivableDisputed(testCase.id, testReceivable.id, 'Kunde reklamiert Kratzer');
  assert(dispResult.success, 'Als strittig markiert');
  assert(dispResult.receivable?.status === 'disputed', 'Status ist disputed');

  // 8. Test Payment Reminder Readiness & Preparation
  console.log('\nTest 8: Payment Reminder Readiness & Preparation');
  const readinessDisputed = evaluatePaymentReminderReadiness(testCase, dispResult.receivable!);
  assert(!readinessDisputed.ready, 'Keine Mahnung erlaubt bei strittiger Forderung');

  // Create fresh non-disputed overdue case
  const reminderCase = caseService.createCase({ title: 'Reminder Test Case', source: 'Email' });
  reminderCase.customerDraft = {
    id: 'cd-rem',
    caseId: reminderCase.id,
    sourceEventId: 'ev2',
    source: 'email',
    confidence: 'high',
    originalExtractedData: {},
    corrections: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: {
      name: { value: 'Erika Musterfrau', recognized: true, source: 'email', confidence: 'high' },
      email: { value: 'erika@example.com', recognized: true, source: 'email', confidence: 'high' },
      phone: { value: '', recognized: false, source: 'email', confidence: 'low' },
      pickupAddress: { raw: { value: '', recognized: false, source: 'email', confidence: 'low' } },
      destinationAddress: { raw: { value: '', recognized: false, source: 'email', confidence: 'low' } }
    }
  } as any;

  const overdueReceivable: Receivable = {
    id: 'rec-rem-1',
    caseId: reminderCase.id,
    customerId: 'cust-200',
    invoiceDraftId: 'inv-200',
    invoiceNumber: 'RE-2026-0200',
    invoiceDate: '2026-07-01',
    dueDate: '2026-07-10',
    originalAmount: 850.00,
    paidAmount: 150.00,
    outstandingAmount: 700.00,
    status: 'overdue',
    payments: [{ id: 'p-1', amount: 150.00, date: '2026-07-02', method: 'bank_transfer' }],
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z'
  };

  reminderCase.receivables = [overdueReceivable];
  caseService.saveCases();

  const readinessOverdue = evaluatePaymentReminderReadiness(reminderCase, overdueReceivable);
  assert(readinessOverdue.ready, 'Zahlungserinnerung ist bereit');

  const prepResult = receivableService.preparePaymentReminder(reminderCase.id, overdueReceivable.id);
  assert(prepResult.success, 'Zahlungserinnerung Entwurf erfolgreich erstellt');
  assert(!!prepResult.emailDraft, 'E-Mail-Entwurf Objekt vorhanden');
  assert(prepResult.emailDraft?.purpose === 'payment_reminder', 'Purpose ist payment_reminder');
  assert(!!prepResult.emailDraft?.bodyText.includes('150,00 €'), 'E-Mail-Text erwähnt die Teilzahlung von 150,00 €');
  assert(!!prepResult.emailDraft?.bodyText.includes('700,00 €'), 'E-Mail-Text erwähnt den Restbetrag von 700,00 €');

  // 9. Controlled Sending over Outlook
  console.log('\nTest 9: Kontrollierter Versand über Outlook & Sperre');
  const draftId = prepResult.emailDraft!.id;
  const sendPromise1 = receivableService.sendPaymentReminder(reminderCase.id, overdueReceivable.id, draftId);
  const sendPromise2 = receivableService.sendPaymentReminder(reminderCase.id, overdueReceivable.id, draftId);

  const [res1, res2] = await Promise.all([sendPromise1, sendPromise2]);
  assert((res1.success && !res2.success) || (!res1.success && res2.success), 'Doppelklick-Sperre verhindert parallelen Doppelversand');

  const updatedCase = caseService.getCase(reminderCase.id);
  const sentReceivable = updatedCase?.receivables?.find(r => r.id === overdueReceivable.id);
  assert((sentReceivable?.reminders || []).length > 0, 'Erinnerungshistorie auf Receivable gespeichert');
  assert(sentReceivable?.reminders?.[0]?.status === 'sent', 'Erinnerungsstatus in Historie ist sent');

  // 10. Task Synchronization
  console.log('\nTest 10: Aufgaben-Synchronisation (Task Management)');
  assert((updatedCase?.tasks || []).some(t => t.category === 'Invoice'), 'Rechnungs-Aufgaben existieren in Akte');

  console.log(`\n==================================================`);
  console.log(`TEST ERGEBNISSE: ${testsPassed} BESTANDEN, ${testsFailed} FEHLGESCHLAGEN`);
  console.log(`==================================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runReceivableTests().catch((err) => {
  console.error('Test Suite abgebrochen mit Fehler:', err);
  process.exit(1);
});
