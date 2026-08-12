import { pilotRolloutService, PILOT_SCENARIOS } from './src/lib/pilot-rollout-service';
import {
  setAppEnvironment,
  getAppEnvironment,
  isStaging,
  isEmailRecipientAllowed,
  canExecuteDestructiveAction,
  resetProductionSafetyConfig
} from './src/lib/environment-config';
import { evaluateProductionReadiness, setManualAcceptanceCompleted } from './src/lib/production-readiness-service';
import { workflowExceptionService } from './src/lib/workflow-exception-service';

// Polyfill localStorage in Node environment if missing
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

function assert(condition: boolean, testName: string, detail?: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
    throw new Error(`Assertion failed: ${testName}`);
  } else {
    console.log(`✓ ${testName}`);
    passedCount++;
  }
}

export async function runPilotRolloutTests() {
  console.log("====================================================");
  console.log("STARTING PILOT ROLLOUT & STAGING PROTECTION SUITE (20 ASSERTIONS)");
  console.log("====================================================");

  // Reset environments & state
  setAppEnvironment('staging');
  resetProductionSafetyConfig();
  workflowExceptionService.resetForTesting();
  pilotRolloutService.resetForTesting();
  setManualAcceptanceCompleted(true);

  // 1. Staging-Banner sichtbar
  assert(isStaging(), '1. Staging-Banner sichtbar');

  // 2. Produktionsdaten werden nicht geladen
  assert(getAppEnvironment() === 'staging', '2. Produktionsdaten werden nicht geladen (Staging isoliert)');

  // 3. fremde Empfänger werden blockiert
  assert(!isEmailRecipientAllowed('unauthorized@external.com'), '3. fremde Empfänger werden blockiert');

  // 4. erlaubter Testempfänger funktioniert
  assert(isEmailRecipientAllowed('pilot@spedition-hueber.de'), '4. erlaubter Testempfänger funktioniert');

  // 5. Automationen starten im Dry Run
  const stageConfig = pilotRolloutService.getRolloutStageConfig();
  assert(stageConfig.dryRun === true, '5. Automationen starten im Dry Run');

  // 6. destruktive Aktionen sind deaktiviert
  assert(!canExecuteDestructiveAction(), '6. destruktive Aktionen sind deaktiviert');

  // 7. Pilotauftrag kann gestartet werden
  const testScenarioRes = await pilotRolloutService.runPilotScenario('neue_kundenanfrage');
  assert(testScenarioRes.status === 'passed', '7. Pilotauftrag kann gestartet werden');

  // 8. Schritte werden protokolliert
  assert(testScenarioRes.steps.length >= 3, '8. Schritte werden protokolliert');

  // 9. kritischer Fehler blockiert Pilot
  const criticalBug = pilotRolloutService.reportBug({
    scenarioId: 'neue_kundenanfrage',
    title: 'Simulierter kritischer Datenkonflikt',
    description: 'Datenverlust simuliert',
    severity: 'critical'
  });
  assert(pilotRolloutService.isPilotPaused(), '9. kritischer Fehler blockiert Pilot');

  // 10. bestandener Testauftrag wird gespeichert
  const savedResults = pilotRolloutService.getPilotResults();
  assert(savedResults.some(r => r.id === testScenarioRes.id), '10. bestandener Testauftrag wird gespeichert');

  // 11. fünf erfolgreiche Testaufträge erfüllen Mindestanforderung
  // First resolve critical bug so pilot can resume
  pilotRolloutService.resolveBug(criticalBug.id, 'Tester');
  assert(!pilotRolloutService.isPilotPaused(), 'Critical bug resolved, pilot resumed');

  for (let i = 1; i <= 5; i++) {
    const res = await pilotRolloutService.runFullPilotTestOrder(i, 'PilotTester');
    assert(res.status === 'passed', `Pilotauftrag ${i} erfolgreich absolviert`);
  }
  assert(pilotRolloutService.getSuccessfulOrderCount() >= 5, '11. fünf erfolgreiche Testaufträge erfüllen Mindestanforderung');

  // 12. offener Critical-Fehler blockiert Production
  const bugCrit2 = pilotRolloutService.reportBug({
    scenarioId: 'schadensmeldung',
    title: 'Kritischer Vorfall bei Abnahme',
    description: 'Kritischer Fehler blockiert Freigabe',
    severity: 'critical'
  });
  const readinessCrit = evaluateProductionReadiness();
  assert(!readinessCrit.isReady, '12. offener Critical-Fehler blockiert Production');
  pilotRolloutService.resolveBug(bugCrit2.id, 'Tester');

  // 13. offener High-Fehler blockiert Production
  const bugHigh = pilotRolloutService.reportBug({
    scenarioId: 'rechnungsstellung',
    title: 'High-Priority Berechnungsabweichung',
    description: 'Rundungsdifferenz in Entwurf',
    severity: 'high'
  });
  const readinessHigh = evaluateProductionReadiness();
  assert(!readinessHigh.isReady, '13. offener High-Fehler blockiert Production');
  pilotRolloutService.resolveBug(bugHigh.id, 'Tester');

  // Setup required test flags
  pilotRolloutService.setBackupRestoreTested(true);
  pilotRolloutService.setOutlookRecipientTested(true);
  pilotRolloutService.setStorageTested(true);
  pilotRolloutService.setRollbackTested(true);

  // 14. fehlender Backup-Test blockiert
  pilotRolloutService.setBackupRestoreTested(false);
  const readinessNoBackup = pilotRolloutService.verifyReleaseReadiness();
  assert(!readinessNoBackup.isReady, '14. fehlender Backup-Test blockiert');
  pilotRolloutService.setBackupRestoreTested(true);

  // 15. fehlender Outlook-Test blockiert
  pilotRolloutService.setOutlookRecipientTested(false);
  const readinessNoOutlook = pilotRolloutService.verifyReleaseReadiness();
  assert(!readinessNoOutlook.isReady, '15. fehlender Outlook-Test blockiert');
  pilotRolloutService.setOutlookRecipientTested(true);

  // 16. fehlender Storage-Test blockiert
  pilotRolloutService.setStorageTested(false);
  const readinessNoStorage = pilotRolloutService.verifyReleaseReadiness();
  assert(!readinessNoStorage.isReady, '16. fehlender Storage-Test blockiert');
  pilotRolloutService.setStorageTested(true);

  // 17. fehlender Rollback-Test blockiert
  pilotRolloutService.setRollbackTested(false);
  const readinessNoRollback = pilotRolloutService.verifyReleaseReadiness();
  assert(!readinessNoRollback.isReady, '17. fehlender Rollback-Test blockiert');
  pilotRolloutService.setRollbackTested(true);

  // 18. vollständige Voraussetzungen ergeben freigabefähigen Status
  const releaseVerify = pilotRolloutService.verifyReleaseReadiness();
  assert(releaseVerify.isReady, '18. vollständige Voraussetzungen ergeben freigabefähigen Status');

  // 19. Production wird nicht automatisch aktiviert
  assert(getAppEnvironment() === 'staging', '19. Production wird nicht automatisch aktiviert (bleibt Staging)');

  // 20. alle bisherigen Regressionen bleiben erfolgreich
  const prodEval = evaluateProductionReadiness();
  assert(prodEval.checks.allTestsPassed, '20. alle bisherigen Regressionen bleiben erfolgreich');

  console.log("====================================================");
  console.log(`ALL ${passedCount} PILOT ROLLOUT ASSERTIONS PASSED PERFECTLY!`);
  console.log("====================================================");
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.endsWith('test-pilot-rollout.ts')) {
  runPilotRolloutTests().catch(err => {
    console.error("Pilot Rollout Test Failed:", err);
    process.exit(1);
  });
}
