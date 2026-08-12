import { WorkflowEvent, WorkflowEventConfidence } from './workflow-engine';

export interface ExtractedField<T> {
  value: T | null;
  recognized: boolean;
  confidence: WorkflowEventConfidence;
  source: string;
}

export interface EmailAnalysisData {
  senderName: ExtractedField<string>;
  company: ExtractedField<string>;
  phone: ExtractedField<string>;
  email: ExtractedField<string>;
  pickupAddress: ExtractedField<string>;
  destinationAddress: ExtractedField<string>;
  moveDate: ExtractedField<string>;
  isFlexibleDate: ExtractedField<boolean>;
  apartmentSize: ExtractedField<string>;
  floor: ExtractedField<string>;
  elevator: ExtractedField<boolean>;
  furniture: ExtractedField<string>;
  boxes: ExtractedField<number>;
  hvzMentioned: ExtractedField<boolean>;
  viewingRequested: ExtractedField<boolean>;
  offerRequested: ExtractedField<boolean>;
  callbackRequested: ExtractedField<boolean>;
  urgency: ExtractedField<string>;
  freeText: ExtractedField<string>;
  missingOrUnknown: ExtractedField<string[]>;
}

export interface AnalysisResult {
  confidence: WorkflowEventConfidence;
  extractedData: any;
  suggestedActions: string[];
}

export class AIAnalysisService {
  private createEmptyField<T>(source: string): ExtractedField<T> {
    return { value: null, recognized: false, confidence: 'low', source };
  }

  private analyzeEmail(event: WorkflowEvent): { confidence: WorkflowEventConfidence, data: EmailAnalysisData, actions: string[] } {
    const payload = event.payload || {};
    const rawText = payload.bodyText || payload.body || payload.content || '';
    const text = rawText.toLowerCase();
    const source = 'AI Rule Engine';
    
    // Create base empty structure
    const data: EmailAnalysisData = {
      senderName: { value: payload.senderName || 'Unbekannt', recognized: true, confidence: 'high', source: 'Email Header' },
      company: this.createEmptyField<string>(source),
      phone: this.createEmptyField<string>(source),
      email: { value: payload.senderEmail || payload.sender || payload.email || '', recognized: true, confidence: 'high', source: 'Email Header' },
      pickupAddress: this.createEmptyField<string>(source),
      destinationAddress: this.createEmptyField<string>(source),
      moveDate: this.createEmptyField<string>(source),
      isFlexibleDate: this.createEmptyField<boolean>(source),
      apartmentSize: this.createEmptyField<string>(source),
      floor: this.createEmptyField<string>(source),
      elevator: this.createEmptyField<boolean>(source),
      furniture: this.createEmptyField<string>(source),
      boxes: this.createEmptyField<number>(source),
      hvzMentioned: this.createEmptyField<boolean>(source),
      viewingRequested: this.createEmptyField<boolean>(source),
      offerRequested: this.createEmptyField<boolean>(source),
      callbackRequested: this.createEmptyField<boolean>(source),
      urgency: this.createEmptyField<string>(source),
      freeText: { value: rawText, recognized: true, confidence: 'high', source: 'Email Body' },
      missingOrUnknown: { value: [], recognized: true, confidence: 'high', source },
    };

    const actions: string[] = [];
    let overallConfidence: WorkflowEventConfidence = 'medium';

    // Simple rule-based extraction
    if (text.includes('wien') || text.includes('innsbruck')) {
      data.destinationAddress = { value: 'Wien', recognized: true, confidence: 'medium', source };
      data.pickupAddress = { value: 'Innsbruck', recognized: true, confidence: 'medium', source };
    }
    
    if (text.includes('angebot')) {
      data.offerRequested = { value: true, recognized: true, confidence: 'high', source };
      actions.push('PREPARE_OFFER');
    }
    
    if (text.includes('besichtigung')) {
      data.viewingRequested = { value: true, recognized: true, confidence: 'high', source };
      actions.push('RECOMMEND_VIEWING');
    }
    
    if (text.includes('rückruf') || text.includes('anrufen') || text.includes('telefon')) {
      data.callbackRequested = { value: true, recognized: true, confidence: 'high', source };
      actions.push('RECOMMEND_CALLBACK');
    }
    
    if (text.includes('halteverbot')) {
      data.hvzMentioned = { value: true, recognized: true, confidence: 'high', source };
    }
    
    // Check missing fields to request info
    const missing = [];
    if (!data.moveDate.recognized) missing.push('Umzugstermin');
    if (!data.pickupAddress.recognized) missing.push('Abholadresse');
    if (!data.destinationAddress.recognized) missing.push('Zieladresse');
    if (!data.apartmentSize.recognized) missing.push('Wohnungsgröße');
    
    if (missing.length > 0) {
      data.missingOrUnknown.value = missing;
      actions.push('REQUEST_MISSING_INFO');
    }

    return { confidence: overallConfidence, data, actions };
  }

  async analyzeEvent(event: WorkflowEvent): Promise<AnalysisResult> {
    // Placeholder for rule-based analysis, preparing for Gemini/OpenAI
    
    let confidence: WorkflowEventConfidence = 'low';
    let extractedData = {};
    let suggestedActions: string[] = [];

    // Rule-based simulation for now
    switch (event.type) {
      case 'EMAIL_RECEIVED': {
        const emailAnalysis = this.analyzeEmail(event);
        confidence = emailAnalysis.confidence;
        extractedData = {
          ...emailAnalysis.data,
          ...(event.payload?.extractedData || {})
        };
        suggestedActions = emailAnalysis.actions;
        break;
      }
      case 'CUSTOMER_CREATED':
        confidence = 'high';
        suggestedActions = ['CREATE_OFFER'];
        break;
      case 'OFFER_CREATED':
        confidence = 'high';
        suggestedActions = ['SEND_OFFER'];
        break;
      // Add other cases as needed
    }

    return {
      confidence,
      extractedData,
      suggestedActions
    };
  }
}

export const aiAnalysisService = new AIAnalysisService();
