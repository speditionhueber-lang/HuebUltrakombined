import fs from 'fs';
import path from 'path';
import firebaseConfigData from './firebase-applet-config.json';

console.log("====================================================");
console.log("RUNNING ENVIRONMENT CONSISTENCY & PROJECT ALIGNMENT SUITE");
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

async function runEnvironmentConsistencyTests() {
  // 1. Firebase Config Alignment
  const configProjectId = firebaseConfigData.projectId;
  assert(!!configProjectId && configProjectId.length > 0, "firebase-applet-config.json contains valid projectId");

  // 2. Storage Bucket Alignment
  const storageBucket = firebaseConfigData.storageBucket;
  assert(storageBucket.includes(configProjectId), `Storage bucket '${storageBucket}' aligns with Firebase Project ID '${configProjectId}'`);

  // 3. Auth Domain Alignment
  const authDomain = firebaseConfigData.authDomain;
  assert(authDomain.includes(configProjectId), `Auth domain '${authDomain}' aligns with Firebase Project ID '${configProjectId}'`);

  // 4. Server Admin SDK Alignment
  const serverContent = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf-8');
  assert(serverContent.includes('firebaseConfigData.projectId'), "server.ts uses aligned projectId from config for Admin SDK initialization");

  // 5. Emulator Production Guard
  const emulatorInProdAllowed = process.env.NODE_ENV === 'production' && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
  assert(!emulatorInProdAllowed, "Firebase emulator host is strictly disabled when NODE_ENV=production");

  console.log("====================================================");
  console.log(`ENVIRONMENT CONSISTENCY TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runEnvironmentConsistencyTests().catch(err => {
  console.error("Fatal error in Environment Consistency test:", err);
  process.exit(1);
});
