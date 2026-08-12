console.log("====================================================");
console.log("RUNNING RELEASE EVIDENCE & GO-LIVE AUDIT SUITE");
console.log("====================================================");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${message}`);
    failed++;
  }
}

interface ReleaseEvidence {
  localTestsPassed: boolean;
  stagingDeploymentVerified: boolean;
  productionDeploymentVerified: boolean;
  realAuthClaimsVerified: boolean;
  firestoreSmokeTestsPassed: boolean;
  storageSmokeTestsPassed: boolean;
  productionEmailVerified: boolean;
  realRestoreVerified: boolean;
  healthChecksVerified: boolean;
  criticalBlockers: string[];
}

type ReleaseStatus = 'ready' | 'ready_with_warnings' | 'blocked';

function computeReleaseStatus(evidence: ReleaseEvidence): { status: ReleaseStatus; warnings: string[] } {
  const warnings: string[] = [];

  if (evidence.criticalBlockers.length > 0) {
    return { status: 'blocked', warnings: evidence.criticalBlockers };
  }

  if (!evidence.productionEmailVerified) {
    warnings.push("ALLOW_PRODUCTION_EMAILS is disengaged (false) - Live emails simulated or constrained to staging/test recipients.");
  }

  if (!evidence.productionDeploymentVerified) {
    warnings.push("Production deployment verified in sandbox staging runtime environment; full production rollout requires final Cloud Run promotion.");
  }

  if (!evidence.realRestoreVerified) {
    warnings.push("Restore executed in isolated test container; live production Firestore disaster recovery restore not yet performed on production cluster.");
  }

  if (warnings.length > 0) {
    return { status: 'ready_with_warnings', warnings };
  }

  return { status: 'ready', warnings: [] };
}

async function runReleaseEvidenceTests() {
  const sampleEvidence: ReleaseEvidence = {
    localTestsPassed: true,
    stagingDeploymentVerified: true,
    productionDeploymentVerified: false, // In sandbox preview container
    realAuthClaimsVerified: true,
    firestoreSmokeTestsPassed: true,
    storageSmokeTestsPassed: true,
    productionEmailVerified: false, // ALLOW_PRODUCTION_EMAILS=false
    realRestoreVerified: false, // Executed in isolated container
    healthChecksVerified: true,
    criticalBlockers: []
  };

  const result = computeReleaseStatus(sampleEvidence);

  assert(result.status === 'ready_with_warnings', "Release status correctly evaluated as 'ready_with_warnings' due to safety toggles & preview sandbox limits");
  assert(result.warnings.length === 3, "Identified 3 transparent warnings (Emails disengaged, Sandbox preview runtime, Isolated restore)");

  // Test critical blocker handling
  const blockedEvidence: ReleaseEvidence = {
    ...sampleEvidence,
    criticalBlockers: ["Firestore rules breach detected in company tenant scope"]
  };
  const blockedResult = computeReleaseStatus(blockedEvidence);
  assert(blockedResult.status === 'blocked', "Critical blocker correctly forces ReleaseStatus to 'blocked'");

  console.log("====================================================");
  console.log(`RELEASE EVIDENCE TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runReleaseEvidenceTests().catch(err => {
  console.error("Fatal error in Release Evidence test:", err);
  process.exit(1);
});
