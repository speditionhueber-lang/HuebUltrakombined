type Listener = (...args: any[]) => void;

class EventEmitter {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, listener: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
  }

  listenerCount(event: string): number {
    return this.listeners[event] ? this.listeners[event].length : 0;
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((listener) => listener(...args));
  }
}

export type WorkflowEventType =
  | 'EMAIL_RECEIVED'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'OFFER_CREATED'
  | 'INVOICE_CREATED'
  | 'DOCUMENT_GENERATED'
  | 'EVENT_CREATED'
  | 'CALENDAR_UPDATED'
  | 'PDF_SAVED'
  | 'AI_CUSTOMER_DATA_EXTRACTED'
  | 'DOCUMENT_DELETED'
  | 'CUSTOMER_SELECTED'
  | 'SUGGESTION_CREATED'
  | 'SUGGESTION_DECISION_MADE'
  | 'CUSTOMER_DRAFT_CREATED'
  | 'CUSTOMER_DRAFT_UPDATED'
  | 'CUSTOMER_DRAFT_APPROVED'
  | 'CUSTOMER_DRAFT_REJECTED'
  | 'CUSTOMER_DRAFT_CONVERTED'
  | 'CUSTOMER_MATCH_FOUND'
  | 'CUSTOMER_MATCH_MULTIPLE'
  | 'CUSTOMER_MATCH_REVIEW_CREATED'
  | 'CUSTOMER_MATCH_SELECTED'
  | 'CUSTOMER_MATCH_CONFIRMED'
  | 'CUSTOMER_MATCH_REJECTED'
  | 'CUSTOMER_UPDATE_PROPOSED'
  | 'CUSTOMER_UPDATE_APPROVED'
  | 'EMAIL_RESPONSE_DRAFT_CREATED'
  | 'EMAIL_RESPONSE_DRAFT_UPDATED'
  | 'EMAIL_RESPONSE_DRAFT_APPROVED'
  | 'EMAIL_RESPONSE_DRAFT_REJECTED'
  | 'EMAIL_TRIAGE_COMPLETED'
  | 'WORKFLOW_EXCEPTION_CREATED'
  | 'WORKFLOW_EXCEPTION_UPDATED'
  | 'WORKFLOW_EXCEPTION_RESOLVED'
  | 'WORKFLOW_EXCEPTION_DISMISSED'
  | 'RECONCILIATION_REQUIRED'
  | 'RECONCILIATION_COMPLETED'
  | 'DOCUMENT_UPLOAD_STARTED'
  | 'DOCUMENT_UPLOAD_COMPLETED'
  | 'DOCUMENT_UPLOAD_FAILED'
  | 'DOCUMENT_MIGRATION_COMPLETED'
  | 'DOCUMENT_MISSING'
  | 'DOCUMENT_RECONCILIATION_REQUIRED'
  | 'EMAIL_SEND_STARTED'
  | 'EMAIL_SENT'
  | 'EMAIL_SEND_FAILED'
  | 'OFFER_SENT'
  | 'OFFER_SEND_STARTED'
  | 'OFFER_SEND_FAILED'
  | 'OFFER_RESPONSE_REVIEW_CREATED'
  | 'OFFER_RESPONSE_CONFIRMED'
  | 'OFFER_RESPONSE_CORRECTED'
  | 'OFFER_CHANGE_REQUESTED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'PLANNING_REVIEW_CREATED'
  | 'PLANNING_REVIEW_UPDATED'
  | 'PLANNING_REVIEW_CONFIRMED'
  | 'DISPATCH_REVIEW_CREATED'
  | 'DISPATCH_REVIEW_UPDATED'
  | 'DISPATCH_REVIEW_CONFIRMED'
  | 'CALENDAR_PLANNING_REVIEW_CREATED'
  | 'CALENDAR_PLANNING_REVIEW_UPDATED'
  | 'CALENDAR_PLANNING_REVIEW_CONFIRMED'
  | 'CALENDAR_EVENT_CREATION_STARTED'
  | 'CALENDAR_EVENT_CREATED'
  | 'CALENDAR_EVENT_CREATION_FAILED'
  | 'TOUR_PLANNING_REVIEW_CREATED'
  | 'TOUR_PLANNING_REVIEW_UPDATED'
  | 'TOUR_PLANNING_REVIEW_CONFIRMED'
  | 'TOUR_PLANNING_REVIEW_REJECTED'
  | 'OPERATION_PREPARATION_REVIEW_CREATED'
  | 'OPERATION_PREPARATION_REVIEW_UPDATED'
  | 'OPERATION_PREPARATION_CONFIRMED'
  | 'OPERATION_EXECUTION_REVIEW_CREATED'
  | 'OPERATION_EXECUTION_STARTED'
  | 'OPERATION_EXECUTION_UPDATED'
  | 'OPERATION_COMPLETION_REVIEW_REQUESTED'
  | 'OPERATION_EXECUTION_COMPLETED'
  | 'OPERATION_FOLLOW_UP_REQUIRED'
  | 'OPERATION_EXECUTION_CANCELLED'
  | 'INVOICE_DRAFT_CREATED'
  | 'INVOICE_DRAFT_UPDATED'
  | 'INVOICE_DRAFT_APPROVED'
  | 'INVOICE_DRAFT_REJECTED'
  | 'INVOICE_PDF_CREATED'
  | 'RECEIVABLE_CREATED'
  | 'INVOICE_SENT'
  | 'INVOICE_SEND_FAILED'
  | 'INVOICE_EMAIL_DRAFT_CREATED'
  | 'INVOICE_PAID'
  | 'PAYMENT_RECORDED'
  | 'PAYMENT_UPDATED'
  | 'RECEIVABLE_STATUS_CHANGED'
  | 'RECEIVABLE_OVERDUE'
  | 'PAYMENT_REMINDER_DRAFT_CREATED'
  | 'PAYMENT_REMINDER_SENT'
  | 'PAYMENT_REMINDER_FAILED'
  | 'CASE_REMINDER_CREATED'
  | 'CASE_REMINDER_DUE'
  | 'CASE_REMINDER_COMPLETED'
  | 'AUTOMATION_POLICY_CREATED'
  | 'AUTOMATION_POLICY_UPDATED'
  | 'AUTOMATION_ENABLED'
  | 'AUTOMATION_DISABLED'
  | 'AUTOMATION_EXECUTION_STARTED'
  | 'AUTOMATION_EXECUTION_COMPLETED'
  | 'AUTOMATION_EXECUTION_FAILED'
  | 'AUTOMATION_EXECUTION_REVERTED'
  | 'AUTOMATION_DRY_RUN_COMPLETED'
  | 'AUTOMATION_EXECUTION_BLOCKED'
  | 'AUTOMATION_ROLLBACK_COMPLETED'
  | 'AUTOMATION_RECOMMENDATION_CREATED';

export type WorkflowEventStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type WorkflowEventConfidence = 'low' | 'medium' | 'high';

export interface WorkflowEvent<T = any> {
  id: string;
  timestamp: string;
  source: string;
  type: WorkflowEventType;
  payload: T;
  status: WorkflowEventStatus;
  approved?: boolean;
  rejected?: boolean;
  corrected?: boolean;
  userAction?: string;
  confidence?: WorkflowEventConfidence;
  caseId?: string;
}

export type SuggestionPriority = 'low' | 'medium' | 'high';

export interface WorkflowSuggestion {
  id: string;
  eventId: string;
  title: string;
  description: string;
  priority: SuggestionPriority;
  confidence: WorkflowEventConfidence;
  category: string;
  actions: { label: string; actionType: string; data?: any }[];
}

export interface WorkflowAction {
  id: string;
  type: string;
  execute: (context: WorkflowContext) => Promise<WorkflowResult>;
}

export interface WorkflowContext {
  event: WorkflowEvent;
  state: any;
}

export interface WorkflowResult {
  success: boolean;
  message?: string;
  data?: any;
}

class WorkflowEngine extends EventEmitter {
  private events: WorkflowEvent[] = [];

  emitEvent<T>(
    type: WorkflowEventType,
    source: string,
    payload: T,
    confidence: WorkflowEventConfidence = 'high'
  ): WorkflowEvent<T> {
    const event: WorkflowEvent<T> = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source,
      type,
      payload,
      status: 'pending',
      confidence,
    };

    this.events.push(event);
    this.emit('event', event);
    this.emit(type, event);

    return event;
  }

  getEvents(): WorkflowEvent[] {
    return [...this.events];
  }

  subscribe(typeOrListener: WorkflowEventType | 'event' | ((event: WorkflowEvent) => void), listener?: (event: WorkflowEvent) => void) {
    if (typeof typeOrListener === 'function') {
      const fn = typeOrListener;
      this.on('event', fn);
      return () => this.off('event', fn);
    } else if (listener) {
      const type = typeOrListener;
      this.on(type, listener);
      return () => this.off(type, listener);
    }
    return () => {};
  }

  updateEventStatus(id: string, updates: Partial<WorkflowEvent>) {
    const index = this.events.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.events[index] = { ...this.events[index], ...updates };
      this.emit('eventUpdated', this.events[index]);
    }
  }
}

export const workflowEngine = new WorkflowEngine();
