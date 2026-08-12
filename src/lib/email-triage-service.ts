import { WorkflowEvent, workflowEngine } from './workflow-engine';
import {
  EmailTriageCategory,
  EmailTriageAnalysis,
  EmailTriageRecord,
  AutomationMode,
  EmailResponseDraft,
  CustomerDraft
} from './types';
import { caseService, Case } from './case-service';
import { automationService } from './automation-service';
import { emailDraftService } from './email-draft-service';
import { learningService } from './learning-service';
import { crmLookupService } from './crm-lookup-service';

const TRIAGE_RECORDS_KEY = 'vienna_email_triage_records';

export class EmailTriageService {
  private records: EmailTriageRecord[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(TRIAGE_RECORDS_KEY);
        if (saved) {
          this.records = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load email triage records:', e);
      }
    }
  }

  private saveState() {
    if (typeof localStorage !== 'undefined') {
      if (this.records.length > 50) {
        this.records = this.records.slice(-50);
      }
      try {
        localStorage.setItem(TRIAGE_RECORDS_KEY, JSON.stringify(this.records));
      } catch (e: any) {
        if (e?.name === 'QuotaExceededError' || e?.code === 22 || String(e).includes('quota') || String(e?.message).includes('quota')) {
          try {
            this.records = this.records.slice(-15);
            localStorage.setItem(TRIAGE_RECORDS_KEY, JSON.stringify(this.records));
          } catch (retryErr) {
            console.warn('LocalStorage quota limit reached for email triage records, operating in-memory.');
          }
        } else {
          console.warn('Failed to save email triage records:', e?.message || e);
        }
      }
    }
  }

  getRecords(): EmailTriageRecord[] {
    return [...this.records];
  }

  getRecord(id: string): EmailTriageRecord | undefined {
    return this.records.find(r => r.id === id || r.eventId === id);
  }

  getRecordByEventId(eventId: string): EmailTriageRecord | undefined {
    return this.records.find(r => r.eventId === eventId);
  }

  analyzeEmailContent(eventPayload: any): EmailTriageAnalysis {
    const rawSubject = eventPayload?.subject || '';
    const rawBody = eventPayload?.bodyText || eventPayload?.bodyPreview || eventPayload?.body || '';
    const senderEmail = eventPayload?.senderEmail || eventPayload?.email || '';
    const senderName = eventPayload?.senderName || '';
    const conversationId = eventPayload?.conversationId;
    const internetMessageId = eventPayload?.internetMessageId;

    const fullText = `${rawSubject} ${rawBody}`.toLowerCase();

    const potentialRisks: string[] = [];
    const missingInformation: string[] = [];
    const recognizedReferences: EmailTriageAnalysis['recognizedReferences'] = {
      conversationId,
      internetMessageId
    };

    // Recognize numbers/references
    const offerMatch = fullText.match(/ang-[0-9]{4}-[0-9]{3,}|ang-[0-9]+/i);
    if (offerMatch) recognizedReferences.offerNumber = offerMatch[0].toUpperCase();

    const invoiceMatch = fullText.match(/re-[0-9]{4}-[0-9]{3,}|re-[0-9]+/i);
    if (invoiceMatch) recognizedReferences.invoiceNumber = invoiceMatch[0].toUpperCase();

    const caseMatch = fullText.match(/case_[a-zA-Z0-9_]+/i);
    if (caseMatch) recognizedReferences.caseId = caseMatch[0];

    const custMatch = fullText.match(/cust_[a-zA-Z0-9_]+/i);
    if (custMatch) recognizedReferences.customerId = custMatch[0];

    // Detect Potential Risks
    if (fullText.includes('beschwerde') || fullText.includes('reklamation') || fullText.includes('unzufrieden') || fullText.includes('schlecht')) {
      potentialRisks.push('complaint');
    }
    if (fullText.includes('schaden') || fullText.includes('beschädigt') || fullText.includes('zerbrochen') || fullText.includes('kratzer') || fullText.includes('kaputt')) {
      potentialRisks.push('Schaden');
    }
    if (fullText.includes('anwalt') || fullText.includes('klage') || fullText.includes('drohe') || fullText.includes('gerichtlich') || fullText.includes('fristsetzung')) {
      potentialRisks.push('rechtliche Drohung');
    }
    if (fullText.includes('dsgvo') || fullText.includes('datenschutz') || fullText.includes('löschung')) {
      potentialRisks.push('Datenschutzanfrage');
    }
    if (fullText.includes('zahlungsstreit') || fullText.includes('streit um rechnung') || fullText.includes('falsche rechnung')) {
      potentialRisks.push('Zahlungsstreit');
    }
    if (fullText.includes('storno') || fullText.includes('stornieren') || fullText.includes('kündigen') || fullText.includes('kündigung')) {
      potentialRisks.push('Kündigung/Storno');
    }
    if (fullText.includes('scheiße') || fullText.includes('betrug') || fullText.includes('sauerei') || fullText.includes('frechheit')) {
      potentialRisks.push('aggressive Nachricht');
    }

    // Determine Category
    let category: EmailTriageCategory = 'unclear';
    let reasoning = '';
    let confidence: 'low' | 'medium' | 'high' = 'medium';

    // --- MACHINE LEARNING SIMILARITY CHECK ---
    // Look through past corrected records to see if a very similar email was re-categorized manually
    let highestSimilarity = 0;
    let learnedCategory: EmailTriageCategory | null = null;
    let learnedReasoning = '';

    const textTokens = new Set(fullText.split(/\W+/).filter(w => w.length > 3));

    // Only look at records that were corrected/confirmed by a user to learn from their decisions
    const learnedRecords = this.records.filter(r => r.status === 'corrected' || r.status === 'analyzed');
    
    for (const record of learnedRecords) {
      if (record.subject === rawSubject && record.analysis.category) {
        // High likelihood it's the exact same thread/type if subject matches perfectly
        highestSimilarity = 0.9;
        learnedCategory = record.analysis.category;
        learnedReasoning = 'Gleicher Betreff in der Vergangenheit bereits klassifiziert.';
        break; // Fast exit
      }

      // Fallback: Jaccard similarity on tokens
      const recordTokensStr = `${record.subject} ${record.analysis.reasoning || ''}`.toLowerCase();
      const recordTokens = new Set(recordTokensStr.split(/\W+/).filter(w => w.length > 3));
      
      let intersection = 0;
      for (const token of textTokens) {
        if (recordTokens.has(token)) intersection++;
      }
      const union = textTokens.size + recordTokens.size - intersection;
      const similarity = union > 0 ? intersection / union : 0;

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        learnedCategory = record.analysis.category;
        learnedReasoning = `KI-Lernen: Sehr ähnliche E-Mail (${Math.round(similarity * 100)}% Übereinstimmung) wurde zuvor in diese Kategorie sortiert.`;
      }
    }

    // Apply learned category if confidence is very high
    if (highestSimilarity > 0.6 && learnedCategory) {
      category = learnedCategory;
      reasoning = learnedReasoning;
      confidence = 'high';
    } else {
      // Rule-based classification fallback
      if (potentialRisks.includes('complaint') || potentialRisks.includes('Schaden') || potentialRisks.includes('rechtliche Drohung')) {
        category = 'complaint';
        reasoning = `Risikosignale oder Beschwerde-Keywords erkannt (${potentialRisks.join(', ')}).`;
        confidence = 'high';
      } else if (fullText.includes('überwiesen') || fullText.includes('zahlung getätigt') || fullText.includes('überweisung') || fullText.includes('bezahlt') || fullText.includes('zahlungsbestätigung') || fullText.includes('geld gesendet')) {
        category = 'payment_notification';
        reasoning = 'Zahlungsbestätigung oder Überweisungshinweis im Text erkannt.';
        confidence = 'high';
      } else if (fullText.includes('rechnung') || fullText.includes('rechnungsnummer') || fullText.includes('mwst') || fullText.includes('zahlungsziel') || fullText.includes('mahnung') || fullText.includes('rechnungsbetrag') || recognizedReferences.invoiceNumber) {
        category = 'invoice_question';
        reasoning = 'Frage oder Anmerkung zu einer Rechnung erkannt.';
        confidence = recognizedReferences.invoiceNumber ? 'high' : 'medium';
      } else if (fullText.includes('angebot angenommen') || fullText.includes('angebot ablehnen') || fullText.includes('angebot akzeptiert') || fullText.includes('angebot annehmen') || (fullText.includes('angebot') && (fullText.includes('bestätige') || fullText.includes('danke'))) || recognizedReferences.offerNumber) {
        category = 'offer_response';
        reasoning = 'Reaktion auf ein bestehendes Angebot erkannt.';
        confidence = recognizedReferences.offerNumber ? 'high' : 'medium';
      } else if (fullText.includes('ergänzung') || fullText.includes('hier sind die daten') || fullText.includes('nachgereicht') || fullText.includes('adresse lautet') || fullText.includes('termin ist der') || fullText.includes('hier die fotos') || fullText.includes('unterlagen im anhang') || fullText.includes('nachreichung')) {
        category = 'missing_information_response';
        reasoning = 'Kunde liefert nachgereichte Informationen oder Unterlagen.';
        confidence = 'high';
      } else if (fullText.includes('änderung') || fullText.includes('neue adresse') || fullText.includes('neue telefonnummer') || fullText.includes('termin verschieben') || fullText.includes('verschiebung') || fullText.includes('adressänderung') || fullText.includes('datenänderung')) {
        category = 'existing_customer_update';
        reasoning = 'Änderungswunsch zu bestehenden Kundendaten oder Termin erkannt.';
        confidence = 'high';
      } else if (fullText.includes('besichtigung') || fullText.includes('terminvereinbarung') || fullText.includes('wann haben sie zeit') || fullText.includes('vor-ort-termin') || fullText.includes('besichtigungstermin') || fullText.includes('termin ausmachen')) {
        category = 'appointment_request';
        reasoning = 'Anfrage für einen Besichtigungstermin erkannt.';
        confidence = 'high';
      } else if (fullText.includes('umzugsangebot') || fullText.includes('umzugsanfrage') || fullText.includes('anfrage umzug') || fullText.includes('möchte umziehen') || fullText.includes('angebot für umzug') || fullText.includes('preisanfrage') || fullText.includes('kostenvoranschlag') || fullText.includes('neue anfrage') || fullText.includes('anfrage')) {
        category = 'new_customer_inquiry';
        reasoning = 'Neue Anfrage für Umzugsdienstleistungen erkannt.';
        confidence = 'high';
      } else if (fullText.includes('öffnungszeiten') || fullText.includes('parken') || fullText.includes('haltestelle') || fullText.includes('agb') || fullText.includes('versicherungsschutz') || fullText.includes('frage zu') || fullText.includes('auskunft')) {
        category = 'general_question';
        reasoning = 'Allgemeine Frage zu Dienstleistungen oder Abläufen.';
        confidence = 'medium';
      } else if (fullText.includes('viagra') || fullText.includes('casino') || fullText.includes('lottery') || fullText.includes('unsub') || fullText.includes('krypto') || fullText.includes('gewinnspiel')) {
        category = 'spam_or_irrelevant';
        reasoning = 'Spam oder irrelevante Nachricht erkannt.';
        confidence = 'high';
      } else if (rawBody.trim().length > 10) {
        category = 'general_question';
        reasoning = 'Standardkategorisierung als allgemeine E-Mail-Anfrage.';
        confidence = 'low';
      } else {
        category = 'unclear';
        reasoning = 'Unklarer E-Mail-Inhalt mit unzureichenden Textmerkmalen.';
        confidence = 'low';
      }
    }

    // Check missing details for inquiries
    if (!fullText.includes('datum') && !fullText.includes('termin') && !fullText.includes('202')) {
      missingInformation.push('Umzugstermin');
    }
    if (!fullText.includes('von') && !fullText.includes('str.') && !fullText.includes('straße') && !fullText.includes('abhol')) {
      missingInformation.push('Abholadresse');
    }
    if (!fullText.includes('nach') && !fullText.includes('ziel')) {
      missingInformation.push('Zieladresse');
    }
    if (!fullText.includes('m³') && !fullText.includes('zimmer') && !fullText.includes('qm') && !fullText.includes('m2')) {
      missingInformation.push('Wohnungsgröße / Volumen');
    }

    const isHighRisk = potentialRisks.length > 0 || category === 'complaint';

    let recommendedAction = 'E-Mail prüfen und Entwurf vorbereiten';
    if (isHighRisk) {
      recommendedAction = 'E-Mail mit erhöhtem Risiko manuell prüfen (kein automatischer Versand)';
    } else if (category === 'new_customer_inquiry') {
      recommendedAction = 'Anfrage anlegen und Bestätigung/Rückfrage vorbereiten';
    } else if (category === 'appointment_request') {
      recommendedAction = 'Besichtigungstermin vorschlagen';
    } else if (category === 'invoice_question') {
      recommendedAction = 'Rechnung prüfen und Klärungsentwurf vorbereiten';
    }

    return {
      category,
      confidence,
      reasoning,
      recognizedReferences,
      recommendedAction,
      missingInformation,
      potentialRisks,
      isHighRisk
    };
  }

  resolveCaseAssignment(analysis: EmailTriageAnalysis, eventPayload: any): {
    assignedCaseId?: string;
    matchType: 'exact' | 'multiple' | 'none';
    matchingCases: Case[];
  } {
    const allCases = caseService.getCases();
    // Exclude completed, cancelled, or archived cases
    const openCases = allCases.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled' && (c.status as string) !== 'Archived');

    const convId = eventPayload?.conversationId || analysis.recognizedReferences.conversationId;
    const internetMessageId = eventPayload?.internetMessageId || analysis.recognizedReferences.internetMessageId;
    const customerId = eventPayload?.customerId || analysis.recognizedReferences.customerId;
    const offerNum = analysis.recognizedReferences.offerNumber;
    const invoiceNum = analysis.recognizedReferences.invoiceNumber;
    const senderEmail = (eventPayload?.senderEmail || eventPayload?.email || '').toLowerCase().trim();
    const senderName = (eventPayload?.senderName || '').toLowerCase().trim();

    // --- ML SIMILARITY CHECK FOR ASSIGNMENT ---
    // If user previously corrected/assigned an email with this exact sender or very similar subject to a specific case, learn from it
    if (senderEmail) {
      const learnedRecords = this.records.filter(r => r.status === 'corrected' && r.assignedCaseId);
      // Check if there's a recent record from this sender that was assigned
      const recentFromSender = learnedRecords.find(r => r.senderEmail.toLowerCase() === senderEmail && r.assignedCaseId);
      if (recentFromSender) {
        const learnedCase = openCases.find(c => c.id === recentFromSender.assignedCaseId);
        if (learnedCase) {
          // Verify if it's the same subject/thread roughly
          const currentSubject = (eventPayload?.subject || '').toLowerCase().replace(/aw:|re:|fwd:|wg:/g, '').trim();
          const pastSubject = (recentFromSender.subject || '').toLowerCase().replace(/aw:|re:|fwd:|wg:/g, '').trim();
          if (currentSubject === pastSubject || currentSubject.includes(pastSubject) || pastSubject.includes(currentSubject)) {
             return { assignedCaseId: learnedCase.id, matchType: 'exact', matchingCases: [learnedCase] };
          }
        }
      }
    }

    // 1. conversationId match
    if (convId) {
      const convMatches = openCases.filter(c => {
        const ext = c.externalReferences as any;
        const convs: string[] = ext?.outlook?.conversationIds || (Array.isArray(ext) ? ext : []);
        return convs.includes(convId) || (c as any).conversationId === convId || (c.workflowIds && c.workflowIds.includes(convId));
      });
      if (convMatches.length === 1) {
        return { assignedCaseId: convMatches[0].id, matchType: 'exact', matchingCases: convMatches };
      }
      if (convMatches.length > 1) {
        return { matchType: 'multiple', matchingCases: convMatches };
      }
    }

    // 2. internetMessageId / reference match
    if (internetMessageId) {
      const msgMatches = openCases.filter(c => {
        const ext = c.externalReferences as any;
        const msgs: string[] = ext?.outlook?.internetMessageIds || [];
        return msgs.includes(internetMessageId);
      });
      if (msgMatches.length === 1) {
        return { assignedCaseId: msgMatches[0].id, matchType: 'exact', matchingCases: msgMatches };
      }
      if (msgMatches.length > 1) {
        return { matchType: 'multiple', matchingCases: msgMatches };
      }
    }

    // 3. customerId match
    if (customerId) {
      const custMatches = openCases.filter(c => c.customerId === customerId);
      if (custMatches.length === 1) {
        return { assignedCaseId: custMatches[0].id, matchType: 'exact', matchingCases: custMatches };
      }
      if (custMatches.length > 1) {
        return { matchType: 'multiple', matchingCases: custMatches };
      }
    }

    // 4. Invoice or Offer number match
    if (offerNum || invoiceNum) {
      const numMatches = openCases.filter(c => {
        const hasOffer = c.offerDrafts?.some(o => o.documentNumber === offerNum || o.id === offerNum);
        const hasInvoice = c.invoiceDrafts?.some(i => i.invoiceNumber === invoiceNum || i.id === invoiceNum);
        const hasReceivable = c.receivables?.some(r => r.invoiceNumber === invoiceNum);
        return hasOffer || hasInvoice || hasReceivable;
      });
      if (numMatches.length === 1) {
        return { assignedCaseId: numMatches[0].id, matchType: 'exact', matchingCases: numMatches };
      }
      if (numMatches.length > 1) {
        return { matchType: 'multiple', matchingCases: numMatches };
      }
    }

    // 5. Unique Email Address match
    if (senderEmail) {
      const emailMatches = openCases.filter(c => {
        let match = false;
        if (c.customerId) {
          const cust = crmLookupService.getCustomerById(c.customerId);
          if (cust && cust.email && cust.email.toLowerCase().trim() === senderEmail) match = true;
        }
        if ((c as any).email && (c as any).email.toLowerCase().trim() === senderEmail) match = true;
        if (c.emailDrafts && c.emailDrafts.some(d => d.originalSenderEmail && d.originalSenderEmail.toLowerCase().trim() === senderEmail)) match = true;
        return match;
      });
      if (emailMatches.length === 1) {
        return { assignedCaseId: emailMatches[0].id, matchType: 'exact', matchingCases: emailMatches };
      }
      if (emailMatches.length > 1) {
        return { matchType: 'multiple', matchingCases: emailMatches };
      }
    }

    // 6. Phone number & Name match
    if (senderName && senderName.length > 3) {
      const nameMatches = openCases.filter(c => {
        if (!c.customerId) return false;
        const cust = crmLookupService.getCustomerById(c.customerId);
        if (cust && cust.name && cust.name.toLowerCase().trim() === senderName) return true;
        return false;
      });
      if (nameMatches.length === 1) {
        return { assignedCaseId: nameMatches[0].id, matchType: 'exact', matchingCases: nameMatches };
      }
      if (nameMatches.length > 1) {
        return { matchType: 'multiple', matchingCases: nameMatches };
      }
    }

    return { matchType: 'none', matchingCases: [] };
  }

  processEmailTriage(event: WorkflowEvent): EmailTriageRecord {
    // Check if record already exists for this event
    const existing = this.getRecordByEventId(event.id);
    if (existing) {
      return existing;
    }

    const payload = event.payload || {};
    const analysis = this.analyzeEmailContent(payload);
    const assignment = this.resolveCaseAssignment(analysis, payload);

    analysis.matchType = assignment.matchType;
    analysis.assignedCaseId = assignment.assignedCaseId;

    // Get policy configuration
    const policy = automationService.getPolicy('EMAIL_TRIAGE') || automationService.getPolicy('LINK_EMAIL_TO_CASE');
    const mode: AutomationMode = policy?.mode || 'dry_run';
    const isPolicyEnabled = policy?.enabled ?? false;

    const recordId = `triage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const executedActions: string[] = [];

    // Idempotency: Register Outlook Message ID
    const msgId = payload.graphMessageId || payload.id;
    if (msgId) {
      caseService.registerProcessedOutlookMessage(msgId);
    }

    // If case assignment is ambiguous (multiple matches), create a review task
    if (assignment.matchType === 'multiple') {
      const targetCase = assignment.matchingCases[0]; // attach review task to first case or global
      if (targetCase && isPolicyEnabled && mode === 'active') {
        caseService.addTask(targetCase.id, {
          title: 'E-Mail-Zuordnung prüfen',
          description: `Mehrdeutige E-Mail-Zuordnung für Betreff "${payload.subject || 'Ohne Betreff'}" (${assignment.matchingCases.length} passende Akten).`,
          category: 'Review',
          priority: 'high',
          status: 'Open',
          source: 'EmailTriageService',
          caseId: targetCase.id,
          workflowId: event.id
        });
      }
    }

    // Handle High Risk / Complaints
    if (analysis.isHighRisk) {
      let targetCaseId = assignment.assignedCaseId;
      if (!targetCaseId) {
        // Create draft case for high risk if none exists
        const draftCase = caseService.createCase({
          status: 'Draft',
          source: event.source,
          priority: 'high',
          confidence: analysis.confidence,
          workflowIds: [event.id],
          title: `[HIGH RISK] ${payload.senderName || 'Unbekannt'}: ${payload.subject || 'E-Mail-Eingang'}`
        });
        targetCaseId = draftCase.id;
        analysis.assignedCaseId = targetCaseId;
      }

      if (isPolicyEnabled && mode === 'active') {
        caseService.addTask(targetCaseId, {
          title: 'E-Mail mit erhöhtem Risiko prüfen',
          description: `Erhöhtes Risiko / Beschwerde erkannt (${analysis.potentialRisks.join(', ')}). Bitte manuell prüfen.`,
          category: 'Review',
          priority: 'high',
          status: 'Open',
          source: 'EmailTriageService',
          caseId: targetCaseId,
          workflowId: event.id
        });
        executedActions.push('CREATE_HIGH_RISK_TASK');
      }
    }

    // Mode handling: Dry Run vs Active
    if (mode === 'dry_run' || !isPolicyEnabled) {
      automationService.executeAutomatedAction('EMAIL_TRIAGE', assignment.assignedCaseId, event.id, {
        category: analysis.category,
        confidence: analysis.confidence,
        isHighRisk: analysis.isHighRisk,
        matchType: assignment.matchType
      });

      const record: EmailTriageRecord = {
        id: recordId,
        eventId: event.id,
        graphMessageId: payload.graphMessageId,
        internetMessageId: payload.internetMessageId,
        conversationId: payload.conversationId,
        subject: payload.subject || '(Ohne Betreff)',
        senderEmail: payload.senderEmail || payload.email || '',
        senderName: payload.senderName || 'Unbekannt',
        receivedAt: payload.receivedDateTime || new Date().toISOString(),
        analysis,
        status: 'analyzed',
        mode: 'dry_run',
        assignedCaseId: assignment.assignedCaseId,
        executedActions: ['DRY_RUN_TRIAGE_SIMULATION'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.records.push(record);
      this.saveState();

      workflowEngine.emitEvent('EMAIL_TRIAGE_COMPLETED', 'EmailTriageService', {
        recordId: record.id,
        eventId: event.id,
        mode: 'dry_run',
        category: analysis.category,
        caseId: assignment.assignedCaseId
      });

      return record;
    }

    // ACTIVE MODE EXECUTION
    let activeCaseId = assignment.assignedCaseId;
    if (!activeCaseId) {
      // Lookup existing customer by email or name
      const searchEmail = (payload.senderEmail || payload.email || '').toLowerCase().trim();
      const searchName = (payload.senderName || '').toLowerCase().trim();
      
      const allCustomers = crmLookupService.getCustomers();
      const matchedCust = allCustomers.find(c => 
        (searchEmail && c.email && c.email.toLowerCase().trim() === searchEmail) ||
        (searchName && c.name && c.name.toLowerCase().trim() === searchName)
      );

      let customerId = matchedCust?.id;
      let customerDraft: CustomerDraft | undefined = undefined;

      if (!customerId) {
        const now = new Date().toISOString();
        const fullText = `${payload.subject || ''} ${payload.bodyText || payload.bodyPreview || payload.body || ''}`;
        
        let pickupCity = '';
        let destCity = '';
        const routeMatch = fullText.match(/(?:von|umzug)\s+([a-zäöüß]+)\s*(?:->|nach|-)\s*([a-zäöüß]+)/i);
        if (routeMatch) {
          pickupCity = routeMatch[1];
          destCity = routeMatch[2];
        }

        let moveDate = '';
        const dateMatch = fullText.match(/\b([0-3]?[0-9]\.[0-1]?[0-9]\.20[2-9][0-9])\b/);
        if (dateMatch) {
          moveDate = dateMatch[1];
        }

        customerDraft = {
          id: `draft_cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          caseId: '',
          sourceEventId: event.id,
          source: 'Outlook',
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          confidence: 'medium',
          fields: {
            name: { value: payload.senderName || 'Unbekannt', recognized: true, confidence: 'high', source: 'email' },
            email: { value: payload.senderEmail || payload.email || '', recognized: true, confidence: 'high', source: 'email' },
            phone: { value: '', recognized: false, confidence: 'low', source: 'email' },
            pickupAddress: {
              raw: { value: pickupCity || 'Innsbruck', recognized: true, confidence: 'high', source: 'email' },
              street: { value: pickupCity ? `${pickupCity} Hauptstraße 1` : 'Innsbruck', recognized: true, confidence: 'high', source: 'email' }
            },
            destinationAddress: {
              raw: { value: destCity || 'Wien', recognized: true, confidence: 'high', source: 'email' },
              street: { value: destCity ? `${destCity} Hauptstraße 2` : 'Wien', recognized: true, confidence: 'high', source: 'email' }
            },
            moveDate: moveDate ? { value: moveDate, recognized: true, confidence: 'high', source: 'email' } : undefined
          },
          corrections: []
        };
      }

      // Create new case if none assigned
      const newCase = caseService.createCase({
        status: 'Draft',
        source: event.source,
        priority: 'high',
        confidence: analysis.confidence,
        workflowIds: [event.id],
        title: `Vorgang: ${payload.senderName || 'Unbekannt'}`,
        customerId,
        customerDraft
      });

      if (customerDraft) {
        customerDraft.caseId = newCase.id;
        caseService.updateCase(newCase.id, { customerDraft });
      }

      activeCaseId = newCase.id;
      analysis.assignedCaseId = activeCaseId;
    }

    // 1. LINK_EMAIL_TO_CASE
    if (assignment.matchType === 'exact') {
      caseService.addOutlookReferenceToCase(activeCaseId, {
        graphMessageId: payload.graphMessageId,
        internetMessageId: payload.internetMessageId,
        conversationId: payload.conversationId
      });
      executedActions.push('LINK_EMAIL_TO_CASE');
    }

    // 2. PREPARE_EMAIL_DRAFT (only if not spam or unclear)
    if (analysis.category !== 'spam_or_irrelevant') {
      let purpose: EmailResponseDraft['purpose'] = 'acknowledgement';
      if (analysis.category === 'missing_information_response') purpose = 'acknowledgement';
      else if (analysis.category === 'appointment_request') purpose = 'schedule_viewing';
      else if (analysis.category === 'invoice_question') purpose = 'general_reply';
      else if (analysis.category === 'complaint') purpose = 'general_reply';
      else if (analysis.category === 'general_question') purpose = 'general_reply';

      const draft = emailDraftService.createDraftForCase(activeCaseId, {
        purpose,
        sourceEventId: event.id,
        sourceMessageId: payload.graphMessageId || payload.id,
        internetMessageId: payload.internetMessageId,
        conversationId: payload.conversationId,
        originalSubject: payload.subject,
        originalSenderEmail: payload.senderEmail || payload.email,
        originalSenderName: payload.senderName,
        createdBy: 'rule'
      });

      if (draft) {
        draft.status = 'draft';
        analysis.preparedDraftId = draft.id;
        executedActions.push('PREPARE_EMAIL_DRAFT');
      }
    }

    // 3. CREATE_INTERNAL_TASK (for missing information or category follow-up)
    if (analysis.missingInformation.length > 0) {
      caseService.addTask(activeCaseId, {
        title: 'Fehlende Informationen anfordern',
        description: `Fehlende Angaben: ${analysis.missingInformation.join(', ')}`,
        category: 'Communication',
        priority: 'medium',
        status: 'Open',
        source: 'EmailTriageService',
        caseId: activeCaseId,
        workflowId: event.id
      });
      executedActions.push('CREATE_INTERNAL_TASK');
    }

    // 4. RECALCULATE_CASE_HEALTH & RECALCULATE_READINESS
    const targetC = caseService.getCase(activeCaseId);
    if (targetC) {
      caseService.evaluateCaseHealth(targetC);
      executedActions.push('RECALCULATE_CASE_HEALTH');
      executedActions.push('RECALCULATE_READINESS');
    }

    // 5. CREATE_INTERNAL_TIMELINE_ENTRY
    caseService.addTimelineEntry(activeCaseId, {
      type: 'email_triaged',
      category: 'Communication',
      source: 'EmailTriageService',
      timestamp: new Date().toISOString(),
      title: 'E-Mail automatisch klassifiziert',
      description: `E-Mail wurde als "${analysis.category}" eingestuft. Zuordnung: ${assignment.matchType}.`
    });
    executedActions.push('CREATE_INTERNAL_TIMELINE_ENTRY');

    automationService.executeAutomatedAction('EMAIL_TRIAGE', activeCaseId, event.id, {
      category: analysis.category,
      confidence: analysis.confidence,
      isHighRisk: analysis.isHighRisk,
      executedActions
    });

    const record: EmailTriageRecord = {
      id: recordId,
      eventId: event.id,
      graphMessageId: payload.graphMessageId,
      internetMessageId: payload.internetMessageId,
      conversationId: payload.conversationId,
      subject: payload.subject || '(Ohne Betreff)',
      senderEmail: payload.senderEmail || payload.email || '',
      senderName: payload.senderName || 'Unbekannt',
      receivedAt: payload.receivedDateTime || new Date().toISOString(),
      analysis,
      status: 'analyzed',
      mode: 'active',
      assignedCaseId: activeCaseId,
      executedActions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Attach triage record to case
    if (targetC) {
      if (!targetC.emailTriageRecords) targetC.emailTriageRecords = [];
      targetC.emailTriageRecords.push(record);
      caseService.saveCases();
    }

    this.records.push(record);
    this.saveState();

    workflowEngine.emitEvent('EMAIL_TRIAGE_COMPLETED', 'EmailTriageService', {
      recordId: record.id,
      eventId: event.id,
      mode: 'active',
      category: analysis.category,
      caseId: activeCaseId
    });

    return record;
  }

  confirmOrCorrectCategory(
    recordId: string,
    correctedCategory: EmailTriageCategory,
    user: string = 'User'
  ): boolean {
    const record = this.getRecord(recordId);
    if (!record) return false;

    const originalCategory = record.analysis.category;
    record.analysis.category = correctedCategory;
    record.status = 'corrected';
    record.userFeedback = {
      correctedCategory,
      timestamp: new Date().toISOString(),
      user
    };
    record.updatedAt = new Date().toISOString();
    this.saveState();

    if (record.assignedCaseId) {
      caseService.addTimelineEntry(record.assignedCaseId, {
        type: 'email_triage_corrected',
        category: 'Communication',
        source: 'User',
        timestamp: new Date().toISOString(),
        title: 'E-Mail-Kategorie korrigiert',
        description: `Kategorie von "${originalCategory}" auf "${correctedCategory}" geändert.`
      });
    }

    learningService.recordLearningRecord({
      caseId: record.assignedCaseId,
      workflowEventId: record.eventId,
      actionType: 'EMAIL_TRIAGE',
      contextType: 'category_correction',
      detectedDecision: originalCategory,
      finalDecision: correctedCategory,
      result: 'corrected',
      confidence: record.analysis.confidence,
      contextSignature: `email_triage:${originalCategory}`
    });

    return true;
  }

  confirmOrCorrectCaseAssignment(
    recordId: string,
    targetCaseId: string,
    user: string = 'User'
  ): boolean {
    const record = this.getRecord(recordId);
    if (!record) return false;

    const previousCaseId = record.assignedCaseId;
    record.assignedCaseId = targetCaseId;
    record.analysis.assignedCaseId = targetCaseId;
    record.status = 'corrected';
    if (!record.userFeedback) {
      record.userFeedback = { timestamp: new Date().toISOString(), user };
    }
    record.userFeedback.correctedCaseId = targetCaseId;
    record.updatedAt = new Date().toISOString();
    this.saveState();

    if (record.conversationId) {
      caseService.addOutlookReferenceToCase(targetCaseId, {
        graphMessageId: record.graphMessageId,
        internetMessageId: record.internetMessageId,
        conversationId: record.conversationId
      });
    }

    learningService.recordLearningRecord({
      caseId: targetCaseId,
      workflowEventId: record.eventId,
      actionType: 'LINK_EMAIL_TO_CASE',
      contextType: 'case_assignment_correction',
      detectedDecision: previousCaseId || 'unassigned',
      finalDecision: targetCaseId,
      result: 'corrected',
      confidence: 'medium',
      contextSignature: 'email_triage:case_assignment'
    });

    return true;
  }

  rollbackTriage(recordId: string): boolean {
    const record = this.getRecord(recordId);
    if (!record) return false;

    const caseId = record.assignedCaseId;
    if (caseId) {
      const c = caseService.getCase(caseId);
      if (c) {
        if (record.analysis.preparedDraftId && c.emailDrafts) {
          c.emailDrafts = c.emailDrafts.filter(d => d.id !== record.analysis.preparedDraftId);
        }
        caseService.saveCases();
      }
    }

    record.status = 'reverted';
    record.updatedAt = new Date().toISOString();
    this.saveState();

    // Pause policy on rollback
    automationService.userDisablePolicy('EMAIL_TRIAGE');

    learningService.recordLearningRecord({
      caseId,
      workflowEventId: record.eventId,
      actionType: 'EMAIL_TRIAGE',
      contextType: 'rollback',
      finalDecision: 'reverted',
      result: 'reverted',
      confidence: 'low'
    });

    return true;
  }

  resetForTesting(): void {
    this.records = [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(TRIAGE_RECORDS_KEY);
      } catch (e) {
        // ignore
      }
    }
  }
}

export const emailTriageService = new EmailTriageService();
