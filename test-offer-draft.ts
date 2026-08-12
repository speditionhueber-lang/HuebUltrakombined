import { evaluateOfferReadiness } from './src/lib/offer-readiness';
import { validateOfferDraft, canTransitionOfferDraftStatus } from './src/lib/offer-draft-validator';
import { buildCalculationCostItems, calculateOfferTotals } from './src/lib/offer-calculation';
import { offerDraftService } from './src/lib/offer-draft-service';
import { caseService } from './src/lib/case-service';
import { crmLookupService } from './src/lib/crm-lookup-service';
import type { Customer, OfferDraft } from './src/lib/types';

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

async function runOfferDraftTests() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED TESTS: KONTROLLIERTER ANGEBOTSENTWURF (OFFER DRAFT REGRESSION SUITE)');
  console.log('====================================================\n');

  const mockCustomer: Customer = {
    id: 'cust-offer-1',
    name: 'Dr. Martin Weber',
    email: 'martin.weber@example.com',
    phone: '+43 664 1234567',
    address: { street: 'Hauptstraße 10', zip: '1010', city: 'Wien', country: 'Österreich' },
    nameLower: 'dr. martin weber',
    createdAt: new Date().toISOString(),
    avatarUrl: '',
    abholadresse: { strasse: 'Hauptstraße 10, 1010 Wien', stockwerk: '2', aufzug: 'Ja' },
    zieladresse: { strasse: 'Linzer Straße 45, 4020 Linz', stockwerk: '1', aufzug: 'Nein' },
    umzugsdetails: {
      gewuenschterUmzugstermin: '15.09.2026',
      umzugsgroesse: '80 m²'
    },
    gegenstaende: { sitzlandschaft: '1', eckbankEZ: '1' },
    geminiVolumeEstimate: {
      totalM3: 22.5,
      totalKg: 1800,
      explanation: 'Schätzung basierend auf 80m² WFL',
      confidence: 'high',
      recommendedVehicle: 'LKW 7.5t'
    }
  };

  // Register mock customer in CRM lookup
  crmLookupService.setCustomers([mockCustomer]);

  // Test Case Setup linked to mock customer
  const testCase = caseService.createCase({
    title: 'Angebots-Testvorgang',
    source: 'Test',
    priority: 'high',
    customerId: mockCustomer.id
  });

  // Test 1: evaluateOfferReadiness - Full customer data -> Ready for binding offer
  const readinessFull = evaluateOfferReadiness(testCase, mockCustomer);
  assert(
    readinessFull.readyForOrientationOffer && readinessFull.readyForBindingOffer && readinessFull.missingFields.length === 0,
    'Test 1: Full customer data evaluates as ready for binding offer'
  );

  // Test 2: evaluateOfferReadiness - Missing addresses -> Only orientation offer ready, lists missing fields
  const mockIncomplete: Customer = {
    ...mockCustomer,
    address: { street: '', zip: '', city: '', country: '' },
    abholadresse: undefined,
    zieladresse: undefined
  };
  const readinessIncomplete = evaluateOfferReadiness(testCase, mockIncomplete);
  assert(
    readinessIncomplete.readyForOrientationOffer &&
    !readinessIncomplete.readyForBindingOffer &&
    readinessIncomplete.missingFields.includes('Abholadresse') &&
    readinessIncomplete.missingFields.includes('Zieladresse'),
    'Test 2: Missing addresses flags incomplete readiness with clear missing fields'
  );

  // Test 3: Calculation Engine - buildCalculationCostItems
  const { items: costItems, totalM3 } = buildCalculationCostItems(mockCustomer);
  assert(
    costItems.length > 0 && totalM3 === 22.5,
    'Test 3: buildCalculationCostItems produces pricing items and correct total M3'
  );

  // Test 4: Calculation Engine - calculateOfferTotals with discount and VAT
  const rawDraft: OfferDraft = {
    id: 'draft-calc-test',
    caseId: testCase.id,
    customerId: mockCustomer.id,
    status: 'draft',
    offerType: 'binding',
    currency: 'EUR',
    items: [
      { id: '1', description: 'Transportpauschale', quantity: 1, unit: 'Psch', unitPrice: 500, total: 500, selected: true },
      { id: '2', description: 'Personal', quantity: 2, unit: 'Std', unitPrice: 200, total: 400, selected: true }
    ],
    subtotalNet: 0,
    discountType: 'percent',
    discountValue: 10, // 10% rabatt = 90 EUR
    surchargeType: 'fixed',
    surchargeValue: 0,
    netTotal: 0,
    vatRate: 20, // 20% MwSt
    vatAmount: 0,
    grossTotal: 0,
    depositPercent: 30, // 30% Anzahlung
    depositAmount: 0,
    remainingAmount: 0,
    validityDays: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    corrections: []
  };

  const calculatedDraft = calculateOfferTotals(rawDraft);
  assert(
    calculatedDraft.subtotalNet === 900 &&
    calculatedDraft.netTotal === 810 &&
    calculatedDraft.vatAmount === 162 &&
    calculatedDraft.grossTotal === 972 &&
    calculatedDraft.depositAmount === 291.6 &&
    calculatedDraft.remainingAmount === 680.4,
    'Test 4: calculateOfferTotals correctly applies 10% discount, 20% VAT, and 30% deposit'
  );

  // Test 5: Validation - Empty selected items -> Invalid
  const emptyItemsDraft = { ...calculatedDraft, items: [] };
  const valEmpty = validateOfferDraft(emptyItemsDraft);
  assert(!valEmpty.valid && valEmpty.errors.some(e => e.includes('mindestens eine')), 'Test 5: Validation fails when no items selected');

  // Test 6: Validation - Negative price -> Invalid
  const negPriceDraft = {
    ...calculatedDraft,
    items: [{ id: '1', description: 'Negativ', quantity: 1, unit: 'Psch', unitPrice: -100, total: -100, selected: true }]
  };
  const valNeg = validateOfferDraft(negPriceDraft);
  assert(!valNeg.valid && valNeg.errors.some(e => e.includes('negativ')), 'Test 6: Validation fails on negative price');

  // Test 7: Validation - Placeholder in description -> Invalid
  const placeholderDraft = {
    ...calculatedDraft,
    items: [{ id: '1', description: 'Transport {{KUNDENAME}}', quantity: 1, unit: 'Psch', unitPrice: 100, total: 100, selected: true }]
  };
  const valPlaceholder = validateOfferDraft(placeholderDraft);
  assert(!valPlaceholder.valid && valPlaceholder.errors.some(e => e.includes('Platzhalter')), 'Test 7: Validation fails on unresolved template placeholders');

  // Test 8: Status Transitions - Allowed vs Forbidden
  assert(canTransitionOfferDraftStatus('draft', 'edited'), 'Test 8a: Transition draft -> edited allowed');
  assert(canTransitionOfferDraftStatus('edited', 'approved'), 'Test 8b: Transition edited -> approved allowed');
  assert(canTransitionOfferDraftStatus('approved', 'pdf_created'), 'Test 8c: Transition approved -> pdf_created allowed');
  assert(!canTransitionOfferDraftStatus('sent', 'draft'), 'Test 8d: Transition sent -> draft forbidden');

  // Test 9: OfferDraftService - createOfferDraftForCase
  const createdDraft = offerDraftService.createOfferDraftForCase(testCase.id, { offerType: 'binding' });
  assert(createdDraft !== null && createdDraft.status === 'draft', 'Test 9: offerDraftService creates initial draft for case');

  // Test 10: Idempotency - createOfferDraftForCase second call returns same draft
  const duplicateCallDraft = offerDraftService.createOfferDraftForCase(testCase.id, { offerType: 'binding' });
  assert(duplicateCallDraft?.id === createdDraft?.id, 'Test 10: Idempotent draft creation returns existing active draft without duplicating');

  // Test 11: Update Draft - Modify items & check corrections tracking
  if (createdDraft) {
    const updateRes = offerDraftService.updateOfferDraft(testCase.id, createdDraft.id, {
      notes: 'Sondervereinbarung für Samstagsumzug',
      discountValue: 5
    }, 'Prüfer User');

    assert(
      updateRes.success &&
      updateRes.draft?.status === 'edited' &&
      updateRes.draft?.corrections.some(c => c.field === 'notes' && c.user === 'Prüfer User'),
      'Test 11: Updating draft switches status to "edited" and logs correction entry'
    );

    // Test 12: Approve Draft
    const approveRes = offerDraftService.approveOfferDraft(testCase.id, createdDraft.id, 'Chef Prüfer');
    assert(approveRes.success && approveRes.draft?.status === 'approved', 'Test 12: Approve draft changes status to "approved"');

    // Test 13: Generate PDF for approved draft
    const pdfRes1 = await offerDraftService.generateOfferPDFForDraft(testCase.id, createdDraft.id);
    assert(
      pdfRes1.success &&
      pdfRes1.draft?.status === 'pdf_created' &&
      !!pdfRes1.documentId &&
      !!pdfRes1.draft?.documentNumber,
      'Test 13: Generate PDF sets status to "pdf_created" and generates document number'
    );

    const docId1 = pdfRes1.documentId;

    // Test 14: Idempotent PDF Generation - Calling PDF generation again on pdf_created draft
    const pdfRes2 = await offerDraftService.generateOfferPDFForDraft(testCase.id, createdDraft.id);
    assert(
      pdfRes2.success &&
      pdfRes2.documentId === docId1 &&
      pdfRes2.draft?.status === 'pdf_created',
      'Test 14: Second PDF generation call is idempotent and returns existing document ID without re-creating'
    );

    // Test 15: Integration Check - Case state updated after PDF generation
    const updatedCase = caseService.getCase(testCase.id);
    const offerTaskCompleted = updatedCase?.tasks.some(
      t => t.referenceType === 'OFFER_DRAFT' && t.referenceId === createdDraft.id && t.status === 'Completed'
    );
    const hasTimelineEntry = updatedCase?.timeline.some(
      t => t.type === 'OFFER_PDF_CREATED'
    );
    assert(
      !!(updatedCase?.status === 'Offer Created' && offerTaskCompleted && hasTimelineEntry),
      'Test 15: PDF generation completes task, sets Case status to "Offer Created" and logs timeline entry'
    );
  }

  console.log('\n====================================================');
  console.log(`OFFER DRAFT REGRESSION SUITE COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runOfferDraftTests();
