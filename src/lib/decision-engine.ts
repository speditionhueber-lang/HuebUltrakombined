import { workflowEngine, WorkflowEvent, WorkflowSuggestion } from './workflow-engine';
import { aiAnalysisService } from './ai-analysis-service';
import { crmLookupService } from './crm-lookup-service';
import { caseService } from './case-service';
import { emailDraftService } from './email-draft-service';
import { emailTriageService } from './email-triage-service';
import { planningService } from './planning-service';
import { dispatchService } from './dispatch-service';
import { calendarPlanningService } from './calendar-planning-service';
import { tourPlanningService } from './tour-planning-service';
import { operationPreparationService } from './operation-preparation-service';
import { operationExecutionService } from './operation-execution-service';
import { offerResponseService } from './offer-response-service';
import { CustomerDraft, DraftField, CustomerMatchReview, CustomerMatchCandidate, compareCustomerWithExtractedData } from './types';

export class DecisionEngine {
  private subscribed = false;

  constructor() {
    this.initialize();
  }

  public initialize() {
    if (this.subscribed) return;
    if (workflowEngine) {
      if (typeof (workflowEngine as any).subscribe === 'function') {
        (workflowEngine as any).subscribe('event', this.handleEvent.bind(this));
      } else if (typeof workflowEngine.on === 'function') {
        workflowEngine.on('event', this.handleEvent.bind(this));
      }
      this.subscribed = true;
    }
  }

  private async handleEvent(event: WorkflowEvent) {
    // Prevent recursive loop if processing decision/match/update/draft events
    if (
      event.type.startsWith('AUTOMATION_') ||
      event.type.startsWith('DOCUMENT_') ||
      event.type === 'SUGGESTION_CREATED' ||
      event.type === 'SUGGESTION_DECISION_MADE' ||
      event.type === 'CUSTOMER_MATCH_REVIEW_CREATED' ||
      event.type === 'CUSTOMER_MATCH_SELECTED' ||
      event.type === 'CUSTOMER_MATCH_CONFIRMED' ||
      event.type === 'CUSTOMER_MATCH_REJECTED' ||
      event.type === 'CUSTOMER_UPDATE_PROPOSED' ||
      event.type === 'CUSTOMER_UPDATE_APPROVED' ||
      event.type === 'CUSTOMER_UPDATED' ||
      event.type === 'EMAIL_RESPONSE_DRAFT_CREATED' ||
      event.type === 'EMAIL_RESPONSE_DRAFT_UPDATED' ||
      event.type === 'EMAIL_RESPONSE_DRAFT_APPROVED' ||
      event.type === 'EMAIL_RESPONSE_DRAFT_REJECTED' ||
      event.type === 'EMAIL_SEND_STARTED' ||
      event.type === 'EMAIL_SENT' ||
      event.type === 'EMAIL_SEND_FAILED' ||
      event.type === 'OFFER_SENT' ||
      event.type === 'OFFER_SEND_STARTED' ||
      event.type === 'OFFER_SEND_FAILED' ||
      event.type === 'PLANNING_REVIEW_CREATED' ||
      event.type === 'PLANNING_REVIEW_UPDATED' ||
      event.type === 'DISPATCH_REVIEW_CREATED' ||
      event.type === 'DISPATCH_REVIEW_UPDATED' ||
      event.type === 'CALENDAR_PLANNING_REVIEW_CREATED' ||
      event.type === 'CALENDAR_PLANNING_REVIEW_UPDATED' ||
      event.type === 'CALENDAR_EVENT_CREATION_STARTED' ||
      event.type === 'CALENDAR_EVENT_CREATION_FAILED' ||
      event.type === 'TOUR_PLANNING_REVIEW_CREATED' ||
      event.type === 'TOUR_PLANNING_REVIEW_UPDATED' ||
      event.type === 'TOUR_PLANNING_REVIEW_REJECTED' ||
      event.type === 'OPERATION_PREPARATION_REVIEW_CREATED' ||
      event.type === 'OPERATION_PREPARATION_REVIEW_UPDATED' ||
      event.type === 'OPERATION_EXECUTION_REVIEW_CREATED' ||
      event.type === 'OPERATION_EXECUTION_STARTED' ||
      event.type === 'OPERATION_EXECUTION_UPDATED' ||
      event.type === 'OPERATION_COMPLETION_REVIEW_REQUESTED' ||
      event.type === 'OPERATION_EXECUTION_COMPLETED' ||
      event.type === 'OPERATION_FOLLOW_UP_REQUIRED' ||
      event.type === 'OPERATION_EXECUTION_CANCELLED' ||
      event.type === 'INVOICE_DRAFT_CREATED' ||
      event.type === 'INVOICE_DRAFT_UPDATED' ||
      event.type === 'INVOICE_DRAFT_APPROVED' ||
      event.type === 'INVOICE_DRAFT_REJECTED' ||
      event.type === 'INVOICE_PDF_CREATED' ||
      event.type === 'RECEIVABLE_CREATED' ||
      event.type === 'INVOICE_SENT' ||
      event.type === 'INVOICE_PAID' ||
      event.type === 'PAYMENT_RECORDED' ||
      event.type === 'PAYMENT_UPDATED' ||
      event.type === 'RECEIVABLE_STATUS_CHANGED' ||
      event.type === 'RECEIVABLE_OVERDUE' ||
      event.type === 'PAYMENT_REMINDER_DRAFT_CREATED' ||
      event.type === 'PAYMENT_REMINDER_SENT' ||
      event.type === 'PAYMENT_REMINDER_FAILED' ||
      event.type === 'INVOICE_CREATED' ||
      event.type === 'CASE_REMINDER_CREATED' ||
      event.type === 'CASE_REMINDER_DUE' ||
      event.type === 'CASE_REMINDER_COMPLETED'
    ) return;

    // Step 1: Analyze event using AI Analysis Service
    const analysis = await aiAnalysisService.analyzeEvent(event);
    
    // Update event confidence based on analysis if it changed
    if (event.confidence !== analysis.confidence) {
      workflowEngine.updateEventStatus(event.id, { confidence: analysis.confidence });
    }

    let crmResult = null;
    let suggestedActions = [...analysis.suggestedActions];

    // Step 2: CRM Lookup for relevant events
    if (event.type === 'EMAIL_RECEIVED') {
      crmResult = await crmLookupService.lookup(analysis.extractedData);
      
      if (crmResult.status === 'exact_match') {
        suggestedActions.push('OPEN_CUSTOMER', 'UPDATE_CUSTOMER', 'PREPARE_OFFER');
      } else if (crmResult.status === 'multiple_matches') {
        suggestedActions.push('SELECT_CUSTOMER', 'COMPARE_DATA');
      } else {
        suggestedActions.push('PREPARE_CUSTOMER_DRAFT');
      }
    }

    // Step 2.5: Case Lookup and Management
    let relatedCase = caseService.lookupCase({ workflowId: event.id });
    let offerResponseHandled = false;
    if (!relatedCase && event.payload?.caseId) {
      relatedCase = caseService.getCase(event.payload.caseId);
    }

    // Offer responses are time-sensitive and already carry reliable Outlook
    // references. Resolve and record them before the broader triage pipeline so
    // a busy inbox cannot delay (or race) the confirmation review.
    if (event.type === 'EMAIL_RECEIVED') {
      const referencedCase = relatedCase || caseService.lookupCase({
        conversationId: event.payload?.conversationId,
        internetMessageId: event.payload?.internetMessageId
      });
      const sentOfferDraft = referencedCase?.offerDrafts?.find(offer => offer.status === 'sent');
      if (referencedCase?.status === 'Waiting for Confirmation' && sentOfferDraft) {
        const offerSentAt = new Date(sentOfferDraft.sentAt || sentOfferDraft.updatedAt || 0).getTime();
        const emailReceivedAt = event.payload?.receivedDateTime
          ? new Date(event.payload.receivedDateTime).getTime()
          : Date.now();
        if (emailReceivedAt >= offerSentAt) {
          try {
            const responseAnalysis = await offerResponseService.analyzeOfferResponse(
              event.payload?.bodyPreview || event.payload?.text || '',
              event.payload?.subject || '',
              referencedCase,
              sentOfferDraft
            );
            offerResponseService.createOfferResponseReview(
              referencedCase.id,
              sentOfferDraft.id,
              event.id,
              event.payload?.graphMessageId || event.payload?.id || '',
              responseAnalysis
            );
            relatedCase = referencedCase;
            offerResponseHandled = true;
          } catch (error) {
            console.error('Error analyzing early offer response:', error);
          }
        }
      }
    }

    if (event.type === 'OFFER_ACCEPTED') {
      const caseId = event.payload?.caseId || relatedCase?.id;
      if (caseId) {
        planningService.createPlanningReview(caseId, event.payload?.offerDraftId);
      }
    }

    if (event.type === 'PLANNING_REVIEW_CONFIRMED') {
      const caseId = event.payload?.caseId || relatedCase?.id;
      if (caseId) {
        dispatchService.createDispatchReview(caseId, event.payload?.planningReviewId);
      }
    }

    if (event.type === 'DISPATCH_REVIEW_CONFIRMED') {
      const caseId = event.payload?.caseId || relatedCase?.id;
      if (caseId) {
        calendarPlanningService.createCalendarPlanningReview(caseId, event.payload?.dispatchReviewId);
      }
    }

    if (event.type === 'CALENDAR_EVENT_CREATED' || event.type === 'CALENDAR_PLANNING_REVIEW_CONFIRMED') {
      const caseId = event.payload?.caseId || relatedCase?.id;
      if (caseId) {
        tourPlanningService.createTourPlanningReview(caseId, event.payload?.calendarPlanningReviewId || event.payload?.reviewId);
      }
    }

    if (event.type === 'TOUR_PLANNING_REVIEW_CONFIRMED') {
      const caseId = event.payload?.caseId || relatedCase?.id;
      if (caseId) {
        operationPreparationService.createOperationPreparationReview(caseId, event.payload?.reviewId);
      }
    }

    if (event.type === 'OPERATION_PREPARATION_CONFIRMED') {
      const caseId = event.payload?.caseId || relatedCase?.id;
      if (caseId) {
        operationExecutionService.createOperationExecutionReview(caseId, event.payload?.reviewId);
      }
    }
    
    if (event.type === 'EMAIL_RECEIVED') {
      const triageRecord = emailTriageService.processEmailTriage(event);
      if (triageRecord?.assignedCaseId) {
        relatedCase = caseService.getCase(triageRecord.assignedCaseId);
      }
    }

    if (!relatedCase && event.type === 'EMAIL_RECEIVED') {
      const customerId = crmResult?.status === 'exact_match' ? crmResult.customers[0].id : undefined;
      relatedCase = caseService.lookupCase({ 
        customerId, 
        email: analysis.extractedData?.email?.value,
        conversationId: event.payload?.conversationId,
        internetMessageId: event.payload?.internetMessageId
      });
      
      if (relatedCase) {
        // Attach event to existing case
        caseService.attachWorkflowEvent(relatedCase.id, event.id);
      } else {
        // Create a new Case Draft
        relatedCase = caseService.createCase({
          status: 'Draft',
          source: event.source,
          priority: 'high',
          confidence: analysis.confidence,
          customerId,
          workflowIds: [event.id],
          title: `Vorgang: ${analysis.extractedData?.senderName?.value || 'Unbekannt'}`
        });
      }
    }
    
    if (relatedCase) {
      workflowEngine.updateEventStatus(event.id, { caseId: relatedCase.id });

      // Update Outlook references and create AI Email Response Draft for EMAIL_RECEIVED
      if (event.type === 'EMAIL_RECEIVED') {
        caseService.addOutlookReferenceToCase(relatedCase.id, {
          graphMessageId: event.payload?.graphMessageId,
          internetMessageId: event.payload?.internetMessageId,
          conversationId: event.payload?.conversationId
        });

        // Generate AI/Rule-based Email Response Draft if communication needed
        const sentOfferDraft = relatedCase.offerDrafts?.find(o => o.status === 'sent');
        
        let isOfferResponse = false;
        if (relatedCase.status === 'Waiting for Confirmation' && sentOfferDraft) {
          // Check timestamp to ensure it's a response to the offer
          const offerSentAt = new Date(sentOfferDraft.sentAt || sentOfferDraft.updatedAt || 0).getTime();
          const emailReceivedAt = event.payload?.receivedDateTime ? new Date(event.payload.receivedDateTime).getTime() : Date.now();
          
          if (emailReceivedAt >= offerSentAt) {
            isOfferResponse = true;
          }
        }

        if (isOfferResponse && sentOfferDraft && !offerResponseHandled) {
          try {
            const offerResponseAnalysis = await offerResponseService.analyzeOfferResponse(
              event.payload?.bodyPreview || event.payload?.text || '',
              event.payload?.subject || '',
              relatedCase!,
              sentOfferDraft
            );
            offerResponseService.createOfferResponseReview(
              relatedCase.id,
              sentOfferDraft.id,
              event.id,
              event.payload?.graphMessageId || event.payload?.id || '',
              offerResponseAnalysis
            );
          } catch (error) {
            console.error('Error analyzing offer response:', error);
          }
        } else if (!isOfferResponse) {
          // Normal Email Processing
          const missing = analysis.extractedData?.missingOrUnknown?.value || [];
          const viewing = analysis.extractedData?.viewingRequested?.value;
          const callback = analysis.extractedData?.callbackRequested?.value;
          const offer = analysis.extractedData?.offerRequested?.value;

          let purpose: 'request_missing_information' | 'schedule_viewing' | 'callback_confirmation' | 'acknowledgement' | 'general_reply' = 'acknowledgement';
          let requestedFields: any[] = [];

          if (missing.length > 0) {
            purpose = 'request_missing_information';
            requestedFields = missing.map((label: string) => ({
              field: label.toLowerCase().replace(/\s+/g, '_'),
              label,
              reason: 'Fehlende Angabe in Kundenanfrage',
              required: true
            }));
          } else if (viewing) {
            purpose = 'schedule_viewing';
          } else if (callback) {
            purpose = 'callback_confirmation';
          } else if (offer) {
            purpose = 'acknowledgement';
          }

          emailDraftService.createDraftForCase(relatedCase.id, {
            purpose,
            sourceEventId: event.id,
            requestedFields,
            originalSubject: event.payload?.subject,
            originalSenderEmail: event.payload?.senderEmail || event.payload?.email,
            originalSenderName: event.payload?.senderName,
            sourceMessageId: event.payload?.graphMessageId || event.payload?.id,
            internetMessageId: event.payload?.internetMessageId,
            conversationId: event.payload?.conversationId
          });
        }
      }
      
      if (crmResult) {
        if (crmResult.status === 'exact_match' && crmResult.customers.length > 0) {
          const matchedCustomer = crmResult.customers[0];
          relatedCase.customerId = matchedCustomer.id;

          const comparisons = compareCustomerWithExtractedData(matchedCustomer, analysis.extractedData);
          const hasDifferences = comparisons.some(c => c.matchStatus === 'missing_in_crm' || c.matchStatus === 'conflicting');

          if (!relatedCase.customerMatchReview) {
            const review: CustomerMatchReview = {
              id: crypto.randomUUID(),
              caseId: relatedCase.id,
              sourceEventId: event.id,
              status: 'pending',
              matchType: 'exact',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              selectedCustomerId: matchedCustomer.id,
              candidates: [{
                customerId: matchedCustomer.id,
                customerName: matchedCustomer.name,
                customerEmail: matchedCustomer.email,
                customerPhone: matchedCustomer.phone,
                score: 100,
                matchedFields: ['email'],
                conflictingFields: []
              }],
              fieldComparisons: comparisons
            };

            relatedCase = caseService.updateCustomerMatchReview(relatedCase.id, review) || relatedCase;

            const taskTitle = hasDifferences ? 'Kundenänderungen prüfen' : 'Kundenzuordnung prüfen';
            const existingTask = caseService.findTaskByReference(relatedCase.id, 'CUSTOMER_MATCH_REVIEW', review.id);

            if (!existingTask) {
              caseService.addTask(relatedCase.id, {
                title: taskTitle,
                description: hasDifferences
                  ? 'Neue oder abweichende Daten zum Kunden in der E-Mail erkannt.'
                  : 'Eindeutiger Kunde im CRM erkannt. Zuordnung bestätigen.',
                category: 'CRM',
                status: 'Open',
                priority: 'high',
                source: 'System',
                workflowId: event.id,
                caseId: relatedCase.id,
                referenceType: 'CUSTOMER_MATCH_REVIEW',
                referenceId: review.id
              });
            }

            const tlId = `tl-match-found-${event.id}`;
            if (!relatedCase.timeline.some(t => t.id === tlId)) {
              relatedCase.timeline.push({
                id: tlId,
                caseId: relatedCase.id,
                workflowId: event.id,
                eventId: event.id,
                timestamp: new Date().toISOString(),
                type: 'CUSTOMER_MATCH_FOUND',
                category: 'CRM',
                source: 'System',
                title: 'CRM-Treffer erkannt',
                description: `Eindeutiger Kunde (${matchedCustomer.name}) im CRM erkannt.`,
                confidence: crmResult.confidence
              });
            }
          }
        } else if (crmResult.status === 'multiple_matches' && crmResult.customers.length > 0) {
          // Do NOT assign customerId automatically!
          if (!relatedCase.customerMatchReview) {
            const candidates: CustomerMatchCandidate[] = crmResult.customers.map(c => ({
              customerId: c.id,
              customerName: c.name,
              customerEmail: c.email,
              customerPhone: c.phone,
              score: 75,
              matchedFields: [],
              conflictingFields: []
            }));

            const review: CustomerMatchReview = {
              id: crypto.randomUUID(),
              caseId: relatedCase.id,
              sourceEventId: event.id,
              status: 'pending',
              matchType: 'multiple',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              candidates,
              fieldComparisons: []
            };

            relatedCase = caseService.updateCustomerMatchReview(relatedCase.id, review) || relatedCase;

            const existingTask = caseService.findTaskByReference(relatedCase.id, 'CUSTOMER_MATCH_REVIEW', review.id);
            if (!existingTask) {
              caseService.addTask(relatedCase.id, {
                title: 'Kunden auswählen',
                description: 'Mehrere mögliche Kunden im CRM erkannt. Bitte passenden Kunden auswählen.',
                category: 'CRM',
                status: 'Open',
                priority: 'high',
                source: 'System',
                workflowId: event.id,
                caseId: relatedCase.id,
                referenceType: 'CUSTOMER_MATCH_REVIEW',
                referenceId: review.id
              });
            }

            const tlId = `tl-match-multiple-${event.id}`;
            if (!relatedCase.timeline.some(t => t.id === tlId)) {
              relatedCase.timeline.push({
                id: tlId,
                caseId: relatedCase.id,
                workflowId: event.id,
                eventId: event.id,
                timestamp: new Date().toISOString(),
                type: 'CUSTOMER_MATCH_MULTIPLE',
                category: 'CRM',
                source: 'System',
                title: 'Mehrere mögliche Kunden erkannt',
                description: `${crmResult.customers.length} mögliche Kunden im CRM gefunden.`,
                confidence: crmResult.confidence
              });
            }
          }
        } else if (crmResult.status === 'no_match') {
          // No match: create CustomerDraft
          const createDraftField = (val: any, conf: string, src: string = 'AI'): DraftField<any> => ({
            value: val || null,
            recognized: !!val,
            confidence: conf as any,
            source: src
          });

          if (!relatedCase.customerDraft) {
            const draft: CustomerDraft = {
              id: crypto.randomUUID(),
              caseId: relatedCase.id,
              sourceEventId: event.id,
              source: 'AI',
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              confidence: analysis.confidence as any,
              fields: {
                name: createDraftField(analysis.extractedData?.senderName?.value, analysis.extractedData?.senderName?.confidence),
                email: createDraftField(analysis.extractedData?.email?.value, analysis.extractedData?.email?.confidence),
                phone: createDraftField(analysis.extractedData?.phone?.value, analysis.extractedData?.phone?.confidence),
                company: createDraftField('', 'low'),
                pickupAddress: {
                  raw: createDraftField(analysis.extractedData?.sourceAddress?.value, analysis.extractedData?.sourceAddress?.confidence)
                },
                destinationAddress: {
                  raw: createDraftField(analysis.extractedData?.destinationAddress?.value, analysis.extractedData?.destinationAddress?.confidence)
                },
                moveDate: createDraftField(analysis.extractedData?.moveDate?.value, analysis.extractedData?.moveDate?.confidence),
                apartmentSize: createDraftField(analysis.extractedData?.volumeEstimate?.value, analysis.extractedData?.volumeEstimate?.confidence),
                notes: createDraftField('', 'low')
              },
              originalExtractedData: analysis.extractedData,
              corrections: []
            };

            relatedCase = caseService.updateCustomerDraft(relatedCase.id, draft) || relatedCase;

            const existingTask = caseService.findTaskByReference(relatedCase.id, 'CUSTOMER_DRAFT_REVIEW', draft.id);
            if (!existingTask) {
              caseService.addTask(relatedCase.id, {
                title: 'Kundenentwurf prüfen',
                description: 'Es konnte kein eindeutiger Kunde zugeordnet werden. Bitte Kundenentwurf prüfen.',
                category: 'CRM',
                status: 'Open',
                priority: 'high',
                source: 'System',
                workflowId: event.id,
                caseId: relatedCase.id,
                referenceType: 'CUSTOMER_DRAFT_REVIEW',
                referenceId: draft.id
              });
            }
          }
        }
      }
    }

    // Step 3: Generate suggestions based on rules
    if (suggestedActions.length > 0) {
      const suggestion: WorkflowSuggestion = {
        id: crypto.randomUUID(),
        eventId: event.id,
        title: this.getSuggestionTitle(event.type),
        description: `Basierend auf ${this.getEventTypeName(event.type)} wurden folgende Handlungen ermittelt:`,
        priority: 'high',
        confidence: analysis.confidence,
        category: 'Customer Processing',
        actions: suggestedActions.map(action => ({
          label: this.getActionLabel(action),
          actionType: action,
          data: {
            extractedData: analysis.extractedData,
            crmResult: crmResult
          }
        }))
      };

      const suggestionEvent = workflowEngine.emitEvent('SUGGESTION_CREATED', 'DecisionEngine', suggestion);
      if (relatedCase) {
        workflowEngine.updateEventStatus(suggestionEvent.id, { caseId: relatedCase.id });
        caseService.attachWorkflowEvent(relatedCase.id, suggestionEvent.id);
        
        // Re-evaluate health now that suggestion is attached
        caseService.evaluateCaseHealth(relatedCase);
      }
    }
  }

  private getSuggestionTitle(type: string): string {
    switch (type) {
      case 'EMAIL_RECEIVED': return 'Neue Kundenanfrage bearbeiten';
      case 'CUSTOMER_CREATED': return 'Nächste Schritte für neuen Kunden';
      case 'OFFER_CREATED': return 'Angebot verwalten';
      default: return 'Handlungsempfehlung';
    }
  }

  private getEventTypeName(type: string): string {
    switch (type) {
      case 'EMAIL_RECEIVED': return 'neuer E-Mail';
      case 'CUSTOMER_CREATED': return 'neuem Kunden';
      case 'OFFER_CREATED': return 'neuem Angebot';
      default: return type;
    }
  }

  private getActionLabel(actionType: string): string {
    switch (actionType) {
      case 'PREPARE_CUSTOMER': return 'Neuen Kunden vorbereiten';
      case 'SEARCH_EXISTING_CUSTOMER': return 'Bestehenden Kunden suchen';
      case 'PREPARE_OFFER': return 'Angebot vorbereiten';
      case 'RECOMMEND_VIEWING': return 'Besichtigung empfehlen';
      case 'REQUEST_MISSING_INFO': return 'Fehlende Informationen anfordern';
      case 'RECOMMEND_CALLBACK': return 'Rückruf empfehlen';
      case 'OPEN_CUSTOMER': return 'Kundenvorgang öffnen';
      case 'UPDATE_CUSTOMER': return 'Kunden aktualisieren';
      case 'SELECT_CUSTOMER': return 'Kunden auswählen';
      case 'COMPARE_DATA': return 'Daten vergleichen';
      case 'PREPARE_CUSTOMER_DRAFT': return 'Kundenentwurf vorbereiten';
      case 'CREATE_CUSTOMER': return 'Kunde anlegen';
      case 'DRAFT_REPLY': return 'Antwort entwerfen';
      case 'CREATE_OFFER': return 'Angebot erstellen';
      case 'SEND_OFFER': return 'Angebot versenden';
      default: return actionType;
    }
  }

  private publishSuggestion(suggestion: WorkflowSuggestion) {
    // Emit the suggestion as a new event so the Activity Center can pick it up
    workflowEngine.emitEvent('SUGGESTION_CREATED', 'DecisionEngine', suggestion);
  }
}

// Instantiate to start listening
export const decisionEngine = new DecisionEngine();
