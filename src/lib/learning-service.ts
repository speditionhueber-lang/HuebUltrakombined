import {
  LearningRecord,
  AutomationLevel,
  LearningStatistics
} from './types';

export const CRITICAL_ACTION_TYPES = new Set<string>([
  'customer_create',
  'crm_customer_create',
  'crm_customer_update',
  'overwrite_crm',
  'offer_approve',
  'offer_freigeben',
  'offer_send',
  'offer_accept_confirm',
  'calendar_book',
  'calendar_appointment_create',
  'invoice_approve',
  'invoice_freigeben',
  'invoice_send',
  'payment_record',
  'payment_verbuchen',
  'payment_reminder_send',
  'invoice_cancel',
  'case_delete',
  'assignment_confirm',
  'dispatch_confirm',
  'employee_vehicle_assign'
]);

const STORAGE_KEY = 'vienna_learning_records';

export function generateContextSignature(
  actionType: string,
  context: Record<string, unknown> = {}
): string {
  const eventType = String(context.eventType || context.contextType || 'GENERIC');
  const completeness = String(context.dataCompleteness || 'complete');
  const crmStatus = String(context.crmMatchStatus || 'unmatched');
  const confidence = String(context.confidence || 'medium');
  const caseStatus = String(context.caseStatus || 'none');
  const docStatus = String(context.docStatus || 'none');
  const isCritical = CRITICAL_ACTION_TYPES.has(actionType);
  const risk = isCritical ? 'critical' : 'low_risk';

  return `act=${actionType}|evt=${eventType}|comp=${completeness}|crm=${crmStatus}|conf=${confidence}|case=${caseStatus}|doc=${docStatus}|risk=${risk}`;
}

export function calculateLearningStatistics(
  records: LearningRecord[],
  actionType: string,
  contextSignature?: string
): LearningStatistics {
  const filtered = records.filter(r => {
    if (r.actionType !== actionType) return false;
    if (contextSignature && r.contextSignature !== contextSignature) return false;
    return true;
  });

  const totalDecisions = filtered.length;
  let acceptedCount = 0;
  let correctedCount = 0;
  let rejectedCount = 0;
  let executedCount = 0;
  let failedCount = 0;
  let revertedCount = 0;
  let confidenceSum = 0;
  let lastUsedAt: string | undefined = undefined;

  for (const r of filtered) {
    if (r.result === 'accepted') acceptedCount++;
    else if (r.result === 'corrected') correctedCount++;
    else if (r.result === 'rejected') rejectedCount++;
    else if (r.result === 'executed') executedCount++;
    else if (r.result === 'failed') failedCount++;
    else if (r.result === 'reverted') revertedCount++;

    if (r.confidence === 'high') confidenceSum += 1.0;
    else if (r.confidence === 'medium') confidenceSum += 0.7;
    else confidenceSum += 0.4;

    if (!lastUsedAt || r.createdAt > lastUsedAt) {
      lastUsedAt = r.createdAt;
    }
  }

  const positive = acceptedCount + executedCount;
  const approvalRate = totalDecisions > 0 ? positive / totalDecisions : 0;
  const correctionRate = totalDecisions > 0 ? correctedCount / totalDecisions : 0;
  const rejectionRate = totalDecisions > 0 ? rejectedCount / totalDecisions : 0;
  const failureRate = totalDecisions > 0 ? (failedCount + correctedCount + revertedCount) / totalDecisions : 0;
  const reversionRate = totalDecisions > 0 ? revertedCount / totalDecisions : 0;
  const averageConfidence = totalDecisions > 0 ? confidenceSum / totalDecisions : 0;

  const isCritical = CRITICAL_ACTION_TYPES.has(actionType);

  const reasons: string[] = [];
  let eligible = true;

  if (totalDecisions < 10) {
    eligible = false;
    reasons.push(`Mindestens 10 Entscheidungen erforderlich (aktuell: ${totalDecisions}).`);
  }
  if (approvalRate < 0.95) {
    eligible = false;
    reasons.push(`Bestätigungsquote von 95% nicht erreicht (aktuell: ${(approvalRate * 100).toFixed(1)}%).`);
  }
  if (failureRate > 0.02) {
    eligible = false;
    reasons.push(`Fehlerquote über 2% (aktuell: ${(failureRate * 100).toFixed(1)}%).`);
  }
  if (isCritical) {
    eligible = false;
    reasons.push('Kritische Sicherheitsaktion darf nicht automatisch ausgeführt werden.');
  }

  let recommendedLevel: AutomationLevel = 'suggest';
  if (eligible) {
    recommendedLevel = 'auto_execute_reversible';
  } else if (totalDecisions >= 3) {
    recommendedLevel = 'prepare';
  }

  return {
    actionType,
    contextSignature,
    totalDecisions,
    acceptedCount,
    correctedCount,
    rejectedCount,
    executedCount,
    failedCount,
    revertedCount,
    approvalRate,
    correctionRate,
    rejectionRate,
    failureRate,
    reversionRate,
    averageConfidence,
    lastUsedAt,
    recommendedLevel,
    eligibleForAutomation: eligible,
    eligibilityReasons: reasons
  };
}

export function evaluateAutomationEligibility(
  stats: LearningStatistics,
  actionType: string,
  currentConfidence: 'low' | 'medium' | 'high' = 'high',
  isReversible: boolean = true,
  hasDataConflict: boolean = false
): { eligible: boolean; recommendedLevel: AutomationLevel; reasons: string[] } {
  const reasons: string[] = [...stats.eligibilityReasons];
  let eligible = stats.eligibleForAutomation;

  if (CRITICAL_ACTION_TYPES.has(actionType)) {
    eligible = false;
    if (!reasons.includes('Kritische Sicherheitsaktion darf nicht automatisch ausgeführt werden.')) {
      reasons.push('Kritische Sicherheitsaktion darf nicht automatisch ausgeführt werden.');
    }
  }
  if (currentConfidence !== 'high') {
    eligible = false;
    reasons.push(`Hohe Confidence erforderlich (aktuell: ${currentConfidence}).`);
  }
  if (!isReversible) {
    eligible = false;
    reasons.push('Aktion muss reversibel sein.');
  }
  if (hasDataConflict) {
    eligible = false;
    reasons.push('Widersprüchliche Daten vorhanden.');
  }

  const recommendedLevel: AutomationLevel = eligible ? 'auto_execute_reversible' : (stats.totalDecisions >= 3 ? 'prepare' : 'suggest');

  return {
    eligible,
    recommendedLevel,
    reasons
  };
}

function sanitizeLearningData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (key === 'pdf' || key === 'token' || key === 'bodyText' || key === 'contentBytes' || key === 'dataUrl' || key === 'attachments') {
      clean[key] = '[SANITIZED]';
    } else if (typeof val === 'string' && val.length > 300) {
      clean[key] = val.substring(0, 300) + '...[TRUNCATED]';
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      clean[key] = sanitizeLearningData(val as Record<string, unknown>);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export class LearningService {
  private records: LearningRecord[] = [];
  private insights: any[] = [];
  private listeners = new Set<() => void>();

  constructor() {
    this.loadRecords();
  }

  private loadRecords() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.records = Array.isArray(parsed) ? parsed.slice(-100) : [];
        }
      } catch (e) {
        console.warn('Failed to load learning records:', e);
      }
    }
  }

  private saveRecords() {
    if (typeof localStorage !== 'undefined') {
      if (this.records.length > 100) {
        this.records = this.records.slice(-100);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
      } catch (e: any) {
        if (e?.name === 'QuotaExceededError' || e?.code === 22 || String(e).includes('quota')) {
          try {
            this.records = this.records.slice(-30);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
          } catch (retryErr) {
            console.warn('LocalStorage quota limit reached for learning records, operating in-memory.');
          }
        } else {
          console.warn('Failed to save learning records:', e?.message || e);
        }
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public recordLearningRecord(partial: Partial<LearningRecord>): LearningRecord {
    const actionType = partial.actionType || 'general_action';
    const contextType = partial.contextType || 'general_context';
    const contextSignature = partial.contextSignature || generateContextSignature(actionType, { contextType, ...partial.originalData });

    const record: LearningRecord = {
      id: partial.id || `lr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      caseId: partial.caseId,
      workflowEventId: partial.workflowEventId,
      suggestionId: partial.suggestionId,
      actionType,
      contextType,
      detectedDecision: partial.detectedDecision,
      finalDecision: partial.finalDecision || 'accepted',
      result: partial.result || 'accepted',
      confidence: partial.confidence || 'high',
      originalData: sanitizeLearningData(partial.originalData),
      correctedData: sanitizeLearningData(partial.correctedData),
      contextSignature,
      createdAt: partial.createdAt || new Date().toISOString(),
      userId: partial.userId
    };

    this.records.push(record);
    this.saveRecords();
    this.notifyListeners();
    return record;
  }

  async recordDecision(suggestionId: string, eventId: string, actionTaken: string, data?: any): Promise<void> {
    const caseId = data?.caseId || data?.context?.caseId;
    const actionType = data?.actionType || suggestionId || 'general_action';
    const contextType = data?.contextType || 'decision_engine';
    
    this.recordLearningRecord({
      suggestionId,
      workflowEventId: eventId,
      caseId,
      actionType,
      contextType,
      detectedDecision: actionTaken,
      finalDecision: actionTaken,
      result: 'accepted',
      confidence: data?.confidence || 'high',
      originalData: typeof data === 'object' ? data : { raw: data }
    });

    console.log(`LearningService: Recorded decision for suggestion ${suggestionId}, action: ${actionTaken}`);
  }

  async recordCorrection(suggestionId: string, eventId: string, correctionData: any): Promise<void> {
    const caseId = correctionData?.caseId;
    const actionType = correctionData?.actionType || suggestionId || 'general_action';

    this.recordLearningRecord({
      suggestionId,
      workflowEventId: eventId,
      caseId,
      actionType,
      contextType: 'correction',
      finalDecision: 'corrected',
      result: 'corrected',
      confidence: 'medium',
      correctedData: typeof correctionData === 'object' ? correctionData : { raw: correctionData }
    });

    console.log(`LearningService: Recorded correction for suggestion ${suggestionId}`);
  }

  async recordRejection(suggestionId: string, eventId: string, reason?: string, data?: any): Promise<void> {
    const caseId = data?.caseId;
    const actionType = data?.actionType || suggestionId || 'general_action';

    this.recordLearningRecord({
      suggestionId,
      workflowEventId: eventId,
      caseId,
      actionType,
      contextType: 'rejection',
      finalDecision: 'rejected',
      result: 'rejected',
      confidence: 'low',
      originalData: { reason, ...data }
    });

    console.log(`LearningService: Recorded rejection for suggestion ${suggestionId}, reason: ${reason}`);
  }

  getLearningRecords(): LearningRecord[] {
    return [...this.records];
  }

  getStatisticsForAction(actionType: string, contextSignature?: string): LearningStatistics {
    return calculateLearningStatistics(this.records, actionType, contextSignature);
  }

  async getLearningStatistics(): Promise<Record<string, LearningStatistics>> {
    const actionTypes = Array.from(new Set(this.records.map(r => r.actionType)));
    const statsMap: Record<string, LearningStatistics> = {};
    for (const at of actionTypes) {
      statsMap[at] = calculateLearningStatistics(this.records, at);
    }
    return statsMap;
  }

  async saveInsight(insight: any): Promise<void> {
    this.insights.push(insight);
    console.log(`LearningService: Saved insight for case ${insight?.caseId}`, insight);
  }

  getInsightsForCase(caseId: string): any[] {
    return this.insights.filter(i => i.caseId === caseId);
  }

  resetForTesting(): void {
    this.records = [];
    this.insights = [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
    this.notifyListeners();
  }
}

export const learningService = new LearningService();
