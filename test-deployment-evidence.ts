import fs from 'fs';
import path from 'path';

console.log("====================================================");
console.log("RUNNING DEPLOYMENT EVIDENCE & ASSET AUDIT SUITE");
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

async function runDeploymentEvidenceTests() {
  // 1. Firestore Rules file presence & version check
  const firestoreRulesPath = path.join(process.cwd(), 'firestore.rules');
  assert(fs.existsSync(firestoreRulesPath), "firestore.rules file exists");
  const firestoreRulesContent = fs.readFileSync(firestoreRulesPath, 'utf-8');
  assert(firestoreRulesContent.includes("rules_version = '2';"), "firestore.rules declares rules_version = '2'");

  // 2. Storage Rules file presence & syntax check
  const storageRulesPath = path.join(process.cwd(), 'storage.rules');
  assert(fs.existsSync(storageRulesPath), "storage.rules file exists");
  const storageRulesContent = fs.readFileSync(storageRulesPath, 'utf-8');
  assert(storageRulesContent.includes("service firebase.storage"), "storage.rules contains valid service declaration");

  // 3. Firestore Indexes file presence
  const firestoreIndexesPath = path.join(process.cwd(), 'firestore.indexes.json');
  assert(fs.existsSync(firestoreIndexesPath), "firestore.indexes.json exists");

  // 4. Production Build Manifests
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  assert(fs.existsSync(viteConfigPath), "vite.config.ts exists for production bundle generation");

  // 5. Package scripts readiness
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
  assert(!!packageJson.scripts.build && !!packageJson.scripts.start, "package.json contains valid build and start scripts");

  console.log("====================================================");
  console.log(`DEPLOYMENT EVIDENCE TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runDeploymentEvidenceTests().catch(err => {
  console.error("Fatal error in Deployment Evidence test:", err);
  process.exit(1);
});
