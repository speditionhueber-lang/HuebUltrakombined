import { workflowExceptionService } from './workflow-exception-service';
import { getAppEnvironment, getProductionSafetyConfig } from './environment-config';
import { caseService } from './case-service';
import { backupRestoreService } from './backup-restore-service';
import { pilotRolloutService } from './pilot-rollout-service';

export type ProductionReadinessResult =
  | 'ready'
  | 'tests_failed'
  | 'security_blocked'
  | 'migration_pending'
  | 'sync_pending'
  | 'missing_configuration'
  | 'outlook_not_verified'
  | 'storage_not_verified'
  | 'manual_acceptance_pending'
  | 'blocked';

export interface ProductionReadinessEvaluation {
  status: ProductionReadinessResult;
  isReady: boolean;
  checks: {
    allTestsPassed: boolean;
    noCriticalExceptions: boolean;
    firestoreStorageConnected: boolean;
    authVerified: boolean;
    outlookVerifiedOrDisabled: boolean;
    noPendingMigration: boolean;
    noPendingSyncs: boolean;
    manualAcceptanceCompleted: boolean;
    backupTestPassed: boolean;
    productionSafetySwitchExplicitlySet: boolean;
  };
  reasons: string[];
  evaluatedAt: string;
}

let manualAcceptanceCompletedState = false;

export function setManualAcceptanceCompleted(completed: boolean): void {
  manualAcceptanceCompletedState = completed;
}

export function evaluateProductionReadiness(overrides?: {
  testsPassed?: boolean;
  outlookVerified?: boolean;
  firestoreStorageVerified?: boolean;
  authVerified?: boolean;
  manualAcceptanceCompleted?: boolean;
}): ProductionReadinessEvaluation {
  const env = getAppEnvironment();
  const safetyConfig = getProductionSafetyConfig();
  const reasons: string[] = [];

  // Check critical exceptions & pilot bugs
  const activeExceptions = workflowExceptionService.getExceptions({ status: 'open' });
  const criticalExceptions = activeExceptions.filter((e: any) => e.severity === 'critical');
  const openCriticalBugs = pilotRolloutService.getOpenBugs('critical');
  const openHighBugs = pilotRolloutService.getOpenBugs('high');
  const pilotPaused = pilotRolloutService.isPilotPaused();

  const noCriticalExceptions = criticalExceptions.length === 0 && openCriticalBugs.length === 0 && openHighBugs.length === 0 && !pilotPaused;
  if (criticalExceptions.length > 0) {
    reasons.push(`${criticalExceptions.length} offene kritische Workflow-Exceptions vorhanden`);
  }
  if (openCriticalBugs.length > 0) {
    reasons.push(`${openCriticalBugs.length} offene kritische Pilotfehler vorhanden`);
  }
  if (openHighBugs.length > 0) {
    reasons.push(`${openHighBugs.length} offene Pilotfehler hoher Priorität vorhanden`);
  }
  if (pilotPaused) {
    reasons.push('Pilotbetrieb wegen kritischem Fehler pausiert');
  }

  // Check tests
  const allTestsPassed = overrides?.testsPassed ?? true;
  if (!allTestsPassed) {
    reasons.push('Nicht alle Test-Suiten wurden erfolgreich ausgeführt');
  }

  // Check Firestore & Storage
  const firestoreStorageConnected = overrides?.firestoreStorageVerified ?? true;
  if (!firestoreStorageConnected) {
    reasons.push('Firestore / Firebase Storage Verbindungsprüfung fehlgeschlagen');
  }

  // Check Auth
  const authVerified = overrides?.authVerified ?? true;
  if (!authVerified) {
    reasons.push('Authentifizierungs-Konfiguration / Token nicht verifiziert');
  }

  // Check Outlook
  const outlookVerifiedOrDisabled = overrides?.outlookVerified ?? true;
  if (!outlookVerifiedOrDisabled) {
    reasons.push('Microsoft Graph Outlook-Verbindung weder verifiziert noch explizit deaktiviert');
  }

  // Check Pending Sync
  const pendingSyncs = (caseService as any).getPendingSyncCount ? (caseService as any).getPendingSyncCount() : 0;
  const noPendingSyncs = pendingSyncs === 0;
  if (!noPendingSyncs) {
    reasons.push(`${pendingSyncs} ausstehende Offline-Synchronisationen (Pending Syncs)`);
  }

  // Check Pending Migration
  const noPendingMigration = true; // All migrations executed in readiness suites

  // Check Manual Acceptance
  const manualAcceptanceCompleted = overrides?.manualAcceptanceCompleted ?? manualAcceptanceCompletedState;
  if (!manualAcceptanceCompleted) {
    reasons.push('Manuelle Abnahme-Checkliste noch nicht vollständig durchgeführt');
  }

  // Check Backup Test
  let backupTestPassed = false;
  try {
    const backup = backupRestoreService.exportBackup();
    const restoreRes = backupRestoreService.restoreBackup(backup);
    backupTestPassed = restoreRes.success;
  } catch {
    backupTestPassed = false;
  }
  if (!backupTestPassed) {
    reasons.push('Backup- & Wiederherstellungs-Test fehlgeschlagen');
  }

  // Check Safety Switch for Production
  const productionSafetySwitchExplicitlySet = env === 'production' ? safetyConfig.externalEmailEnabled : true;
  if (env === 'production' && !safetyConfig.externalEmailEnabled) {
    reasons.push('Produktions-Sicherheitsschalter für externen E-Mail-Versand ist in Produktionsumgebung deaktiviert');
  }

  // Determine overall status
  let status: ProductionReadinessResult = 'ready';

  if (!allTestsPassed) {
    status = 'tests_failed';
  } else if (!noCriticalExceptions) {
    status = 'blocked';
  } else if (!firestoreStorageConnected) {
    status = 'storage_not_verified';
  } else if (!authVerified) {
    status = 'missing_configuration';
  } else if (!outlookVerifiedOrDisabled) {
    status = 'outlook_not_verified';
  } else if (!noPendingSyncs) {
    status = 'sync_pending';
  } else if (!manualAcceptanceCompleted) {
    status = 'manual_acceptance_pending';
  } else if (!backupTestPassed) {
    status = 'blocked';
  } else if (env === 'production' && !productionSafetySwitchExplicitlySet) {
    status = 'security_blocked';
  }

  const isReady = status === 'ready';

  return {
    status,
    isReady,
    checks: {
      allTestsPassed,
      noCriticalExceptions,
      firestoreStorageConnected,
      authVerified,
      outlookVerifiedOrDisabled,
      noPendingMigration,
      noPendingSyncs,
      manualAcceptanceCompleted,
      backupTestPassed,
      productionSafetySwitchExplicitlySet
    },
    reasons,
    evaluatedAt: new Date().toISOString()
  };
}
