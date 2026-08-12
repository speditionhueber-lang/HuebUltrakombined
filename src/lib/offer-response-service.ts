import { OfferDraft, OfferResponseReview, OfferResponseIntent, OfferResponseEvidence, OfferRequestedChange } from './types';
import { Case, caseService } from './case-service';
import { workflowEngine } from './workflow-engine';
import { aiAnalysisService } from './ai-analysis-service';
import { learningService } from './learning-service';

export interface OfferResponseAnalysis {
  detectedIntent: OfferResponseIntent;
  confidence: 'low' | 'medium' | 'high';
  evidence: OfferResponseEvidence[];
  requestedChanges: OfferRequestedChange[];
  summary: string;
}

export class OfferResponseService {
  async analyzeOfferResponse(
    emailText: string,
    emailSubject: string,
    caseItem: Case,
    offerDraft: OfferDraft
  ): Promise<OfferResponseAnalysis> {
    // Basic rule-based checks combined with potential AI analysis in the future.
    
    // Convert to lowercase for simple matching
    const lowerText = emailText.toLowerCase();
    
    let detectedIntent: OfferResponseIntent = 'unclear';
    let confidence: 'low' | 'medium' | 'high' = 'low';
    const evidence: OfferResponseEvidence[] = [];
    const requestedChanges: OfferRequestedChange[] = [];
    let summary = 'Die Antwort konnte nicht eindeutig zugeordnet werden.';

    const acceptanceKeywords = [
      'nehme ich das angebot an',
      'nehmen wir das angebot an',
      'nehme das angebot',
      'nehmen das angebot',
      'angebot hiermit',
      'verbindlich an',
      'angebot annehmen',
      'akzeptiere das angebot',
      'akzeptieren das angebot',
      'hiermit bestätigen wir',
      'hiermit bestätige ich',
      'auftrag kann wie angeboten',
      'beauftragen sie mit dem umzug',
      'beauftrage sie mit dem umzug'
    ];

    const rejectionKeywords = [
      'lehne das angebot ab',
      'lehnen das angebot ab',
      'haben uns für ein anderes',
      'haben uns für einen anderen',
      'nicht mehr interessiert',
      'angebot ist zu teuer'
    ];

    const changeKeywords = [
      'anderer termin',
      'anderen termin',
      'neuer termin',
      'andere adresse',
      'weniger leistungen',
      'zusätzliche leistung',
      'zusätzliche möbel',
      'können wir noch'
    ];

    const questionKeywords = [
      'habe eine frage',
      'haben eine frage',
      'rückfrage',
      'wie sieht es aus mit',
      'was kostet',
      'ist da auch'
    ];

    const callbackKeywords = [
      'bitte rufen sie mich',
      'können wir telefonieren',
      'bitte um rückruf',
      'rufe mich'
    ];

    // Evaluate in order of specificity
    if (acceptanceKeywords.some(kw => lowerText.includes(kw))) {
      detectedIntent = 'accepted';
      confidence = 'high';
      summary = 'Der Kunde hat das Angebot ausdrücklich angenommen.';
      evidence.push({
        textExcerpt: '...',
        signal: 'Eindeutige Zusage gefunden',
        strength: 'high',
        explanation: 'Enthält ein klares Schlüsselwort zur Angebotsannahme.'
      });
    } else if (rejectionKeywords.some(kw => lowerText.includes(kw))) {
      detectedIntent = 'declined';
      confidence = 'high';
      summary = 'Der Kunde hat das Angebot abgelehnt.';
      evidence.push({
        textExcerpt: '...',
        signal: 'Eindeutige Absage gefunden',
        strength: 'high',
        explanation: 'Enthält ein klares Schlüsselwort zur Angebotsablehnung.'
      });
    } else if (changeKeywords.some(kw => lowerText.includes(kw))) {
      detectedIntent = 'change_requested';
      confidence = 'medium';
      summary = 'Der Kunde wünscht Änderungen am Angebot.';
      evidence.push({
        textExcerpt: '...',
        signal: 'Änderungswunsch gefunden',
        strength: 'medium',
        explanation: 'Enthält Schlüsselwörter, die auf eine Modifikation hindeuten.'
      });
      // Mock some changes for testing
      requestedChanges.push({
        field: 'Unbekannt',
        description: 'Der Kunde hat eine nicht näher spezifizierte Änderung angefragt.',
        confidence: 'low'
      });
    } else if (callbackKeywords.some(kw => lowerText.includes(kw))) {
      detectedIntent = 'callback_requested';
      confidence = 'high';
      summary = 'Der Kunde bittet um einen telefonischen Rückruf.';
      evidence.push({
        textExcerpt: '...',
        signal: 'Rückrufbitte gefunden',
        strength: 'high',
        explanation: 'Enthält eine klare Bitte um telefonischen Kontakt.'
      });
    } else if (questionKeywords.some(kw => lowerText.includes(kw))) {
      detectedIntent = 'question';
      confidence = 'medium';
      summary = 'Der Kunde hat eine Rückfrage zum Angebot.';
      evidence.push({
        textExcerpt: '...',
        signal: 'Rückfrage gefunden',
        strength: 'medium',
        explanation: 'Enthält Fragestellungen bezüglich des Angebots.'
      });
    }

    // Weak signals (Ja, passt, okay, danke)
    const weakSignals = ['ja', 'passt', 'okay', 'ok', 'danke'];
    const words = lowerText.replace(/[^\w\säöüß]/g, '').split(/\s+/);
    if (detectedIntent === 'unclear') {
      if (words.length < 5 && weakSignals.some(ws => words.includes(ws))) {
        detectedIntent = 'unclear';
        confidence = 'low';
        summary = 'Die Antwort ist zu kurz und unklar für eine automatische Zuordnung.';
        evidence.push({
          textExcerpt: emailText,
          signal: 'Schwaches Signal ("' + words.join(' ') + '")',
          strength: 'low',
          explanation: 'Ein einzelnes "Ja" oder "okay" reicht nicht für eine verbindliche Annahme.'
        });
      }
    }

    return {
      detectedIntent,
      confidence,
      evidence,
      requestedChanges,
      summary
    };
  }

  createOfferResponseReview(
    caseId: string,
    offerDraftId: string,
    sourceEventId: string,
    sourceMessageId: string,
    analysis: OfferResponseAnalysis
  ): OfferResponseReview {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) throw new Error('Case not found');

    const review: OfferResponseReview = {
      id: `orr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      caseId,
      offerDraftId,
      sourceEventId,
      sourceMessageId,
      status: 'pending',
      detectedIntent: analysis.detectedIntent,
      confidence: analysis.confidence,
      evidence: analysis.evidence,
      requestedChanges: analysis.requestedChanges,
      summary: analysis.summary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    caseItem.offerResponseReviews = caseItem.offerResponseReviews || [];
    
    // Check for idempotency
    const exists = caseItem.offerResponseReviews.some(r => r.sourceMessageId === sourceMessageId);
    if (exists) {
      console.warn('OfferResponseReview for this messageId already exists.');
      return caseItem.offerResponseReviews.find(r => r.sourceMessageId === sourceMessageId)!;
    }

    caseItem.offerResponseReviews.push(review);
    caseService.updateCase(caseId, { offerResponseReviews: caseItem.offerResponseReviews });
    
    workflowEngine.emitEvent('OFFER_RESPONSE_REVIEW_CREATED', 'OfferResponseService', {
      caseId,
      reviewId: review.id,
      detectedIntent: analysis.detectedIntent
    });

    return review;
  }

  confirmReview(caseId: string, reviewId: string, finalIntent: OfferResponseIntent, userId: string = 'System') {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) throw new Error('Case not found');

    const review = caseItem.offerResponseReviews?.find(r => r.id === reviewId);
    if (!review) throw new Error('Review not found');

    if (review.status === 'confirmed' || review.status === 'corrected') {
      throw new Error('Review already confirmed');
    }

    const wasCorrected = review.detectedIntent !== finalIntent;
    
    review.finalIntent = finalIntent;
    review.status = wasCorrected ? 'corrected' : 'confirmed';
    review.decidedAt = new Date().toISOString();
    review.decidedBy = userId;
    review.updatedAt = new Date().toISOString();

    if (wasCorrected) {
      workflowEngine.emitEvent('OFFER_RESPONSE_CORRECTED', 'OfferResponseService', {
        caseId,
        reviewId,
        oldIntent: review.detectedIntent,
        newIntent: finalIntent
      });
      learningService.recordCorrection(review.id, review.sourceEventId, {
        detectedIntent: review.detectedIntent,
        finalIntent,
        confidence: review.confidence,
        caseId,
        offerDraftId: review.offerDraftId,
        timestamp: new Date().toISOString()
      });
    } else {
      workflowEngine.emitEvent('OFFER_RESPONSE_CONFIRMED', 'OfferResponseService', {
        caseId,
        reviewId,
        intent: finalIntent
      });
      learningService.recordDecision(review.id, review.sourceEventId, 'confirmed', {
        intent: finalIntent,
        caseId,
        offerDraftId: review.offerDraftId
      });
    }

    const offerDraft = caseItem.offerDrafts?.find(o => o.id === review.offerDraftId);

    // Timeline und Status Updates
    let timelineMessage = '';
    
    if (finalIntent === 'accepted') {
      if (offerDraft) {
        offerDraft.status = 'accepted';
        offerDraft.updatedAt = new Date().toISOString();
      }
      caseItem.status = 'Planning';
      
      // Complete "Auf Angebotsbestätigung warten" task
      caseService.completeTaskByTitlePattern(caseId, 'Auf Angebotsbestätigung warten');
      
      // Create new "Auftrag planen" task
      caseService.addTask(caseId, {
        title: 'Auftrag planen',
        description: 'Der Auftrag muss basierend auf dem angenommenen Angebot geplant werden.',
        category: 'Planning',
        status: 'Open',
        priority: 'high',
        source: 'System',
        caseId,
        workflowId: review.sourceEventId
      });

      timelineMessage = 'Angebot vom Kunden angenommen';
      workflowEngine.emitEvent('OFFER_ACCEPTED', 'OfferResponseService', { caseId, offerDraftId: review.offerDraftId });

    } else if (finalIntent === 'declined') {
      if (offerDraft) {
        offerDraft.status = 'rejected';
        offerDraft.updatedAt = new Date().toISOString();
      }
      caseItem.status = 'Cancelled';
      caseService.completeTaskByTitlePattern(caseId, 'Auf Angebotsbestätigung warten');
      
      timelineMessage = 'Angebot vom Kunden abgelehnt';
      workflowEngine.emitEvent('OFFER_REJECTED', 'OfferResponseService', { caseId, offerDraftId: review.offerDraftId });

    } else if (finalIntent === 'change_requested') {
      caseItem.status = 'Waiting for Offer';
      caseService.completeTaskByTitlePattern(caseId, 'Auf Angebotsbestätigung warten');

      // Create a new offer draft version preserving the old draft
      if (offerDraft) {
        const alreadyHasNewVersion = caseItem.offerDrafts?.some(o => o.previousOfferDraftId === offerDraft.id);
        if (!alreadyHasNewVersion) {
          const newDraftId = `offer-draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const newDraft: OfferDraft = {
            ...JSON.parse(JSON.stringify(offerDraft)),
            id: newDraftId,
            previousOfferDraftId: offerDraft.id,
            status: 'draft',
            documentId: undefined,
            documentNumber: undefined,
            pdfDataUrl: undefined,
            pdfCreatedAt: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            corrections: []
          };
          caseItem.offerDrafts = caseItem.offerDrafts || [];
          caseItem.offerDrafts.push(newDraft);
        }
      }

      caseService.addTask(caseId, {
        title: 'Änderungswunsch prüfen',
        description: 'Der Kunde hat Änderungen am Angebot gewünscht.',
        category: 'Offer',
        status: 'Open',
        priority: 'high',
        source: 'System',
        caseId,
        workflowId: review.sourceEventId
      });
      timelineMessage = 'Änderungswunsch aufgenommen';
      workflowEngine.emitEvent('OFFER_CHANGE_REQUESTED', 'OfferResponseService', { caseId, offerDraftId: review.offerDraftId });

    } else if (finalIntent === 'question') {
      caseItem.status = 'Waiting for Confirmation';
      caseService.addTask(caseId, {
        title: 'Kundenfrage beantworten',
        description: 'Der Kunde hat eine Rückfrage zum Angebot.',
        category: 'Communication',
        status: 'Open',
        priority: 'medium',
        source: 'System',
        caseId,
        workflowId: review.sourceEventId
      });
      timelineMessage = 'Rückfrage erkannt';

    } else if (finalIntent === 'callback_requested') {
      caseItem.status = 'Waiting for Confirmation';
      caseService.addTask(caseId, {
        title: 'Kunden zurückrufen',
        description: 'Der Kunde bittet um Rückruf zum Angebot.',
        category: 'Communication',
        status: 'Open',
        priority: 'high',
        source: 'System',
        caseId,
        workflowId: review.sourceEventId
      });
      timelineMessage = 'Rückrufbitte erfasst';

    } else if (finalIntent === 'unclear') {
      caseItem.status = 'Waiting for Confirmation';
      caseService.addTask(caseId, {
        title: 'Kundenantwort prüfen',
        description: 'Die Kundenantwort konnte nicht eindeutig zugeordnet werden.',
        category: 'Review',
        status: 'Open',
        priority: 'medium',
        source: 'System',
        caseId,
        workflowId: review.sourceEventId
      });
      timelineMessage = 'Kundenantwort unklar';
    }

    caseItem.timeline.push({
      id: `tl_${Date.now()}`,
      caseId,
      timestamp: new Date().toISOString(),
      type: 'STATUS_CHANGED',
      category: 'Review',
      source: 'User Action',
      title: timelineMessage,
      description: timelineMessage,
      user: userId
    });

    caseService.updateCase(caseId, { 
      status: caseItem.status, 
      offerResponseReviews: caseItem.offerResponseReviews,
      offerDrafts: caseItem.offerDrafts,
      tasks: caseItem.tasks,
      timeline: caseItem.timeline
    });
  }
}

export const offerResponseService = new OfferResponseService();
