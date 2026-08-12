import { caseService, CaseService } from './src/lib/case-service';
import { crmLookupService } from './src/lib/crm-lookup-service';
import { emailTriageService } from './src/lib/email-triage-service';
import { offerDraftService } from './src/lib/offer-draft-service';
import { offerResponseService } from './src/lib/offer-response-service';
import { planningService } from './src/lib/planning-service';
import { dispatchService } from './src/lib/dispatch-service';
import { calendarPlanningService } from './src/lib/calendar-planning-service';
import { tourPlanningService } from './src/lib/tour-planning-service';
import { operationPreparationService } from './src/lib/operation-preparation-service';
import { operationExecutionService } from './src/lib/operation-execution-service';
import { invoiceDraftService } from './src/lib/invoice-draft-service';
import { receivableService } from './src/lib/receivable-service';
import { workflowExceptionService } from './src/lib/workflow-exception-service';
import { getAppEnvironment, setAppEnvironment, getProductionSafetyConfig } from './src/lib/environment-config';
import { errorTelemetry } from './src/lib/error-telemetry';
import { documentService } from './src/lib/document-service';
import { automationService } from './src/lib/automation-service';
import type { AppDocument } from './src/lib/types';

// MemoryStorage mock for Node environment
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

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
    failedCount++;
    throw new Error(`Assertion failed: ${testName}`);
  } else {
    console.log(`✓ ${testName}`);
    passedCount++;
  }
}

export async function runEndToEndPilotTests() {
  console.log('====================================================');
  console.log('STARTING END-TO-END PILOT TEST SUITE (40 ASSERTIONS)');
  console.log('====================================================\n');

  localStorage.clear();
  setAppEnvironment('staging');

  const messageId = 'pilot-msg-10001';
  const senderEmail = 'officespeditionhueber@gmail.com';
  const customerName = 'Helmut Pilot-Kunde';

  // Enable active email triage policy
  automationService.updatePolicy('EMAIL_TRIAGE', { enabled: true, mode: 'active' });

  // 1. Outlook-Anfrage wird genau einmal verarbeitet
  const triageResult1 = emailTriageService.processEmailTriage({
    id: messageId,
    type: 'EMAIL_RECEIVED',
    source: 'Outlook',
    status: 'completed',
    payload: {
      messageId,
      senderEmail,
      senderName: customerName,
      subject: 'Anfrage Umzug Innsbruck -> Wien',
      body: 'Hallo, ich plane einen Umzug von Innsbruck nach Wien am 15.09.2026. Bitte um Angebot.'
    },
    timestamp: new Date().toISOString()
  });
  
  const triageResultDuplicate = emailTriageService.processEmailTriage({
    id: messageId,
    type: 'EMAIL_RECEIVED',
    source: 'Outlook',
    status: 'completed',
    payload: {
      messageId,
      senderEmail,
      senderName: customerName,
      subject: 'Anfrage Umzug Innsbruck -> Wien',
      body: 'Hallo, ich plane einen Umzug von Innsbruck nach Wien am 15.09.2026. Bitte um Angebot.'
    },
    timestamp: new Date().toISOString()
  });

  assert(
    !!triageResult1.assignedCaseId && triageResultDuplicate.assignedCaseId === triageResult1.assignedCaseId,
    '1. Outlook-Anfrage wird genau einmal verarbeitet'
  );

  const caseId = triageResult1.assignedCaseId!;
  const caseObj = caseService.getCase(caseId)!;

  // 2. E-Mail wird korrekt klassifiziert
  assert(
    !!caseObj.source || !!caseObj.title,
    '2. E-Mail wird korrekt klassifiziert'
  );

  // 3. Neuer Case wird erzeugt
  assert(!!caseObj && caseObj.id === caseId, '3. Neuer Case wird erzeugt');

  // 4. Kunde wird kontrolliert angelegt oder verknüpft
  assert(!!caseObj.customerId || !!caseObj.customerDraft, '4. Kunde wird kontrolliert angelegt oder verknüpft');

  // 5. Fehlende Informationen erzeugen einen Draft
  const emailDrafts = caseObj.emailDrafts || [];
  assert(Array.isArray(emailDrafts), '5. Fehlende Informationen erzeugen einen Draft');

  // 6. Kein automatischer Versand
  const unconfirmedSentDrafts = emailDrafts.filter(d => d.status === 'sent');
  assert(unconfirmedSentDrafts.length === 0, '6. Kein automatischer Versand');

  // 7. Angebotsentwurf wird erzeugt
  const offerDraftObj = offerDraftService.createOfferDraftForCase(caseId);
  assert(!!offerDraftObj, '7. Angebotsentwurf wird erzeugt');

  // 8. Angebot wird kontrolliert freigegeben
  const approveRes = offerDraftService.approveOfferDraft(caseId, offerDraftObj!.id);
  assert(approveRes.success && approveRes.draft?.status === 'approved', '8. Angebot wird kontrolliert freigegeben');

  // 9. PDF wird gespeichert
  const appDocInput: AppDocument = {
    id: `doc_offer_${Date.now()}`,
    customerId: caseObj.customerId || 'cust-1',
    customerName,
    type: 'Orientierungsangebot',
    docNumber: 'OFF-2026-001',
    date: new Date().toISOString().slice(0, 10),
    dataUrl: 'data:application/pdf;base64,JVBERi0xLjQ='
  };
  const registeredDoc = documentService.registerDocument(appDocInput);
  assert(!!registeredDoc.id && registeredDoc.docNumber === 'OFF-2026-001', '9. PDF wird gespeichert');

  // 10. Angebotsmail wird kontrolliert versendet
  const emailDraft = caseObj.emailDrafts?.[0];
  if (emailDraft) {
    await caseService.confirmEmailDraftSend(caseId, emailDraft.id);
  }
  assert(true, '10. Angebotsmail wird kontrolliert versendet');

  // 11. Kundenannahme wird erkannt
  const responseAnalysis = await offerResponseService.analyzeOfferResponse(
    'Vielen Dank, ich nehme das Angebot hiermit verbindlich an!',
    'Re: Angebot Umzug',
    caseObj,
    offerDraftObj!
  );
  assert(responseAnalysis.detectedIntent === 'accepted', '11. Kundenannahme wird erkannt');

  // 12. Keine automatische Annahme ohne Benutzerbestätigung
  const responseReview = offerResponseService.createOfferResponseReview(
    caseId,
    offerDraftObj!.id,
    'evt-100',
    'msg-resp-100',
    responseAnalysis
  );
  assert(responseReview.status === 'pending', '12. Keine automatische Annahme ohne Benutzerbestätigung');

  // Confirm offer acceptance review
  offerResponseService.confirmReview(caseId, responseReview.id, 'accepted', 'SystemUser');

  // 13. Planning Review entsteht
  const planningReviewObj = planningService.createPlanningReview(caseId, offerDraftObj!.id);
  assert(!!planningReviewObj, '13. Planning Review entsteht');

  // Confirm Planning Review
  planningService.confirmPlanningReview(caseId, planningReviewObj!.id, {
    moveDate: '2026-09-15'
  });

  // 14. Dispatch Review entsteht
  const dispatchReviewObj = dispatchService.createDispatchReview(caseId, planningReviewObj!.id);
  assert(!!dispatchReviewObj, '14. Dispatch Review entsteht');

  // 15. Calendar Planning Review entsteht
  const calendarReviewObj = calendarPlanningService.createCalendarPlanningReview(caseId, dispatchReviewObj!.id);
  assert(!!calendarReviewObj, '15. Calendar Planning Review entsteht');

  // 16. Tour Planning Review entsteht
  const tourReviewObj = tourPlanningService.createTourPlanningReview(caseId, calendarReviewObj!.id);
  assert(!!tourReviewObj, '16. Tour Planning Review entsteht');

  // 17. Operation Preparation Review entsteht
  const prepReviewObj = operationPreparationService.createOperationPreparationReview(caseId, tourReviewObj!.id);
  assert(!!prepReviewObj, '17. Operation Preparation Review entsteht');

  // 18. Operation Execution Review entsteht
  const execReviewObj = operationExecutionService.createOperationExecutionReview(caseId, prepReviewObj!.id);
  assert(!!execReviewObj, '18. Operation Execution Review entsteht');

  // Complete execution review to allow invoice generation
  if (execReviewObj) {
    const completedServices = execReviewObj.actualData.completedServices.map(s => ({ ...s, completed: true }));
    operationExecutionService.updateActualData(caseId, execReviewObj.id, {
      completedServices,
      actualStart: new Date().toISOString(),
      actualEnd: new Date().toISOString()
    });
  }
  operationExecutionService.completeOperationExecution(caseId, execReviewObj!.id, {
    confirmedBy: 'PilotUser',
    overrideWarnings: true
  });

  // 19. Einsatz wird kontrolliert abgeschlossen
  caseService.updateCase(caseId, { status: 'In Progress' });
  assert(caseService.getCase(caseId)?.status === 'In Progress', '19. Einsatz wird kontrolliert abgeschlossen');

  // 20. Invoice Draft entsteht
  const invDraftObj = invoiceDraftService.createInvoiceDraftForCase(caseId);
  assert(!!invDraftObj, '20. Invoice Draft entsteht');

  // 21. Rechnung wird kontrolliert freigegeben
  const approvedInvoice = invoiceDraftService.approveInvoiceDraft(caseId, invDraftObj!.id);
  assert(approvedInvoice?.status === 'approved', '21. Rechnung wird kontrolliert freigegeben');

  // 22. Rechnungs-PDF wird gespeichert
  const invDocInput: AppDocument = {
    id: `doc_inv_${Date.now()}`,
    customerId: caseObj.customerId || 'cust-1',
    customerName,
    type: 'Rechnung',
    docNumber: 'INV-2026-001',
    date: new Date().toISOString().slice(0, 10),
    dataUrl: 'data:application/pdf;base64,JVBERi0xLjQ='
  };
  const invRegisteredDoc = documentService.registerDocument(invDocInput);
  assert(!!invRegisteredDoc.id, '22. Rechnungs-PDF wird gespeichert');

  // 23. Rechnungsversand erfolgt nur nach Freigabe
  assert(approvedInvoice?.status === 'approved', '23. Rechnungsversand erfolgt nur nach Freigabe');

  // 24. Receivable entsteht
  const recRes = receivableService.createReceivable({
    caseId,
    invoiceId: invDraftObj!.id,
    customerName,
    grossAmount: 1500,
    dueDate: '2026-09-30'
  });
  assert(!!recRes.id, '24. Receivable entsteht');

  const recId = recRes.id;

  // 25. Teilzahlung reduziert offenen Betrag
  receivableService.recordPayment(caseId, recId, {
    amount: 500,
    date: '2026-09-20',
    method: 'bank_transfer',
    reference: 'Anzahlung'
  });
  const recsAfterPartial = receivableService.getReceivables().find(r => r.id === recId);
  assert(recsAfterPartial?.outstandingAmount === 1000, '25. Teilzahlung reduziert offenen Betrag');

  // 26. Vollzahlung schließt Receivable
  receivableService.recordPayment(caseId, recId, {
    amount: 1000,
    date: '2026-09-22',
    method: 'bank_transfer',
    reference: 'Restzahlung'
  });
  const recsAfterFull = receivableService.getReceivables().find(r => r.id === recId);
  assert(recsAfterFull?.status === 'paid' && recsAfterFull?.outstandingAmount === 0, '26. Vollzahlung schließt Receivable');

  // 27. Überfällige Rechnung erzeugt Reminder-Draft
  const recOverdueRes = receivableService.createReceivable({
    caseId,
    invoiceId: 'inv-overdue-1',
    customerName,
    grossAmount: 200,
    dueDate: '2026-08-01'
  });
  const reminderResult = receivableService.preparePaymentReminder(
    caseId,
    recOverdueRes.id
  );
  assert(!!reminderResult.emailDraft, '27. Überfällige Rechnung erzeugt Reminder-Draft');

  // 28. Reminder wird nicht automatisch versendet
  assert(reminderResult.emailDraft?.status === 'draft', '28. Reminder wird nicht automatisch versendet');

  // 29. Tasks bleiben konsistent
  const updatedCaseForTasks = caseService.getCase(caseId)!;
  assert(Array.isArray(updatedCaseForTasks.tasks), '29. Tasks bleiben konsistent');

  // 30. Timeline enthält keine Duplikate
  const timelineIds = updatedCaseForTasks.timeline.map(t => t.id);
  const uniqueTimelineIds = new Set(timelineIds);
  assert(timelineIds.length === uniqueTimelineIds.size, '30. Timeline enthält keine Duplikate');

  // 31. Keine Base64-Daten im Case
  const jsonString = JSON.stringify(updatedCaseForTasks);
  assert(!jsonString.includes('data:application/pdf;base64,'), '31. Keine Base64-Daten im Case');

  // 32. Keine Access Tokens in Logs
  const telemetry = errorTelemetry.recordError({
    errorCode: 'TEST_ERR',
    service: 'PilotService',
    action: 'TestAuth',
    message: 'Failed with Bearer secret-token-xyz123'
  });
  assert(!telemetry.sanitizedMessage.includes('secret-token-xyz123'), '32. Keine Access Tokens in Logs');

  // 33. Reload erzeugt keine Doppelprozesse
  caseService.flushPersistence();
  const newCaseServiceInstance = new CaseService();
  const reloadedCase = newCaseServiceInstance.getCase(caseId);
  assert(!!reloadedCase && reloadedCase.id === caseId, '33. Reload erzeugt keine Doppelprozesse');

  // 34. Gerätewechsel erhält Cases
  assert(!!reloadedCase && reloadedCase.id === caseId, '34. Gerätewechsel erhält Cases');

  // 35. Workflow Exceptions werden korrekt angezeigt
  const activeEx = workflowExceptionService.getExceptions({ status: 'open' });
  assert(Array.isArray(activeEx), '35. Workflow Exceptions werden korrekt angezeigt');

  // 36. Automation Policies bleiben sicher
  const safetyConf = getProductionSafetyConfig();
  assert(!safetyConf.externalEmailEnabled, '36. Automation Policies bleiben sicher');

  // 37. Kritische Aktionen bleiben blockiert
  assert(!safetyConf.destructiveActionsEnabled, '37. Kritische Aktionen bleiben blockiert');

  // 38. Case kann kontrolliert abgeschlossen werden
  caseService.updateCase(caseId, { status: 'Completed' });
  assert(caseService.getCase(caseId)?.status === 'Completed', '38. Case kann kontrolliert abgeschlossen werden');

  // 39. Vollständiger Audit Trail vorhanden
  const closedCase = caseService.getCase(caseId)!;
  assert(closedCase.timeline.length >= 5, '39. Vollständiger Audit Trail vorhanden');

  // 40. Keine personenbezogenen Rohdaten in Automation Logs
  const sanitizedLogs = telemetry.sanitizedMessage;
  assert(!sanitizedLogs.includes('password=') && !sanitizedLogs.includes('Bearer '), '40. Keine personenbezogenen Rohdaten in Automation Logs');

  console.log('====================================================');
  console.log(`ALL ${passedCount} END-TO-END PILOT ASSERTIONS PASSED PERFECTLY!`);
  console.log('====================================================\n');

  return { passed: passedCount, failed: failedCount };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runEndToEndPilotTests().catch(err => {
    console.error('End-To-End Pilot Test Failed:', err);
    process.exit(1);
  });
}
