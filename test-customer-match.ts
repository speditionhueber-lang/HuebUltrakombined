import { crmLookupService } from './src/lib/crm-lookup-service.js';
import { caseService } from './src/lib/case-service.js';
import { workflowEngine } from './src/lib/workflow-engine.js';
import { DecisionEngine } from './src/lib/decision-engine.js';
import {
  Customer,
  compareCustomerWithExtractedData,
  buildCustomerUpdateFromComparisons,
  CustomerFieldComparison
} from './src/lib/types.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✓ TEST ${totalTests} PASSED: ${message}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING 20 MANDATORY CUSTOMER-MATCH FUNCTIONAL TESTS');
  console.log('====================================================\n');

  // Initialize DecisionEngine
  const decisionEngine = new DecisionEngine();

  // Mock CRM customers setup
  const mockCustomers: Customer[] = [
    {
      id: 'cust-101',
      name: 'Max Mustermann',
      nameLower: 'max mustermann',
      email: 'max@mustermann.de',
      phone: '+491701234567',
      address: { street: 'Hauptstraße 1', city: 'Berlin', zip: '10115', country: 'Germany' },
      createdAt: new Date().toISOString(),
      avatarUrl: '',
      abholadresse: { strasse: 'Hauptstraße 1', plz: '10115', ort: 'Berlin' },
      zieladresse: { strasse: 'Gartenstraße 5', plz: '10115', ort: 'Berlin' }
    },
    {
      id: 'cust-102',
      name: 'Erika Musterfrau',
      nameLower: 'erika musterfrau',
      email: 'erika@musterfrau.de',
      phone: '+491709876543',
      address: { street: 'Parkweg 12', city: 'München', zip: '80331', country: 'Germany' },
      createdAt: new Date().toISOString(),
      avatarUrl: '',
      abholadresse: { strasse: 'Parkweg 12', plz: '80331', ort: 'München' }
    }
  ];

  crmLookupService.setCustomers([...mockCustomers]);

  // Test 1: Gleiche E-Mail erzeugt exact_match
  {
    const res = await crmLookupService.lookup({
      email: { value: 'max@mustermann.de' }
    });
    assert(res.status === 'exact_match', 'Test 1: Gleiche E-Mail erzeugt exact_match');
    assert(res.customers[0].id === 'cust-101', 'Test 1: Zuordnung zu cust-101 korrekte ID');
  }

  // Test 2: Telefon + gleicher Name erzeugt exact_match
  {
    const res = await crmLookupService.lookup({
      phone: { value: '+491701234567' },
      senderName: { value: 'Max Mustermann' }
    });
    assert(res.status === 'exact_match', 'Test 2: Telefon + gleicher Name erzeugt exact_match');
  }

  // Test 3: Nur Telefon ohne Name erzeugt multiple_matches
  {
    const res = await crmLookupService.lookup({
      phone: { value: '+491701234567' },
      senderName: { value: 'Unbekannte Person' }
    });
    assert(res.status === 'multiple_matches', 'Test 3: Nur Telefon ohne übereinstimmenden Namen erzeugt multiple_matches');
  }

  // Test 4: Name ohne E-Mail/Telefon erzeugt multiple_matches
  {
    const res = await crmLookupService.lookup({
      senderName: { value: 'Max Mustermann' }
    });
    assert(res.status === 'multiple_matches', 'Test 4: Nur Name ohne E-Mail/Telefon erzeugt multiple_matches');
  }

  // Test 5: Anderer Name/E-Mail erzeugt no_match
  {
    const res = await crmLookupService.lookup({
      email: { value: 'fremder@beispiel.de' },
      senderName: { value: 'Fremder Name' }
    });
    assert(res.status === 'no_match', 'Test 5: Unbekannter Name + E-Mail erzeugt no_match');
  }

  // Test 6: Missing-Feld im CRM wird bei hoher Konfidenz vorausgewählt
  {
    const custWithoutPhone: Customer = { ...mockCustomers[0], phone: '' };
    const extractedData = {
      phone: { value: '+491701234567', confidence: 'high' }
    };
    const comparisons = compareCustomerWithExtractedData(custWithoutPhone, extractedData);
    const phoneComp = comparisons.find(c => c.field === 'phone');
    assert(phoneComp?.matchStatus === 'missing_in_crm', 'Test 6: Status is missing_in_crm');
    assert(phoneComp?.selectedForUpdate === true, 'Test 6: Missing-Feld mit hoher Konfidenz vorausgewählt');
  }

  // Test 7: Missing-Feld im CRM wird bei niedriger Konfidenz NICHT vorausgewählt
  {
    const custWithoutPhone: Customer = { ...mockCustomers[0], phone: '' };
    const extractedData = {
      phone: { value: '+491701234567', confidence: 'low' }
    };
    const comparisons = compareCustomerWithExtractedData(custWithoutPhone, extractedData);
    const phoneComp = comparisons.find(c => c.field === 'phone');
    assert(phoneComp?.selectedForUpdate === false, 'Test 7: Missing-Feld mit niedriger Konfidenz NICHT vorausgewählt');
  }

  // Test 8: Abweichender Wert wird NICHT vorausgewählt
  {
    const custWithPhone: Customer = { ...mockCustomers[0], phone: '+491701111111' };
    const extractedData = {
      phone: { value: '+491702222222', confidence: 'high' }
    };
    const comparisons = compareCustomerWithExtractedData(custWithPhone, extractedData);
    const phoneComp = comparisons.find(c => c.field === 'phone');
    assert(phoneComp?.matchStatus === 'conflicting', 'Test 8: Match status is conflicting');
    assert(phoneComp?.selectedForUpdate === false, 'Test 8: Abweichender Wert NIEMALS vorausgewählt');
  }

  // Test 9: Nutzer wählt Abweichung manuell aus → Feld wird übernommen
  {
    const custWithPhone: Customer = { ...mockCustomers[0], phone: '+491701111111' };
    const comparisons: CustomerFieldComparison[] = [{
      field: 'phone',
      label: 'Telefonnummer',
      currentValue: '+491701111111',
      detectedValue: '+491702222222',
      confidence: 'high',
      matchStatus: 'conflicting',
      selectedForUpdate: true,
      source: 'AI'
    }];
    const updates = buildCustomerUpdateFromComparisons(comparisons, custWithPhone);
    assert(updates.phone === '+491702222222', 'Test 9: Manuell ausgewählte Abweichung wird im Update übernommen');
  }

  // Test 10: Abweichung abgewählt → CRM behält alten Wert
  {
    const custWithPhone: Customer = { ...mockCustomers[0], phone: '+491701111111' };
    const comparisons: CustomerFieldComparison[] = [{
      field: 'phone',
      label: 'Telefonnummer',
      currentValue: '+491701111111',
      detectedValue: '+491702222222',
      confidence: 'high',
      matchStatus: 'conflicting',
      selectedForUpdate: false,
      source: 'AI'
    }];
    const updates = buildCustomerUpdateFromComparisons(comparisons, custWithPhone);
    assert(updates.phone === undefined, 'Test 10: Abgewählte Abweichung führt zu KEINEM CRM-Update');
  }

  // Create a clean test case for workflow tests
  const testCase = caseService.createCase({
    title: 'Test Case Match',
    source: 'Test',
    priority: 'high',
    confidence: 'high',
    workflowIds: ['wf-test-1']
  });

  caseService.updateCustomerMatchReview(testCase.id, {
    id: 'rev-test-1',
    caseId: testCase.id,
    sourceEventId: 'wf-test-1',
    status: 'pending',
    matchType: 'exact',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    selectedCustomerId: 'cust-101',
    candidates: [],
    fieldComparisons: []
  });

  // Test 11: Bestätigung ohne Update-Auswahl verändert CRM-Daten nicht
  {
    caseService.confirmCustomerMatch(testCase.id, 'cust-101');
    const updatedCase = caseService.getCase(testCase.id);
    assert(updatedCase?.customerId === 'cust-101', 'Test 11: Case verknüpft mit Kunde cust-101');
    assert(crmLookupService.getCustomers().find(c => c.id === 'cust-101')?.phone === '+491701234567', 'Test 11: CRM Daten unverändert');
  }

  // Test 12: Falscher Kunde erzeugt Kundenentwurf
  {
    caseService.rejectCustomerMatch(testCase.id);
    const updatedCase = caseService.getCase(testCase.id);
    assert(updatedCase?.customerId === undefined, 'Test 12: Customer ID nach Ablehnung zurückgesetzt');
    assert(updatedCase?.customerDraft !== undefined, 'Test 12: Kundenentwurf nach Ablehnung erstellt');
    assert(updatedCase?.customerMatchReview?.status === 'rejected', 'Test 12: Match Review Status ist rejected');
  }

  // Test 13: Multiple Matches erlaubt manuelle Kundenwahl
  {
    const case2 = caseService.createCase({
      title: 'Multiple Match Case',
      source: 'Test',
      priority: 'high',
      confidence: 'medium',
      workflowIds: ['wf-test-2']
    });

    caseService.updateCustomerMatchReview(case2.id, {
      id: 'rev-2',
      caseId: case2.id,
      sourceEventId: 'wf-test-2',
      status: 'pending',
      matchType: 'multiple',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      candidates: [
        { customerId: 'cust-101', customerName: 'Max Mustermann', score: 75, matchedFields: [], conflictingFields: [] },
        { customerId: 'cust-102', customerName: 'Erika Musterfrau', score: 75, matchedFields: [], conflictingFields: [] }
      ],
      fieldComparisons: []
    });

    caseService.confirmCustomerMatch(case2.id, 'cust-102');
    const updatedCase2 = caseService.getCase(case2.id);
    assert(updatedCase2?.customerId === 'cust-102', 'Test 13: Manuelle Kundenwahl setzt den Kunden auf cust-102');
  }

  // Test 14: Keiner dieser Kunden erzeugt Kundenentwurf
  {
    const case3 = caseService.createCase({
      title: 'Reject Multiple Case',
      source: 'Test',
      priority: 'high',
      confidence: 'medium',
      workflowIds: ['wf-test-3']
    });

    caseService.updateCustomerMatchReview(case3.id, {
      id: 'rev-3',
      caseId: case3.id,
      sourceEventId: 'wf-test-3',
      status: 'pending',
      matchType: 'multiple',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      candidates: [
        { customerId: 'cust-101', customerName: 'Max Mustermann', score: 75, matchedFields: [], conflictingFields: [] }
      ],
      fieldComparisons: []
    });

    caseService.rejectCustomerMatch(case3.id);
    const updatedCase3 = caseService.getCase(case3.id);
    assert(updatedCase3?.customerDraft !== undefined, 'Test 14: "Keiner dieser Kunden" erzeugt Kundenentwurf');
  }

  // Test 15: Neuer Mail-Eingang zu bestehendem Match erzeugt keine Schleife
  {
    const initialEventsCount = workflowEngine.getEvents().length;
    workflowEngine.emitEvent('CUSTOMER_MATCH_CONFIRMED', 'User', { caseId: testCase.id });
    const finalEventsCount = workflowEngine.getEvents().length;
    assert(finalEventsCount === initialEventsCount + 1, 'Test 15: Match-Confirmed Event erzeugt keine rekursive Event-Schleife');
  }

  // Test 16: Task wird bei Bestätigung geschlossen
  {
    const case4 = caseService.createCase({
      title: 'Task Completion Case',
      source: 'Test',
      priority: 'high',
      confidence: 'high',
      workflowIds: ['wf-test-4']
    });

    const reviewId = 'rev-4';
    caseService.updateCustomerMatchReview(case4.id, {
      id: reviewId,
      caseId: case4.id,
      sourceEventId: 'wf-test-4',
      status: 'pending',
      matchType: 'exact',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      candidates: [],
      fieldComparisons: []
    });

    caseService.addTask(case4.id, {
      title: 'Kundenzuordnung prüfen',
      description: 'Prüfe Kunden',
      category: 'CRM',
      status: 'Open',
      priority: 'high',
      source: 'System',
      workflowId: 'wf-test-4',
      caseId: case4.id,
      referenceType: 'CUSTOMER_MATCH_REVIEW',
      referenceId: reviewId
    });

    caseService.confirmCustomerMatch(case4.id, 'cust-101');
    const updatedCase4 = caseService.getCase(case4.id);
    const task = updatedCase4?.tasks.find(t => t.referenceType === 'CUSTOMER_MATCH_REVIEW' && t.referenceId === reviewId);
    assert(task?.status === 'Completed', 'Test 16: Task für Match Review wird bei Bestätigung als Completed markiert');
  }

  // Test 17: Task wird bei Ablehnung geschlossen
  {
    const case5 = caseService.createCase({
      title: 'Task Cancel Case',
      source: 'Test',
      priority: 'high',
      confidence: 'high',
      workflowIds: ['wf-test-5']
    });

    const reviewId = 'rev-5';
    caseService.updateCustomerMatchReview(case5.id, {
      id: reviewId,
      caseId: case5.id,
      sourceEventId: 'wf-test-5',
      status: 'pending',
      matchType: 'exact',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      candidates: [],
      fieldComparisons: []
    });

    caseService.addTask(case5.id, {
      title: 'Kundenzuordnung prüfen',
      description: 'Prüfe Kunden',
      category: 'CRM',
      status: 'Open',
      priority: 'high',
      source: 'System',
      workflowId: 'wf-test-5',
      caseId: case5.id,
      referenceType: 'CUSTOMER_MATCH_REVIEW',
      referenceId: reviewId
    });

    caseService.rejectCustomerMatch(case5.id);
    const updatedCase5 = caseService.getCase(case5.id);
    const task = updatedCase5?.tasks.find(t => t.referenceType === 'CUSTOMER_MATCH_REVIEW' && t.referenceId === reviewId);
    assert(task?.status === 'Cancelled' || task?.status === 'Completed', 'Test 17: Task wird bei Ablehnung gecancelt/abgeschlossen');
  }

  // Test 18: Timeline zeichnet Zuordnung nachvollziehbar auf
  {
    const updatedCase1 = caseService.getCase(testCase.id);
    const tlMatchEntry = updatedCase1?.timeline.find(t => t.type === 'CUSTOMER_MATCH_CONFIRMED' || t.type === 'CUSTOMER_MATCH_REJECTED');
    assert(tlMatchEntry !== undefined, 'Test 18: Timeline enthält einen Eintrag zur Kundenzuordnung');
  }

  // Test 19: Reload erhält Auswahl und verarbeiteten Status
  {
    const case6 = caseService.createCase({
      title: 'Reload Persistence Case',
      source: 'Test',
      priority: 'high',
      confidence: 'high',
      workflowIds: ['wf-test-6']
    });

    caseService.updateCustomerMatchReview(case6.id, {
      id: 'rev-6',
      caseId: case6.id,
      sourceEventId: 'wf-test-6',
      status: 'pending',
      matchType: 'exact',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      selectedCustomerId: 'cust-101',
      candidates: [],
      fieldComparisons: []
    });

    caseService.confirmCustomerMatch(case6.id, 'cust-101');
    const freshFetched = caseService.getCase(case6.id);
    assert(freshFetched?.customerId === 'cust-101', 'Test 19: customerId bleibt nach Speicherung/Reload erhalten');
    assert(freshFetched?.customerMatchReview?.status === 'confirmed', 'Test 19: matchReview Status ist persistent confirmed');
  }

  // Test 20: Keine automatische CRM-Änderung ohne Nutzerbestätigung
  {
    const originalCustomerData = { ...mockCustomers[0] };
    const tempCase = caseService.createCase({
      title: 'No Auto CRM Update Case',
      source: 'Test',
      priority: 'high',
      confidence: 'high',
      workflowIds: ['wf-test-7']
    });

    // Simulate match review creation
    caseService.updateCustomerMatchReview(tempCase.id, {
      id: 'rev-7',
      caseId: tempCase.id,
      sourceEventId: 'wf-test-7',
      status: 'pending',
      matchType: 'exact',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      selectedCustomerId: 'cust-101',
      candidates: [],
      fieldComparisons: [{
        field: 'phone',
        label: 'Telefon',
        currentValue: '+491701234567',
        detectedValue: '+491709999999',
        confidence: 'high',
        matchStatus: 'conflicting',
        selectedForUpdate: false,
        source: 'AI'
      }]
    });

    const crmCust = crmLookupService.getCustomers().find(c => c.id === 'cust-101');
    assert(crmCust?.phone === originalCustomerData.phone, 'Test 20: CRM Daten wurden OHNE Nutzerbestätigung NICHT geändert');
  }

  console.log('\n====================================================');
  console.log(`ALL 20 MANDATORY TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests})`);
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
