import {
  AutomationLevel,
  AutomationPolicy,
  AutomationExecution,
  EmailResponseDraft,
  SafeAutomationActionType,
  AutomationMode
} from './types';
import {
  learningService,
  CRITICAL_ACTION_TYPES,
  generateContextSignature,
  evaluateAutomationEligibility
} from './learning-service';
import { workflowEngine, WorkflowAction, WorkflowContext, WorkflowResult } from './workflow-engine';
import { validateEmailResponseDraft } from './email-draft-validator';
import { sendOutlookMessage, OutlookSendRequestAttachment } from './outlook-service';
import { documentService } from './document-service';
import { caseService, Case } from './case-service';
import { emailDraftService } from './email-draft-service';
import { invoiceDraftService } from './invoice-draft-service';
import { receivableService } from './receivable-service';

export interface ExecuteEmailDraftResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryAfter?: number;
}

const POLICIES_STORAGE_KEY = 'vienna_automation_policies';
const EXECUTIONS_STORAGE_KEY = 'vienna_automation_executions';

export function getCanonicalActionType(actionType: string): string {
  const map: Record<string, string> = {
    'email_triage': 'EMAIL_TRIAGE',
    'case_assignment_by_conversation': 'LINK_EMAIL_TO_CASE',
    'link_email_to_case': 'LINK_EMAIL_TO_CASE',
    'outlook_deduplication': 'DEDUPLICATE_EMAIL_EVENT',
    'deduplicate_email_event': 'DEDUPLICATE_EMAIL_EVENT',
    'create_review_task': 'CREATE_INTERNAL_TASK',
    'create_internal_task': 'CREATE_INTERNAL_TASK',
    'update_reminder_due_status': 'MARK_REMINDER_DUE',
    'mark_reminder_due': 'MARK_REMINDER_DUE',
    'recalculate_readiness': 'RECALCULATE_READINESS',
    'recalculate_case_health': 'RECALCULATE_CASE_HEALTH',
    'create_timeline_entry': 'CREATE_INTERNAL_TIMELINE_ENTRY',
    'create_internal_timeline_entry': 'CREATE_INTERNAL_TIMELINE_ENTRY',
    'prepare_email_draft': 'PREPARE_EMAIL_DRAFT',
    'prepare_offer_draft': 'PREPARE_OFFER_DRAFT',
    'prepare_invoice_draft': 'PREPARE_INVOICE_DRAFT',
    'prepare_document_draft': 'PREPARE_PAYMENT_REMINDER_DRAFT',
    'prepare_payment_reminder_draft': 'PREPARE_PAYMENT_REMINDER_DRAFT'
  };
  const key = (actionType || '').toLowerCase();
  return map[key] || actionType.toUpperCase();
}

export function sanitizeAuditData(obj?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!obj) return undefined;
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    const k = key.toLowerCase();
    if (k.includes('body') || k.includes('pdf') || k.includes('token') || k.includes('base64') || k.includes('password') || k.includes('secret')) {
      sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
    } else if (typeof val === 'string' && val.length > 500) {
      sanitized[key] = val.substring(0, 100) + '... [TRUNCATED]';
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      sanitized[key] = sanitizeAuditData(val as Record<string, unknown>);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const INITIAL_LOW_RISK_ACTIONS = [
  { actionType: 'EMAIL_TRIAGE', legacyAlias: 'email_triage', name: 'Automatische E-Mail-Triage & Entwurfsvorbereitung' },
  { actionType: 'LINK_EMAIL_TO_CASE', legacyAlias: 'case_assignment_by_conversation', name: 'E-Mail-Zuordnung (conversationId)' },
  { actionType: 'DEDUPLICATE_EMAIL_EVENT', legacyAlias: 'outlook_deduplication', name: 'Outlook-Nachrichten Deduplizierung' },
  { actionType: 'CREATE_INTERNAL_TASK', legacyAlias: 'create_review_task', name: 'Erzeugung interner Tasks' },
  { actionType: 'MARK_REMINDER_DUE', legacyAlias: 'update_reminder_due_status', name: 'Aktualisierung Reminder-Status auf due' },
  { actionType: 'RECALCULATE_READINESS', legacyAlias: 'recalculate_readiness', name: 'Readiness-Neuberechnung' },
  { actionType: 'RECALCULATE_CASE_HEALTH', legacyAlias: 'recalculate_case_health', name: 'Case Health Neuberechnung' },
  { actionType: 'CREATE_INTERNAL_TIMELINE_ENTRY', legacyAlias: 'create_timeline_entry', name: 'Erzeugung interner Timeline-Einträge' },
  { actionType: 'PREPARE_EMAIL_DRAFT', legacyAlias: 'prepare_email_draft', name: 'Vorbereitung E-Mail-Drafts (ohne Versand)' },
  { actionType: 'PREPARE_OFFER_DRAFT', legacyAlias: 'prepare_offer_draft', name: 'Vorbereitung Angebotsentwurf (ohne Freigabe)' },
  { actionType: 'PREPARE_INVOICE_DRAFT', legacyAlias: 'prepare_invoice_draft', name: 'Vorbereitung Rechnungsentwurf (ohne Freigabe)' },
  { actionType: 'PREPARE_PAYMENT_REMINDER_DRAFT', legacyAlias: 'prepare_document_draft', name: 'Vorbereitung Zahlungserinnerungs-Draft' }
];

export const ALLOWED_PILOT_ACTIONS = INITIAL_LOW_RISK_ACTIONS.map(a => a.actionType);

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  policy?: AutomationPolicy;
  mode: AutomationMode;
}

export class AutomationService {
  private policies: AutomationPolicy[] = [];
  private executions: AutomationExecution[] = [];
  private activeLocks = new Set<string>();

  constructor() {
    this.loadState();
    this.initDefaultPolicies();
  }

  private loadState() {
    if (typeof localStorage !== 'undefined') {
      try {
        const savedPolicies = localStorage.getItem(POLICIES_STORAGE_KEY);
        if (savedPolicies) {
          this.policies = JSON.parse(savedPolicies);
        }
        const savedExecutions = localStorage.getItem(EXECUTIONS_STORAGE_KEY);
        if (savedExecutions) {
          this.executions = JSON.parse(savedExecutions);
        }
      } catch (e) {
        console.error('Failed to load automation state:', e);
      }
    }
  }

  private saveState() {
    if (typeof localStorage !== 'undefined') {
      if (this.executions.length > 80) {
        this.executions = this.executions.slice(-80);
      }
      try {
        localStorage.setItem(POLICIES_STORAGE_KEY, JSON.stringify(this.policies));
        localStorage.setItem(EXECUTIONS_STORAGE_KEY, JSON.stringify(this.executions));
      } catch (e: any) {
        if (e?.name === 'QuotaExceededError' || e?.code === 22 || String(e).includes('quota') || String(e?.message).includes('quota')) {
          try {
            this.executions = this.executions.slice(-20);
            localStorage.setItem(POLICIES_STORAGE_KEY, JSON.stringify(this.policies));
            localStorage.setItem(EXECUTIONS_STORAGE_KEY, JSON.stringify(this.executions));
          } catch (retryErr) {
            console.warn('LocalStorage quota limit reached for automation state, operating in-memory.');
          }
        } else {
          console.warn('Failed to save automation state:', e?.message || e);
        }
      }
    }
  }

  private initDefaultPolicies() {
    const now = new Date().toISOString();
    for (const item of INITIAL_LOW_RISK_ACTIONS) {
      // Ensure default policy exists for canonical actionType as well as legacy alias
      const canonical = getCanonicalActionType(item.actionType);
      if (!this.policies.find(p => p.actionType === canonical || p.actionType === item.actionType || p.actionType === item.legacyAlias)) {
        const policy: AutomationPolicy = {
          id: `pol_${canonical}`,
          actionType: canonical,
          level: 'prepare',
          enabled: false, // Default: DISABLED until explicit user activation
          mode: 'dry_run', // Default: START IN DRY RUN MODE
          minimumConfidence: 0.8,
          minimumSamples: 10,
          requiredApprovalRate: 0.95,
          failureRateLimit: 0.02,
          reversibleOnly: true,
          createdAt: now,
          updatedAt: now
        };
        this.policies.push(policy);
        workflowEngine.emitEvent('AUTOMATION_POLICY_CREATED', 'AutomationService', { policyId: policy.id, actionType: canonical });
      }
    }
    this.saveState();
  }

  getPolicies(): AutomationPolicy[] {
    return [...this.policies];
  }

  getPolicy(actionType: string): AutomationPolicy | undefined {
    const canonical = getCanonicalActionType(actionType);
    return this.policies.find(p => p.actionType === canonical || p.actionType === actionType);
  }

  getExecutions(): AutomationExecution[] {
    return [...this.executions];
  }

  getExecutionsForCase(caseId: string): AutomationExecution[] {
    return this.executions.filter(e => e.caseId === caseId);
  }

  validateAutomationExecution(
    actionType: string,
    context: Record<string, unknown> = {}
  ): ValidationResult {
    const canonical = getCanonicalActionType(actionType);

    // 1. Mandatory Security Rule Check
    if (CRITICAL_ACTION_TYPES.has(canonical) || CRITICAL_ACTION_TYPES.has(actionType)) {
      return {
        allowed: false,
        reason: 'Sicherheitsregel: Kritische Aktionen (z.B. Versand, Buchung, Löschen) dürfen nicht automatisiert werden.',
        mode: 'dry_run'
      };
    }

    // 2. Policy existence and enabled check
    const policy = this.getPolicy(canonical) || this.getPolicy(actionType);
    if (!policy) {
      return { allowed: false, reason: 'Keine Policy für diese Aktion vorhanden.', mode: 'dry_run' };
    }

    const mode = policy.mode || 'dry_run';

    if (!policy.enabled) {
      return { allowed: false, reason: 'Automatisierung für diese Aktion ist deaktiviert.', policy, mode };
    }

    if (policy.level !== 'auto_execute_reversible' && policy.level !== 'auto_execute') {
      return { allowed: false, reason: `Policy-Stufe "${policy.level}" erlaubt keine automatische Ausführung.`, policy, mode };
    }

    // 3. Current transaction input checks (Confidence & Conflicts)
    if (context.confidence === 'low' || context.confidence === 'medium') {
      return { allowed: false, reason: `Confidence zu niedrig ("${context.confidence}").`, policy, mode };
    }

    if (context.hasDataConflict === true) {
      return { allowed: false, reason: 'Widersprüchliche Daten vorhanden.', policy, mode };
    }

    // 4. Learning criteria check
    let stats = learningService.getStatisticsForAction(canonical, policy.contextSignature);
    if (stats.totalDecisions < policy.minimumSamples) {
      stats = learningService.getStatisticsForAction(canonical);
    }
    if (stats.totalDecisions < policy.minimumSamples) {
      stats = learningService.getStatisticsForAction(actionType);
    }

    if (stats.totalDecisions < policy.minimumSamples) {
      return {
        allowed: false,
        reason: `Unzureichende Lern-Stichproben (${stats.totalDecisions}/${policy.minimumSamples}).`,
        policy,
        mode
      };
    }

    if (stats.approvalRate < policy.requiredApprovalRate) {
      return {
        allowed: false,
        reason: `Bestätigungsquote (${(stats.approvalRate * 100).toFixed(1)}%) unter Grenzwert (${(policy.requiredApprovalRate * 100)}%).`,
        policy,
        mode
      };
    }

    if (stats.failureRate > policy.failureRateLimit) {
      return {
        allowed: false,
        reason: `Fehlerquote (${(stats.failureRate * 100).toFixed(1)}%) überschreitet Grenzwert (${(policy.failureRateLimit * 100)}%).`,
        policy,
        mode
      };
    }

    return { allowed: true, policy, mode };
  }

  recordExecution(exec: AutomationExecution): void {
    const existingIdx = this.executions.findIndex(e => e.id === exec.id);
    if (existingIdx !== -1) {
      this.executions[existingIdx] = exec;
    } else {
      this.executions.push(exec);
    }
    this.saveState();
  }

  canAutoExecute(
    actionType: string,
    context: Record<string, unknown> = {}
  ): { allowed: boolean; reason?: string; policy?: AutomationPolicy } {
    const val = this.validateAutomationExecution(actionType, context);
    return { allowed: val.allowed, reason: val.reason, policy: val.policy };
  }

  async executeAutomatedAction(
    actionType: string,
    caseId?: string,
    inputReference?: string,
    context: Record<string, unknown> = {},
    actionFn?: () => Promise<{ success: boolean; outputReference?: string; rollbackData?: Record<string, unknown>; error?: string }>
  ): Promise<AutomationExecution> {
    const canonical = getCanonicalActionType(actionType);
    const lockKey = `${canonical}:${caseId || 'global'}:${inputReference || ''}`;

    // Idempotency check 1: Active lock
    if (this.activeLocks.has(lockKey)) {
      console.log(`AutomationService: Lock active for ${lockKey}, skipping duplicate execution.`);
      const existing = this.executions.find(e =>
        (e.actionType === canonical || e.actionType === actionType) &&
        e.caseId === caseId &&
        e.inputReference === inputReference &&
        (e.status === 'running' || e.status === 'completed' || e.status === 'dry_run')
      );
      if (existing) return existing;
    }

    // Idempotency check 2: Already completed or dry_run execution
    const completedExisting = this.executions.find(e =>
      (e.actionType === canonical || e.actionType === actionType) &&
      e.caseId === caseId &&
      e.inputReference === inputReference &&
      (e.status === 'completed' || e.status === 'dry_run')
    );
    if (completedExisting) {
      console.log(`AutomationService: Execution already completed for ${lockKey}.`);
      return completedExisting;
    }

    this.activeLocks.add(lockKey);

    const validation = this.validateAutomationExecution(actionType, context);
    const now = new Date().toISOString();
    const policy = validation.policy;

    if (!validation.allowed || !policy) {
      const blockedExecution: AutomationExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        caseId,
        actionType: canonical,
        policyId: policy?.id || 'none',
        mode: validation.mode,
        status: 'blocked',
        inputReference,
        reversible: true,
        confidence: String(context.confidence || 'high'),
        contextSignature: policy?.contextSignature || generateContextSignature(canonical, context),
        startedAt: now,
        completedAt: now,
        errorMessage: validation.reason
      };
      this.executions.push(blockedExecution);
      this.saveState();
      this.activeLocks.delete(lockKey);

      workflowEngine.emitEvent('AUTOMATION_EXECUTION_BLOCKED', 'AutomationService', {
        executionId: blockedExecution.id,
        actionType: canonical,
        caseId,
        reason: validation.reason
      });

      return blockedExecution;
    }

    // DRY RUN MODE handling: Do NOT modify domain state
    if (validation.mode === 'dry_run') {
      const dryRunExecution: AutomationExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        caseId,
        actionType: canonical,
        policyId: policy.id,
        mode: 'dry_run',
        status: 'dry_run',
        inputReference,
        outputReference: 'simulated_dry_run_output',
        reversible: true,
        confidence: String(context.confidence || 'high'),
        contextSignature: policy.contextSignature || generateContextSignature(canonical, context),
        startedAt: now,
        completedAt: now
      };

      this.executions.push(dryRunExecution);
      this.saveState();
      this.activeLocks.delete(lockKey);

      workflowEngine.emitEvent('AUTOMATION_DRY_RUN_COMPLETED', 'AutomationService', {
        executionId: dryRunExecution.id,
        actionType: canonical,
        caseId,
        policyId: policy.id,
        simulated: true
      });

      learningService.recordLearningRecord({
        caseId,
        actionType: canonical,
        contextType: 'automation_dry_run',
        finalDecision: 'executed',
        result: 'executed',
        confidence: (context.confidence as any) || 'high',
        contextSignature: policy.contextSignature || generateContextSignature(canonical, context)
      });

      return dryRunExecution;
    }

    // ACTIVE MODE handling: Execute real domain action
    const execution: AutomationExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      caseId,
      actionType: canonical,
      policyId: policy.id,
      mode: 'active',
      status: 'running',
      inputReference,
      reversible: policy.reversibleOnly,
      confidence: String(context.confidence || 'high'),
      contextSignature: policy.contextSignature || generateContextSignature(canonical, context),
      startedAt: now
    };

    this.executions.push(execution);
    this.saveState();
    workflowEngine.emitEvent('AUTOMATION_EXECUTION_STARTED', 'AutomationService', { executionId: execution.id, actionType: canonical, caseId });

    try {
      let result: {
        success: boolean;
        outputReference?: string;
        rollbackData?: Record<string, unknown>;
        error?: string;
      } = {
        success: true
      };

      if (actionFn) {
        result = await actionFn();
      } else {
        result = await this.performDefaultActionLogic(canonical, caseId, inputReference, context);
      }

      const completedAt = new Date().toISOString();

      if (result.success) {
        execution.status = 'completed';
        execution.completedAt = completedAt;
        execution.outputReference = result.outputReference;
        execution.rollbackData = sanitizeAuditData(result.rollbackData);

        // Record Audit Trail in Case Timeline
        if (caseId) {
          caseService.addTimelineEntry(caseId, {
            type: 'automation_executed',
            category: 'System',
            source: 'AutomationService',
            timestamp: new Date().toISOString(),
            title: 'Automatische Aktion ausgeführt',
            description: `Automatische Aktion "${canonical}" wurde im Rahmen der Policy "${policy.id}" erfolgreich ausgeführt.`
          });
        }

        workflowEngine.emitEvent('AUTOMATION_EXECUTION_COMPLETED', 'AutomationService', {
          executionId: execution.id,
          actionType: canonical,
          caseId,
          outputReference: result.outputReference
        });

        learningService.recordLearningRecord({
          caseId,
          actionType: canonical,
          contextType: 'automation_execution',
          finalDecision: 'executed',
          result: 'executed',
          confidence: 'high',
          contextSignature: policy.contextSignature || generateContextSignature(canonical, context)
        });
      } else {
        execution.status = 'failed';
        execution.completedAt = completedAt;
        execution.errorMessage = result.error || 'Aktion lieferte keinen Erfolg zurück.';

        this.pausePolicy(policy.id, `Automatische Ausführung fehlgeschlagen: ${execution.errorMessage}`, caseId);

        workflowEngine.emitEvent('AUTOMATION_EXECUTION_FAILED', 'AutomationService', {
          executionId: execution.id,
          actionType: canonical,
          caseId,
          error: execution.errorMessage
        });

        learningService.recordLearningRecord({
          caseId,
          actionType: canonical,
          contextType: 'automation_execution_failed',
          finalDecision: 'failed',
          result: 'failed',
          confidence: 'medium',
          contextSignature: policy.contextSignature || generateContextSignature(canonical, context)
        });
      }
    } catch (err: any) {
      execution.status = 'failed';
      execution.completedAt = new Date().toISOString();
      execution.errorMessage = err?.message || String(err);

      this.pausePolicy(policy.id, `Ausnahme bei Ausführung: ${execution.errorMessage}`, caseId);

      workflowEngine.emitEvent('AUTOMATION_EXECUTION_FAILED', 'AutomationService', {
        executionId: execution.id,
        actionType: canonical,
        caseId,
        error: execution.errorMessage
      });

      learningService.recordLearningRecord({
        caseId,
        actionType: canonical,
        contextType: 'automation_execution_error',
        finalDecision: 'failed',
        result: 'failed',
        confidence: 'low',
        contextSignature: policy.contextSignature || generateContextSignature(canonical, context)
      });
    } finally {
      this.activeLocks.delete(lockKey);
      this.saveState();
    }

    return execution;
  }

  private async performDefaultActionLogic(
    actionType: string,
    caseId?: string,
    inputReference?: string,
    context: Record<string, unknown> = {}
  ): Promise<{ success: boolean; outputReference?: string; rollbackData?: Record<string, unknown>; error?: string }> {
    const canonical = getCanonicalActionType(actionType);

    // 1. LINK_EMAIL_TO_CASE
    if (canonical === 'LINK_EMAIL_TO_CASE') {
      const convId = (inputReference || context.conversationId) as string;
      if (!convId) {
        return { success: false, error: 'Fehlende conversationId für E-Mail-Zuordnung.' };
      }

      const allCases = caseService.getCases();
      const openMatches = allCases.filter(c => {
        if (c.status === 'Completed' || c.status === 'Cancelled' || (c.status as string) === 'Archived') return false;
        const ext = c.externalReferences as any;
        const convs: string[] = ext?.outlook?.conversationIds || (Array.isArray(ext) ? ext : []);
        return convs.includes(convId) || (c as any).conversationId === convId || (c.workflowIds && c.workflowIds.includes(convId));
      });

      // Check data conflicts (e.g. conflicting customerId)
      if (context.customerId) {
        const conflictingCustomer = openMatches.some(m => m.customerId && m.customerId !== context.customerId);
        if (conflictingCustomer) {
          if (caseId) {
            caseService.addTask(caseId, {
              title: 'E-Mail-Zuordnung prüfen',
              description: `Mehrdeutigkeit/Widerspruch bei Kundendaten für Conversation "${convId}".`,
              category: 'Review',
              priority: 'high',
              status: 'Open',
              source: 'AutomationService',
              caseId,
              workflowId: `wf_assign_conflict_${convId}`
            });
          }
          return { success: false, error: 'Widersprüchliche Kundenzuordnung vorhanden.' };
        }
      }

      if (openMatches.length > 1) {
        if (caseId) {
          caseService.addTask(caseId, {
            title: 'E-Mail-Zuordnung prüfen',
            description: `Mehrdeutige E-Mail-Zuordnung für Conversation ID "${convId}" (${openMatches.length} Treffer).`,
            category: 'Review',
            priority: 'high',
            status: 'Open',
            source: 'AutomationService',
            caseId,
            workflowId: `wf_assign_review_${convId}`
          });
        }
        return {
          success: false,
          error: `E-Mail-Zuordnung mehrdeutig (${openMatches.length} passende offene Akten). Manueller Review-Task erstellt.`
        };
      }

      let targetCase: Case | undefined;
      if (openMatches.length === 1) {
        targetCase = openMatches[0];
      } else if (caseId) {
        const targetC = caseService.getCase(caseId);
        if (targetC && targetC.status !== 'Completed' && targetC.status !== 'Cancelled' && (targetC.status as string) !== 'Archived') {
          targetCase = targetC;
        }
      }

      if (!targetCase) {
        if (caseId) {
          caseService.addTask(caseId, {
            title: 'E-Mail-Zuordnung prüfen',
            description: `Mehrdeutige E-Mail-Zuordnung für Conversation ID "${convId}" (0 Treffer).`,
            category: 'Review',
            priority: 'high',
            status: 'Open',
            source: 'AutomationService',
            caseId,
            workflowId: `wf_assign_review_${convId}`
          });
        }
        return {
          success: false,
          error: `E-Mail-Zuordnung mehrdeutig (0 passende offene Akten). Manueller Review-Task erstellt.`
        };
      }

      const targetCaseId = targetCase.id;
      const ext = targetCase.externalReferences as any;
      const prevConvs: string[] = ext?.outlook?.conversationIds || (Array.isArray(ext) ? ext : []);

      if (!prevConvs.includes(convId)) {
        if (!targetCase.externalReferences) {
          targetCase.externalReferences = { outlook: { graphMessageIds: [], internetMessageIds: [], conversationIds: [convId] } };
        } else if ((targetCase.externalReferences as any).outlook) {
          (targetCase.externalReferences as any).outlook.conversationIds = [...((targetCase.externalReferences as any).outlook.conversationIds || []), convId];
        } else if (Array.isArray(targetCase.externalReferences)) {
          (targetCase.externalReferences as any).push(convId);
        }
        caseService.saveCases();
      }

      return {
        success: true,
        outputReference: convId,
        rollbackData: { assignedCaseId: targetCaseId, assignedRef: convId, previousRefs: prevConvs }
      };
    }

    // 2. DEDUPLICATE_EMAIL_EVENT
    if (canonical === 'DEDUPLICATE_EMAIL_EVENT') {
      return { success: true, outputReference: inputReference || 'dedup_done' };
    }

    // 3. CREATE_INTERNAL_TASK
    if (canonical === 'CREATE_INTERNAL_TASK' && caseId) {
      const refType = String(context.referenceType || 'automation');
      const refId = String(context.referenceId || inputReference || 'auto_task');

      // Deduplication check for internal tasks
      const c = caseService.getCase(caseId);
      const existingTask = c?.tasks.find(t =>
        (t.referenceType === refType && t.referenceId === refId) ||
        (t.title === (context.title || 'Automatische Überprüfung') && t.status !== 'Completed')
      );

      if (existingTask) {
        return {
          success: true,
          outputReference: existingTask.id,
          rollbackData: { createdTaskId: existingTask.id }
        };
      }

      if (!c) return { success: false, error: 'Case not found' };
      const newTaskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      if (!c.tasks) c.tasks = [];
      c.tasks.push({
        id: newTaskId,
        title: String(context.title || 'Automatische Überprüfung'),
        description: String(context.description || 'Automatisch generierte Prüfaufgabe.'),
        category: 'Review',
        priority: 'medium',
        status: 'Open',
        source: 'AutomationService',
        caseId,
        workflowId: String(context.workflowId || 'wf_auto_task'),
        referenceType: refType,
        referenceId: refId,
        createdAt: new Date().toISOString()
      });
      caseService.saveCases();

      return {
        success: true,
        outputReference: newTaskId,
        rollbackData: { createdTaskId: newTaskId }
      };
    }

    // 4. MARK_REMINDER_DUE
    if (canonical === 'MARK_REMINDER_DUE' && caseId) {
      const currentCase = caseService.getCase(caseId);
      let updatedCount = 0;
      if (currentCase && currentCase.reminders) {
        const nowMs = Date.now();
        currentCase.reminders.forEach(r => {
          if (r.status === 'scheduled' && new Date(r.dueAt).getTime() <= nowMs) {
            r.status = 'due';
            updatedCount++;
          }
        });
        caseService.evaluateCaseHealth(currentCase);
        caseService.saveCases();
      }
      return {
        success: true,
        outputReference: caseId,
        rollbackData: { updatedCaseId: caseId, updatedCount }
      };
    }

    // 5. RECALCULATE_READINESS & RECALCULATE_CASE_HEALTH
    if ((canonical === 'RECALCULATE_READINESS' || canonical === 'RECALCULATE_CASE_HEALTH') && caseId) {
      const currentCase = caseService.getCase(caseId);
      if (currentCase) {
        caseService.evaluateCaseHealth(currentCase);
        caseService.saveCases();
      }
      return { success: true, outputReference: caseId };
    }

    // 6. CREATE_INTERNAL_TIMELINE_ENTRY
    if (canonical === 'CREATE_INTERNAL_TIMELINE_ENTRY' && caseId) {
      const entry = caseService.addTimelineEntry(caseId, {
        type: 'auto_entry',
        category: 'System',
        source: 'AutomationService',
        timestamp: new Date().toISOString(),
        title: String(context.title || 'Systemnotiz'),
        description: String(context.description || 'Automatisch erstellter Hinweis.')
      });
      return {
        success: true,
        outputReference: entry?.id || '',
        rollbackData: { createdEntryId: entry?.id || '' }
      };
    }

    // 7. PREPARE_EMAIL_DRAFT
    if (canonical === 'PREPARE_EMAIL_DRAFT' && caseId) {
      const draft = emailDraftService.createDraftForCase(caseId, {
        purpose: (context.purpose as any) || 'acknowledgement',
        sourceEventId: inputReference,
        originalSubject: String(context.subject || ''),
        originalSenderEmail: String(context.senderEmail || ''),
        originalSenderName: String(context.senderName || ''),
        createdBy: 'rule'
      });
      if (draft) {
        // Guarantee status is always 'draft'
        draft.status = 'draft';
        caseService.saveCases();
      }
      return {
        success: true,
        outputReference: draft?.id,
        rollbackData: { createdEmailDraftId: draft?.id }
      };
    }

    // 8. PREPARE_OFFER_DRAFT
    if (canonical === 'PREPARE_OFFER_DRAFT' && caseId) {
      const draft = caseService.createOfferDraft(caseId);
      if (draft) {
        draft.status = 'draft';
        caseService.saveCases();
      }
      return {
        success: true,
        outputReference: draft?.id,
        rollbackData: { createdOfferDraftId: draft?.id }
      };
    }

    // 9. PREPARE_INVOICE_DRAFT
    if (canonical === 'PREPARE_INVOICE_DRAFT' && caseId) {
      const draft = caseService.createInvoiceDraft(caseId);
      if (draft) {
        draft.status = 'draft';
        caseService.saveCases();
      }
      return {
        success: true,
        outputReference: draft?.id,
        rollbackData: { createdInvoiceDraftId: draft?.id }
      };
    }

    // 10. PREPARE_PAYMENT_REMINDER_DRAFT
    if (canonical === 'PREPARE_PAYMENT_REMINDER_DRAFT' && caseId) {
      const recId = (context.receivableId || inputReference) as string;
      if (recId) {
        const res = receivableService.preparePaymentReminderDraft(caseId, recId);
        if (res.success && res.draft) {
          res.draft.status = 'draft';
          caseService.saveCases();
          return {
            success: true,
            outputReference: res.draft.id,
            rollbackData: { createdReminderDraftId: res.draft.id }
          };
        }
      }
      return { success: true, outputReference: inputReference || 'reminder_draft_prepared' };
    }

    return { success: true, outputReference: inputReference || 'done' };
  }

  async rollbackExecution(executionId: string, user?: string): Promise<boolean> {
    const execution = this.executions.find(e => e.id === executionId);
    if (!execution) {
      console.error(`AutomationService: Execution ${executionId} not found.`);
      return false;
    }

    if (execution.status !== 'completed' && execution.status !== 'dry_run') {
      console.error(`AutomationService: Execution ${executionId} is in status "${execution.status}", cannot roll back.`);
      return false;
    }

    if (!execution.reversible) {
      console.error(`AutomationService: Execution ${executionId} is not reversible.`);
      return false;
    }

    const caseId = execution.caseId;
    const rbData = execution.rollbackData || {};

    // Revert domain state
    if (caseId) {
      const c = caseService.getCase(caseId);
      if (c) {
        if (rbData.createdTaskId) {
          c.tasks = c.tasks.filter(t => t.id !== rbData.createdTaskId);
        }
        if (rbData.createdEntryId) {
          c.timeline = c.timeline.filter(t => t.id !== rbData.createdEntryId);
        }
        if (rbData.assignedRef && c.externalReferences) {
          c.externalReferences = (rbData.previousRefs as any) || (Array.isArray(c.externalReferences) ? (c.externalReferences as any[]).filter(r => r !== rbData.assignedRef) : c.externalReferences);
        }
        if (rbData.createdEmailDraftId && c.emailDrafts) {
          c.emailDrafts = c.emailDrafts.filter(d => d.id !== rbData.createdEmailDraftId);
        }
        if (rbData.createdOfferDraftId && c.offerDrafts) {
          c.offerDrafts = c.offerDrafts.filter(o => o.id !== rbData.createdOfferDraftId);
        }
        if (rbData.createdInvoiceDraftId && c.invoiceDrafts) {
          c.invoiceDrafts = c.invoiceDrafts.filter(i => i.id !== rbData.createdInvoiceDraftId);
        }
        caseService.saveCases();
      }
    }

    execution.status = 'reverted';
    this.saveState();

    // Pause policy on rollback
    if (execution.policyId) {
      this.pausePolicy(execution.policyId, 'Benutzer hat die automatische Aktion zurückgenommen.', caseId);
    }

    if (caseId) {
      caseService.addTimelineEntry(caseId, {
        type: 'automation_reverted',
        category: 'System',
        source: 'AutomationService',
        timestamp: new Date().toISOString(),
        title: 'Automatische Aktion zurückgenommen',
        description: `Die automatische Aktion "${execution.actionType}" wurde vom Benutzer zurückgenommen.`
      });
    }

    workflowEngine.emitEvent('AUTOMATION_EXECUTION_REVERTED', 'AutomationService', {
      executionId: execution.id,
      actionType: execution.actionType,
      caseId
    });

    workflowEngine.emitEvent('AUTOMATION_ROLLBACK_COMPLETED', 'AutomationService', {
      executionId: execution.id,
      actionType: execution.actionType,
      caseId
    });

    learningService.recordLearningRecord({
      caseId,
      actionType: execution.actionType,
      contextType: 'rollback',
      finalDecision: 'reverted',
      result: 'reverted',
      confidence: 'low'
    });

    return true;
  }

  pausePolicy(policyId: string, reason: string, caseId?: string): void {
    const policy = this.policies.find(p => p.id === policyId || p.actionType === policyId || p.actionType === getCanonicalActionType(policyId));
    if (!policy) return;

    policy.enabled = false;
    policy.updatedAt = new Date().toISOString();
    this.saveState();

    workflowEngine.emitEvent('AUTOMATION_DISABLED', 'AutomationService', { policyId: policy.id, actionType: policy.actionType, reason });

    // Create task "Automatisierung prüfen" exactly once per pause
    if (caseId) {
      const existingTask = caseService.getCase(caseId)?.tasks.find(t => t.title === 'Automatisierung prüfen' && t.status !== 'Completed');
      if (!existingTask) {
        caseService.addTask(caseId, {
          title: 'Automatisierung prüfen',
          description: `Die Automatisierung für "${policy.actionType}" wurde pausiert. Grund: ${reason}`,
          category: 'Review',
          priority: 'high',
          status: 'Open',
          source: 'AutomationService',
          caseId,
          workflowId: 'wf_automation_review'
        });
      }
    }
  }

  userEnablePolicy(actionType: string, mode: AutomationMode = 'active'): { success: boolean; message: string } {
    const canonical = getCanonicalActionType(actionType);
    const policy = this.getPolicy(canonical) || this.getPolicy(actionType);
    if (!policy) return { success: false, message: 'Policy nicht gefunden.' };

    if (CRITICAL_ACTION_TYPES.has(canonical) || CRITICAL_ACTION_TYPES.has(actionType)) {
      return { success: false, message: 'Kritische Sicherheitsaktionen dürfen nicht aktiviert werden.' };
    }

    policy.enabled = true;
    policy.mode = mode;
    policy.level = 'auto_execute_reversible';
    policy.updatedAt = new Date().toISOString();
    this.saveState();

    workflowEngine.emitEvent('AUTOMATION_ENABLED', 'AutomationService', { policyId: policy.id, actionType: canonical, mode });
    return { success: true, message: `Automatisierung für "${canonical}" im Modus "${mode}" aktiviert.` };
  }

  userSetMode(actionType: string, mode: AutomationMode): { success: boolean; message: string } {
    const canonical = getCanonicalActionType(actionType);
    const policy = this.getPolicy(canonical) || this.getPolicy(actionType);
    if (!policy) return { success: false, message: 'Policy nicht gefunden.' };

    policy.mode = mode;
    policy.updatedAt = new Date().toISOString();
    this.saveState();

    workflowEngine.emitEvent('AUTOMATION_POLICY_UPDATED', 'AutomationService', { policyId: policy.id, actionType: canonical, mode });
    return { success: true, message: `Modus für "${canonical}" auf ${mode} gesetzt.` };
  }

  userDisablePolicy(actionType: string): { success: boolean; message: string } {
    const canonical = getCanonicalActionType(actionType);
    const policy = this.getPolicy(canonical) || this.getPolicy(actionType);
    if (!policy) return { success: false, message: 'Policy nicht gefunden.' };

    policy.enabled = false;
    policy.updatedAt = new Date().toISOString();
    this.saveState();

    workflowEngine.emitEvent('AUTOMATION_DISABLED', 'AutomationService', { policyId: policy.id, actionType: canonical });
    return { success: true, message: `Automatisierung für "${canonical}" deaktiviert.` };
  }

  updatePolicy(actionType: string, updates: Partial<AutomationPolicy>): boolean {
    const canonical = getCanonicalActionType(actionType);
    const policy = this.getPolicy(canonical) || this.getPolicy(actionType);
    if (!policy) return false;

    Object.assign(policy, updates, { updatedAt: new Date().toISOString() });
    if (updates.enabled) {
      policy.level = 'auto_execute_reversible';
    }
    this.saveState();
    return true;
  }

  userResetPolicyToManual(actionType: string): { success: boolean; message: string } {
    const canonical = getCanonicalActionType(actionType);
    const policy = this.getPolicy(canonical) || this.getPolicy(actionType);
    if (!policy) return { success: false, message: 'Policy nicht gefunden.' };

    policy.enabled = false;
    policy.level = 'manual';
    policy.mode = 'dry_run';
    policy.updatedAt = new Date().toISOString();
    this.saveState();

    workflowEngine.emitEvent('AUTOMATION_POLICY_UPDATED', 'AutomationService', { policyId: policy.id, actionType: canonical, level: 'manual' });
    return { success: true, message: `Automatisierung für "${canonical}" auf Manuell zurückgesetzt.` };
  }

  async executeSuggestion(action: WorkflowAction, context: WorkflowContext): Promise<WorkflowResult> {
    console.log(`AutomationService: Executing action ${action.id}`);
    const actionType = action.type || action.id;
    const { allowed, reason } = this.canAutoExecute(actionType, (context as unknown) as Record<string, unknown>);
    if (!allowed) {
      return { success: false, message: reason || 'Automation not allowed.' };
    }
    const exec = await this.executeAutomatedAction(actionType, (context as any).caseId, action.id, (context as unknown) as Record<string, unknown>);
    return { success: exec.status === 'completed' || exec.status === 'dry_run', message: exec.errorMessage || 'Action completed.' };
  }

  async validateExecution(actionId: string): Promise<boolean> {
    return true;
  }

  async cancelExecution(actionId: string): Promise<void> {
    console.log(`AutomationService: Cancelled action ${actionId}`);
  }

  async executeApprovedEmailDraft(
    draft: EmailResponseDraft,
    caseId: string,
    options?: { token?: string; fetchFn?: typeof fetch }
  ): Promise<ExecuteEmailDraftResult> {
    if (draft.status !== 'approved' && draft.status !== 'sending') {
      return {
        success: false,
        error: `Entwurf ist im Status "${draft.status}". Nur freigegebene Entwürfe (approved) dürfen versendet werden.`
      };
    }

    const validation = validateEmailResponseDraft(draft);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validierung fehlgeschlagen: ${validation.errors.join('; ')}`
      };
    }

    const attachmentPayloads: OutlookSendRequestAttachment[] = [];
    if (draft.attachments && draft.attachments.length > 0) {
      for (const attRef of draft.attachments) {
        const doc = documentService.getDocument(attRef.documentId);
        if (!doc) {
          return {
            success: false,
            error: `Dokument "${attRef.fileName}" (ID: ${attRef.documentId}) wurde im Document Service nicht gefunden.`
          };
        }
        if (!doc.dataUrl) {
          return {
            success: false,
            error: `Dokument "${attRef.fileName}" besitzt keinen gültigen PDF-Inhalt.`
          };
        }

        const dataUrl = doc.dataUrl;
        const isPdfHeader = dataUrl.startsWith('data:application/pdf') || dataUrl.includes('%PDF');
        if (!isPdfHeader) {
          return {
            success: false,
            error: `Dokument "${attRef.fileName}" ist kein gültiges PDF.`
          };
        }

        const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        if (!base64Part || base64Part.trim().length < 20) {
          return {
            success: false,
            error: `Dokument "${attRef.fileName}" ist leer.`
          };
        }

        attachmentPayloads.push({
          fileName: attRef.fileName,
          mimeType: attRef.mimeType || 'application/pdf',
          contentBytes: base64Part.trim()
        });
      }
    }

    return await sendOutlookMessage(
      {
        sourceMessageId: draft.sourceMessageId,
        subject: draft.subject,
        bodyText: draft.bodyText,
        recipients: draft.recipients,
        ccRecipients: draft.ccRecipients,
        attachments: attachmentPayloads.length > 0 ? attachmentPayloads : undefined
      },
      options
    );
  }

  resetForTesting(): void {
    this.policies = [];
    this.executions = [];
    this.activeLocks.clear();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(POLICIES_STORAGE_KEY);
        localStorage.removeItem(EXECUTIONS_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
    this.initDefaultPolicies();
  }
}

export const automationService = new AutomationService();

