import {
  WorkflowException,
  WorkflowExceptionAction,
  WorkflowExceptionCategory,
  WorkflowExceptionSeverity,
  WorkflowExceptionSourceType,
  WorkflowExceptionStatus,
  WorkflowExceptionActionType,
} from './types';
import { caseService, Case } from './case-service';
import { automationService } from './automation-service';
import { learningService } from './learning-service';
import { workflowEngine } from './workflow-engine';
import { crmLookupService } from './crm-lookup-service';
import { emailTriageService } from './email-triage-service';
import { receivableService } from './receivable-service';

const STORAGE_KEY = 'vienna_workflow_exceptions';

function sanitizeText(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9\-._~+/]+=*/g, '[TOKEN_REDACTED]')
    .replace(/password\s*=\s*['"][^'"]+['"]/gi, 'password=[REDACTED]')
    .replace(/data:application\/pdf;base64,[A-Za-z0-9+/=]+/gi, '[PDF_DATA_REDACTED]')
    .replace(/AT\d{18}/g, 'AT[IBAN_REDACTED]');
}

export class WorkflowExceptionService {
  private exceptions: WorkflowException[] = [];
  private resolvingLocks: Set<string> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.exceptions = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load workflow exceptions from localStorage', e);
      this.exceptions = [];
    }
  }

  private saveState(): void {
    if (typeof window === 'undefined') return;
    if (this.exceptions.length > 50) {
      const openEx = this.exceptions.filter(e => e.status !== 'resolved');
      const resolvedEx = this.exceptions.filter(e => e.status === 'resolved').slice(-20);
      this.exceptions = [...openEx, ...resolvedEx];
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.exceptions));
    } catch (e: any) {
      if (e?.name === 'QuotaExceededError' || e?.code === 22 || String(e).includes('quota') || String(e?.message).includes('quota')) {
        try {
          const openEx = this.exceptions.filter(e => e.status !== 'resolved');
          const resolvedEx = this.exceptions.filter(e => e.status === 'resolved').slice(-5);
          this.exceptions = [...openEx, ...resolvedEx];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.exceptions));
        } catch (retryErr) {
          console.warn('LocalStorage quota limit reached for workflow exceptions, operating in-memory.');
        }
      } else {
        console.warn('Failed to save workflow exceptions to localStorage', e?.message || e);
      }
    }
  }

  public resetForTesting(): void {
    this.exceptions = [];
    this.resolvingLocks.clear();
    this.saveState();
  }

  public getExceptions(filter?: {
    caseId?: string;
    status?: WorkflowExceptionStatus;
    category?: WorkflowExceptionCategory;
    severity?: WorkflowExceptionSeverity;
    sourceType?: WorkflowExceptionSourceType;
  }): WorkflowException[] {
    this.syncExceptions();
    let result = [...this.exceptions];

    if (filter) {
      if (filter.caseId) result = result.filter(e => e.caseId === filter.caseId);
      if (filter.status) result = result.filter(e => e.status === filter.status);
      if (filter.category) result = result.filter(e => e.category === filter.category);
      if (filter.severity) result = result.filter(e => e.severity === filter.severity);
      if (filter.sourceType) result = result.filter(e => e.sourceType === filter.sourceType);
    }

    return result.sort((a, b) => this.calculateExceptionPriority(b) - this.calculateExceptionPriority(a));
  }

  public getExceptionById(id: string): WorkflowException | undefined {
    return this.exceptions.find(e => e.id === id);
  }

  public createException(
    payload: Omit<WorkflowException, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: WorkflowExceptionStatus;
    }
  ): WorkflowException {
    return this.upsertException(payload);
  }

  public getOpenExceptions(): WorkflowException[] {
    return this.getExceptions({ status: 'open' });
  }

  /**
   * Deterministic priority calculation
   */
  public calculateExceptionPriority(exception: WorkflowException): number {
    let score = 0;

    // Severity score
    switch (exception.severity) {
      case 'critical':
        score += 1000;
        break;
      case 'warning':
        score += 500;
        break;
      case 'info':
        score += 100;
        break;
    }

    // Category score
    switch (exception.category) {
      case 'reconciliation_required':
      case 'external_service_error':
        score += 400;
        break;
      case 'ambiguous_match':
      case 'data_conflict':
      case 'automation_failed':
        score += 300;
        break;
      case 'automation_blocked':
      case 'manual_approval_required':
        score += 200;
        break;
      case 'missing_information':
      case 'overdue_action':
        score += 150;
        break;
      default:
        score += 50;
        break;
    }

    // Financial impact
    if (exception.metadata && typeof exception.metadata.amount === 'number') {
      const amt = exception.metadata.amount;
      if (amt > 1000) score += 200;
      else if (amt > 0) score += 100;
    }

    // Due / Overdue
    const text = (exception.title + ' ' + exception.description + ' ' + exception.blockingReason).toLowerCase();
    if (text.includes('überfällig') || text.includes('dringend') || exception.metadata?.isOverdue) {
      score += 250;
    }

    // Case blocked / Customer waiting
    if (exception.caseId) {
      score += 150;
    }

    // Policy paused
    if (text.includes('pausiert') || exception.category === 'automation_failed') {
      score += 200;
    }

    return score;
  }

  /**
   * Create or update an exception with strict deduplication
   */
  public upsertException(
    payload: Omit<WorkflowException, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: WorkflowExceptionStatus;
    }
  ): WorkflowException {
    const caseId = payload.caseId;
    const sourceType = payload.sourceType;
    const sourceRef = payload.sourceReferenceId;
    const category = payload.category;

    // Sanitization
    const title = sanitizeText(payload.title);
    const description = sanitizeText(payload.description);
    const blockingReason = sanitizeText(payload.blockingReason);
    const recommendedAction = sanitizeText(payload.recommendedAction);

    // Deduplication key matching open/in_review exception
    const existing = this.exceptions.find(
      e =>
        e.caseId === caseId &&
        e.sourceType === sourceType &&
        e.sourceReferenceId === sourceRef &&
        e.category === category &&
        (e.status === 'open' || e.status === 'in_review')
    );

    const now = new Date().toISOString();

    if (existing) {
      const hasChanged =
        existing.title !== title ||
        existing.description !== description ||
        existing.blockingReason !== blockingReason ||
        existing.recommendedAction !== recommendedAction ||
        existing.severity !== payload.severity ||
        (payload.status && existing.status !== payload.status);

      if (hasChanged) {
        existing.title = title;
        existing.description = description;
        existing.blockingReason = blockingReason;
        existing.recommendedAction = recommendedAction;
        existing.severity = payload.severity;
        existing.availableActions = payload.availableActions;
        existing.metadata = payload.metadata ? { ...existing.metadata, ...payload.metadata } : existing.metadata;
        existing.updatedAt = now;
        if (payload.status) existing.status = payload.status;
        this.syncCaseExceptions(existing);
        this.saveState();
      }
      return existing;
    }

    const newException: WorkflowException = {
      id: `exc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      caseId: payload.caseId,
      sourceType: payload.sourceType,
      sourceReferenceId: payload.sourceReferenceId,
      category: payload.category,
      severity: payload.severity,
      title,
      description,
      blockingReason,
      recommendedAction,
      availableActions: payload.availableActions,
      status: payload.status || 'open',
      createdAt: now,
      updatedAt: now,
      taskId: payload.taskId,
      metadata: payload.metadata,
    };

    this.exceptions.push(newException);
    this.syncCaseExceptions(newException);

    // Emit workflow event
    workflowEngine.emitEvent(
      'WORKFLOW_EXCEPTION_CREATED',
      'workflow-exception-service',
      { exceptionId: newException.id, caseId: newException.caseId, category: newException.category },
      'high'
    );

    this.saveState();
    return newException;
  }

  private syncCaseExceptions(exception: WorkflowException): void {
    if (!exception.caseId) return;
    const caseItem = caseService.getCase(exception.caseId);
    if (caseItem) {
      if (!caseItem.workflowExceptions) caseItem.workflowExceptions = [];
      const idx = caseItem.workflowExceptions.findIndex(e => e.id === exception.id);
      if (idx >= 0) {
        caseItem.workflowExceptions[idx] = exception;
      } else {
        caseItem.workflowExceptions.push(exception);
      }
      caseService.saveCase(caseItem);
    }
  }

  /**
   * Scans system components and synchronizes exceptions automatically
   */
  public syncExceptions(): void {
    const cases = caseService.getCases();

    for (const c of cases) {
      // 1. CRM Ambiguous Match
      if (c.customerMatchReview && (c.customerMatchReview.status === 'pending' || c.customerMatchReview.status === 'update_pending' || (c.customerMatchReview as any).status === 'conflict' || c.customerMatchReview.matchType === 'multiple')) {
        this.upsertException({
          caseId: c.id,
          sourceType: 'crm',
          sourceReferenceId: c.customerMatchReview.id || c.id,
          category: 'ambiguous_match',
          severity: 'warning',
          title: 'Mehrdeutige Kundenzuordnung',
          description: `Für den Vorgang ${c.id} existieren mehrere mögliche CRM-Kundeneinträge.`,
          blockingReason: 'Automatische Zuordnung gestoppt – manuelle Auswahl erforderlich.',
          recommendedAction: 'Kunden manuell auswählen oder neuen Kunden anlegen.',
          availableActions: [
            { id: 'act_select_cust', type: 'select_customer', label: 'Kunden auswählen', safe: true, requiresConfirmation: false },
            { id: 'act_open_case', type: 'open_case', label: 'Vorgang öffnen', safe: true, requiresConfirmation: false },
          ],
        });
      } else if (c.customerMatchReview && c.customerMatchReview.status === 'confirmed') {
        // Resolve matching CRM exception if open
        const existingCrm = this.exceptions.find(
          e => e.caseId === c.id && e.sourceType === 'crm' && e.category === 'ambiguous_match' && e.status === 'open'
        );
        if (existingCrm) {
          existingCrm.status = 'resolved';
          existingCrm.resolvedAt = new Date().toISOString();
          existingCrm.resolvedBy = 'System Sync';
        }
      }

      // 2. Email Triage High Risk / Complaint / Multiple Matches
      if (c.emailTriageRecords && c.emailTriageRecords.length > 0) {
        for (const tr of c.emailTriageRecords) {
          if (tr.analysis?.isHighRisk || tr.analysis?.category === 'complaint') {
            this.upsertException({
              caseId: c.id,
              sourceType: 'email_triage',
              sourceReferenceId: tr.id,
              category: 'manual_approval_required',
              severity: 'critical',
              title: 'Beschwerde oder hohes Risiko erkannt',
              description: `E-Mail von ${tr.senderEmail} enthält Beschwerde- oder Haftungssignale.`,
              blockingReason: 'Automatische Antwort gestoppt – individuelle Prüfung erforderlich.',
              recommendedAction: 'E-Mail und Entwurf manuell prüfen.',
              availableActions: [
                { id: 'act_prep_email', type: 'prepare_email', label: 'E-Mail-Entwurf prüfen', safe: true, requiresConfirmation: false },
                { id: 'act_open_case', type: 'open_case', label: 'Vorgang öffnen', safe: true, requiresConfirmation: false },
              ],
            });
          }
        }
      }

      // 3. Receivables Disputed / Overdue
      if (c.receivables && c.receivables.length > 0) {
        for (const rec of c.receivables) {
          if (rec.status === 'disputed') {
            this.upsertException({
              caseId: c.id,
              sourceType: 'receivable',
              sourceReferenceId: rec.id,
              category: 'data_conflict',
              severity: 'warning',
              title: `Forderung ${rec.invoiceNumber} ist strittig`,
              description: `Kunde hat der Rechnung ${rec.invoiceNumber} widersprochen.`,
              blockingReason: 'Mahnwesen und automatische Zahlungserinnerungen sind gesperrt.',
              recommendedAction: 'Klärung mit Kunde veranlassen.',
              availableActions: [
                { id: 'act_open_case', type: 'open_case', label: 'Vorgang öffnen', safe: true, requiresConfirmation: false },
                { id: 'act_mark_resolved', type: 'mark_resolved', label: 'Klärung abschließen', safe: true, requiresConfirmation: true },
              ],
              metadata: { amount: rec.outstandingAmount },
            });
          }
        }
      }
    }

    // 4. Automation Failed / Blocked Executions
    const executions = automationService.getExecutions();
    for (const exec of executions) {
      if (exec.status === 'failed' || exec.status === 'blocked') {
        const isFailed = exec.status === 'failed';
        this.upsertException({
          caseId: exec.caseId,
          sourceType: 'automation',
          sourceReferenceId: exec.id,
          category: isFailed ? 'automation_failed' : 'automation_blocked',
          severity: isFailed ? 'critical' : 'warning',
          title: `Automatisierung ${exec.actionType} ${isFailed ? 'fehlgeschlagen' : 'blockiert'}`,
          description: exec.errorMessage || `Aktion ${exec.actionType} konnte nicht ausgeführt werden.`,
          blockingReason: exec.errorMessage || 'Sicherheits- oder Vertrauensgrenze unterschritten.',
          recommendedAction: exec.reversible ? 'Ausführung prüfen oder Rollback durchführen.' : 'Manuell bearbeiten.',
          availableActions: [
            ...(exec.reversible
              ? [{ id: 'act_rollback', type: 'rollback' as const, label: 'Rollback durchführen', safe: true, requiresConfirmation: true, referenceId: exec.id }]
              : []),
            { id: 'act_disable_pol', type: 'disable_policy', label: 'Policy deaktivieren', safe: true, requiresConfirmation: false, referenceId: exec.policyId },
            { id: 'act_dismiss', type: 'dismiss', label: 'Verwerfen', safe: true, requiresConfirmation: false },
          ],
        });
      }
    }

    this.saveState();
  }

  public deleteException(exceptionId: string): boolean {
    const index = this.exceptions.findIndex(e => e.id === exceptionId);
    if (index !== -1) {
      this.exceptions.splice(index, 1);
      this.saveState();
      return true;
    }
    return false;
  }

  /**
   * Resolve an exception safely with full validation and domain execution
   */
  public resolveException(
    exceptionId: string,
    actionId: string,
    user: string = 'System/User'
  ): { success: boolean; message: string; exception?: WorkflowException } {
    // Reload state first to prevent stale state / duplicate resolution
    this.loadState();
    const exception = this.getExceptionById(exceptionId);

    if (!exception) {
      return { success: false, message: `Ausnahme ${exceptionId} nicht gefunden.` };
    }

    if (exception.status === 'resolved' || exception.status === 'dismissed' || exception.status === 'cancelled') {
      return { success: false, message: `Ausnahme ${exceptionId} ist bereits ${exception.status}.` };
    }

    // Lock guard against double-clicks
    const lockKey = `${exceptionId}_${actionId}`;
    if (this.resolvingLocks.has(lockKey)) {
      return { success: false, message: 'Aktion wird bereits ausgeführt.' };
    }
    this.resolvingLocks.add(lockKey);

    try {
      const action = exception.availableActions.find(a => a.id === actionId);
      if (!action) {
        this.resolvingLocks.delete(lockKey);
        return { success: false, message: `Aktion ${actionId} nicht in verfügbaren Aktionen der Ausnahme.` };
      }

      // Execute domain logic based on action type
      let domainResultSuccess = true;
      let domainMessage = 'Aktion erfolgreich ausgeführt.';

      switch (action.type) {
        case 'select_customer': {
          if (exception.caseId && action.referenceId) {
            const caseItem = caseService.getCase(exception.caseId);
            if (caseItem && caseItem.customerMatchReview) {
              caseItem.customerId = action.referenceId;
              caseItem.customerMatchReview.status = 'confirmed';
              caseService.saveCase(caseItem);
            }
          }
          break;
        }

        case 'rollback': {
          if (action.referenceId) {
            automationService.rollbackExecution(action.referenceId, user);
            domainResultSuccess = true;
            domainMessage = 'Aktion wurde erfolgreich zurückgenommen.';
          }
          break;
        }

        case 'disable_policy': {
          if (action.referenceId) {
            const dis = automationService.userDisablePolicy(action.referenceId);
            domainResultSuccess = dis.success;
            domainMessage = dis.message;
          }
          break;
        }

        case 'retry': {
          if (!action.safe) {
            this.resolvingLocks.delete(lockKey);
            return {
              success: false,
              message: 'Blindes Retry für unsichere oder unklare externe Aktionen nicht erlaubt. Bitte Reconciliation durchführen.',
            };
          }
          // Safe retry logic
          domainMessage = 'Sicherer Retry wurde veranlasst.';
          break;
        }

        case 'dismiss': {
          exception.status = 'dismissed';
          domainMessage = 'Ausnahme verworfen.';
          break;
        }

        case 'mark_resolved':
        case 'approve':
        case 'reject':
        case 'open_case':
        case 'open_customer':
        case 'edit_data':
        case 'request_information':
        case 'prepare_email':
        default: {
          domainMessage = `Aktion ${action.label} ausgeführt.`;
          break;
        }
      }

      if (!domainResultSuccess) {
        this.resolvingLocks.delete(lockKey);
        return { success: false, message: `Domänenaktion fehlgeschlagen: ${domainMessage}` };
      }

      const now = new Date().toISOString();
      if (action.type === 'dismiss') {
        exception.status = 'dismissed';
      } else {
        exception.status = 'resolved';
      }
      exception.resolvedAt = now;
      exception.resolvedBy = user;
      exception.updatedAt = now;

      // Update Case exceptions & closed linked task
      if (exception.caseId) {
        const caseItem = caseService.getCase(exception.caseId);
        if (caseItem) {
          // Sync exception in caseItem
          if (caseItem.workflowExceptions) {
            const idx = caseItem.workflowExceptions.findIndex(e => e.id === exception.id);
            if (idx >= 0) caseItem.workflowExceptions[idx] = exception;
          }

          // Close matching task if exception resolved
          if (exception.taskId) {
            const t = caseItem.tasks?.find(tk => tk.id === exception.taskId);
            if (t) t.status = 'Completed';
          }

          // Recalculate case health
          caseService.evaluateCaseHealth(caseItem);
          caseService.saveCase(caseItem);
        }
      }

      // Record Learning Record
      learningService.recordLearningRecord({
        id: `lr_exc_${Date.now()}`,
        actionType: `RESOLVE_EXCEPTION_${exception.category.toUpperCase()}`,
        contextType: exception.sourceType,
        contextSignature: `src=${exception.sourceType}|cat=${exception.category}|act=${action.type}`,
        finalDecision: action.type,
        result: (action.type !== 'reject' && action.type !== 'dismiss') ? 'accepted' : 'rejected',
        confidence: 'high',
        createdAt: now,
        userId: user,
      });

      // Emit workflow event
      workflowEngine.emitEvent(
        exception.status === 'dismissed' ? 'WORKFLOW_EXCEPTION_DISMISSED' : 'WORKFLOW_EXCEPTION_RESOLVED',
        'workflow-exception-service',
        { exceptionId: exception.id, caseId: exception.caseId, actionType: action.type, user },
        'high'
      );

      this.saveState();
      this.resolvingLocks.delete(lockKey);

      return {
        success: true,
        message: domainMessage,
        exception,
      };
    } catch (err: any) {
      this.resolvingLocks.delete(lockKey);
      return { success: false, message: `Fehler bei Auflösung der Ausnahme: ${err.message || String(err)}` };
    }
  }
}

export const workflowExceptionService = new WorkflowExceptionService();
