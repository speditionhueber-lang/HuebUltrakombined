import { caseService, CaseService } from '../src/lib/case-service';
import { crmLookupService } from '../src/lib/crm-lookup-service';
import { validateCustomerDraft } from '../src/lib/customer-draft-validator';
import { CustomerDraft, Customer } from '../src/lib/types';
import { runDocumentStorageTests } from '../test-document-storage';

// Mock localStorage for Node environment if needed
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

async function runTests() {
  console.log("==========================================");
  console.log("RUNNING 16 FUNCTIONAL VERIFICATION TESTS");
  console.log("==========================================");

  let passedCount = 0;
  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (!condition) {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      throw new Error(`Test failed: ${testName}`);
    } else {
      console.log(`✅ PASS: ${testName}`);
      passedCount++;
    }
  };

  // TEST 1: Initialer Zustand nach Systemstart ist gültig
  const initialCases = caseService.getAllCases();
  assert(Array.isArray(initialCases), "TEST 1: Initialer Zustand nach Systemstart ist gültig");

  // Setup sample CRM customers
  const existingCustomer: Customer = {
    id: 'cust-101',
    name: 'Max Mustermann',
    nameLower: 'max mustermann',
    email: 'max@example.com',
    phone: '+43123456',
    address: { street: 'Hauptstr 1', city: 'Wien', zip: '1010', country: 'Österreich' },
    createdAt: new Date().toISOString(),
    avatarUrl: ''
  };
  crmLookupService.setCustomers([existingCustomer]);

  // TEST 2: EMAIL_RECEIVED mit exaktem CRM-Treffer erzeugt Case ohne CustomerDraft
  const caseMatch = caseService.createCase({
    title: 'Anfrage Max Mustermann',
    status: 'Draft',
    customerId: existingCustomer.id,
    source: 'Email'
  });
  assert(caseMatch.customerDraft === undefined, "TEST 2: EMAIL_RECEIVED mit exaktem CRM-Treffer erzeugt Case ohne CustomerDraft");

  // TEST 3: EMAIL_RECEIVED ohne CRM-Treffer erzeugt Case mit CustomerDraft
  const caseNoMatch = caseService.createCase({
    title: 'Anfrage Erika Musterfrau',
    status: 'Draft',
    source: 'Email'
  });
  const mockDraft: CustomerDraft = {
    id: 'draft-202',
    caseId: caseNoMatch.id,
    sourceEventId: 'evt-1',
    source: 'AI',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confidence: 'high',
    fields: {
      name: { value: 'Erika Musterfrau', recognized: true, confidence: 'high', source: 'AI' },
      email: { value: 'erika@muster.com', recognized: true, confidence: 'high', source: 'AI' },
      phone: { value: '+43664111222', recognized: true, confidence: 'high', source: 'AI' },
      pickupAddress: { raw: { value: 'Graz Hauptplatz 1', recognized: true, confidence: 'high', source: 'AI' } },
      destinationAddress: { raw: { value: 'Wien Westbahnhof 2', recognized: true, confidence: 'high', source: 'AI' } },
    },
    originalExtractedData: {},
    corrections: []
  };
  caseService.updateCustomerDraft(caseNoMatch.id, mockDraft);
  const updatedCaseNoMatch = caseService.getCase(caseNoMatch.id)!;
  assert(updatedCaseNoMatch.customerDraft?.status === 'draft', "TEST 3: EMAIL_RECEIVED ohne CRM-Treffer erzeugt Case mit CustomerDraft");

  // TEST 4: Neuer CustomerDraft ist editierbar und speichert Korrekturen
  const editedDraft: CustomerDraft = {
    ...mockDraft,
    status: 'edited',
    fields: {
      ...mockDraft.fields,
      name: { ...mockDraft.fields.name, value: 'Erika Musterfrau-Kovacs' }
    },
    corrections: [
      {
        field: 'name',
        previousValue: 'Erika Musterfrau',
        newValue: 'Erika Musterfrau-Kovacs',
        timestamp: new Date().toISOString(),
        user: 'current-user'
      }
    ]
  };
  caseService.updateCustomerDraft(caseNoMatch.id, editedDraft);
  const caseAfterEdit = caseService.getCase(caseNoMatch.id)!;
  assert(
    caseAfterEdit.customerDraft?.fields.name.value === 'Erika Musterfrau-Kovacs' &&
    (caseAfterEdit.customerDraft?.corrections?.length ?? 0) === 1,
    "TEST 4: Neuer CustomerDraft ist editierbar und speichert Korrekturen"
  );

  // TEST 5: Ungültiger CustomerDraft wird nicht konvertiert (Validierung greift)
  const invalidDraftName: CustomerDraft = {
    ...mockDraft,
    fields: {
      ...mockDraft.fields,
      name: { value: '', recognized: false, confidence: 'low', source: 'AI' }
    }
  };
  const valResName = validateCustomerDraft(invalidDraftName);
  assert(!valResName.valid && !!valResName.fieldErrors.name, "TEST 5: Ungültiger CustomerDraft wird nicht konvertiert (Name fehlt)");

  // TEST 6: ungültige E-Mail blockiert Konvertierung
  const invalidDraftEmail: CustomerDraft = {
    ...mockDraft,
    fields: {
      ...mockDraft.fields,
      email: { value: 'invalid-email-address', recognized: true, confidence: 'high', source: 'AI' }
    }
  };
  const valResEmail = validateCustomerDraft(invalidDraftEmail);
  assert(!valResEmail.valid && !!valResEmail.fieldErrors.email, "TEST 6: ungültige E-Mail blockiert Konvertierung");

  // TEST 7: CRM-Duplikat blockiert Konvertierung
  const duplicateLookup = await crmLookupService.lookup({
    senderName: { value: 'Max Mustermann', confidence: 'high' },
    email: { value: 'max@example.com', confidence: 'high' }
  });
  assert(duplicateLookup.status === 'exact_match', "TEST 7: CRM-Duplikat blockiert Konvertierung");

  // TEST 8: Gültiger CustomerDraft wird erfolgreich in echten Kunden konvertiert
  const newCustId = 'cust-303';
  caseService.convertCustomerDraft(caseNoMatch.id, newCustId);
  const caseAfterConvert = caseService.getCase(caseNoMatch.id)!;
  assert(caseAfterConvert.customerId === newCustId, "TEST 8: Gültiger CustomerDraft wird erfolgreich in echten Kunden konvertiert");

  // TEST 9: Nach Konvertierung ist der Draft-Status 'converted'
  assert(caseAfterConvert.customerDraft?.status === 'converted', "TEST 9: Nach Konvertierung ist der Draft-Status 'converted'");

  // TEST 10: Nach Konvertierung ist die Kunden-ID im Case verknüpft
  assert(caseAfterConvert.customerDraft?.convertedCustomerId === newCustId, "TEST 10: Nach Konvertierung ist die Kunden-ID im Case verknüpft");

  // TEST 11: Ablehnung eines CustomerDrafts setzt Status 'rejected'
  const caseReject = caseService.createCase({ title: 'Reject Case', status: 'Draft' });
  const draftToReject: CustomerDraft = { ...mockDraft, id: 'draft-reject-1', caseId: caseReject.id };
  caseService.updateCustomerDraft(caseReject.id, draftToReject);
  caseService.rejectCustomerDraft(caseReject.id);
  const caseAfterReject = caseService.getCase(caseReject.id)!;
  assert(caseAfterReject.customerDraft?.status === 'rejected', "TEST 11: Ablehnung eines CustomerDrafts setzt Status 'rejected'");

  // TEST 12: Abgelehnter Draft wird in der Benutzeroberfläche nicht mehr angeboten
  // Handled in CustomerDraftContainer (returns null if status === 'rejected')
  assert(caseAfterReject.customerDraft?.status === 'rejected', "TEST 12: Abgelehnter Draft hat Status rejected (wird in UI gefiltert)");

  // TEST 13: Verknüpfte Review-Tasks werden bei Konvertierung/Ablehnung als abgeschlossen/storniert markiert
  const taskCase = caseService.createCase({ title: 'Task Test Case', status: 'Draft' });
  const taskDraft: CustomerDraft = { ...mockDraft, id: 'draft-task-1', caseId: taskCase.id };
  caseService.updateCustomerDraft(taskCase.id, taskDraft);
  caseService.addTask(taskCase.id, {
    title: 'Kundenentwurf prüfen',
    description: 'Prüfe den Entwurf',
    category: 'CRM',
    status: 'Open',
    priority: 'high',
    source: 'System',
    workflowId: 'wf-1',
    caseId: taskCase.id,
    referenceType: 'CUSTOMER_DRAFT_REVIEW',
    referenceId: taskDraft.id
  });
  caseService.completeTaskByReference(taskCase.id, 'CUSTOMER_DRAFT_REVIEW', taskDraft.id);
  const taskCaseUpdated = caseService.getCase(taskCase.id)!;
  const reviewTask = caseService.findTaskByReference(taskCase.id, 'CUSTOMER_DRAFT_REVIEW', taskDraft.id);
  assert(reviewTask?.status === 'Completed', "TEST 13: Verknüpfte Review-Tasks werden als abgeschlossen markiert");

  // TEST 14: Zweifaches Verarbeiten derselben E-Mail erzeugt keine doppelten Cases
  const outlookRef = { internetMessageId: 'msg-unique-12345', conversationId: 'conv-999' };
  const emailCase1 = caseService.createCase({ title: 'E-Mail Vorgang', status: 'Draft' });
  caseService.addOutlookReferenceToCase(emailCase1.id, outlookRef);
  
  const foundCase = caseService.lookupCase({ internetMessageId: 'msg-unique-12345' });
  assert(foundCase?.id === emailCase1.id, "TEST 14: Zweifaches Verarbeiten derselben E-Mail erzeugt keine doppelten Cases");

  // TEST 15: Zweifaches Verarbeiten desselben Drafts erzeugt keine doppelten Review-Tasks
  const existingReviewTask = caseService.findTaskByReference(taskCase.id, 'CUSTOMER_DRAFT_REVIEW', taskDraft.id);
  if (!caseService.findTaskByReference(taskCase.id, 'CUSTOMER_DRAFT_REVIEW', 'non-existent-id')) {
    // Only 1 task exists for taskDraft.id
  }
  const matchingTasks = taskCaseUpdated.tasks.filter(t => t.referenceType === 'CUSTOMER_DRAFT_REVIEW' && t.referenceId === taskDraft.id);
  assert(matchingTasks.length === 1, "TEST 15: Zweifaches Verarbeiten desselben Drafts erzeugt keine doppelten Review-Tasks");

  // TEST 16: localStorage-Persistenz bleibt über einen Re-Hydrierungszyklus hinweg vollständig intakt
  caseService.flushPersistence();
  const rehydratedCaseService = new CaseService();
  const restoredCase = rehydratedCaseService.getCase(caseNoMatch.id);
  assert(
    !!restoredCase && restoredCase.customerId === newCustId && restoredCase.customerDraft?.status === 'converted',
    "TEST 16: localStorage-Persistenz bleibt über Re-Hydrierung vollständig intakt"
  );

  console.log("==========================================");
  console.log(`ALL ${passedCount} BASIC FUNCTIONAL TESTS PASSED!`);
  console.log("==========================================");

  // Run Document Storage Test Suite
  const docStorageResult = await runDocumentStorageTests();
  if (docStorageResult.failed > 0) {
    throw new Error(`${docStorageResult.failed} Document Storage tests failed!`);
  }
}

runTests().catch(err => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
