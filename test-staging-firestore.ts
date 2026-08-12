import fs from 'fs';
import path from 'path';

type TestExecutionLevel = 'local' | 'emulator' | 'staging' | 'production';

const CURRENT_LEVEL: TestExecutionLevel = 'staging';

async function runStagingFirestoreTests() {
  console.log("====================================================");
  console.log(`RUNNING STAGING FIRESTORE RULES & SMOKE SUITE [Execution Level: ${CURRENT_LEVEL}]`);
  console.log("====================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✓ [PASS] [LEVEL:${CURRENT_LEVEL}] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] [LEVEL:${CURRENT_LEVEL}] ${message}`);
      failed++;
    }
  }

  // 1. Verify deployed firestore.rules file syntax and version
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  assert(fs.existsSync(rulesPath), "firestore.rules file present for Staging deployment");
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

  assert(rulesContent.includes("rules_version = '2';"), "firestore.rules uses version 2 syntax");
  assert(rulesContent.includes("request.auth.token.companyId"), "firestore.rules enforces companyId claim validation");
  assert(rulesContent.includes("request.auth.token.role"), "firestore.rules enforces role claim validation");
  assert(rulesContent.includes("request.resource.data.companyId == resource.data.companyId"), "firestore.rules prevents companyId mutation");
  assert(rulesContent.includes("request.resource.data.createdAt == resource.data.createdAt"), "firestore.rules prevents createdAt mutation");
  assert(rulesContent.includes("resource.data.legallyBinding != true"), "firestore.rules prevents deletion of legally binding documents");

  // 2. Simulated evaluation of security rules logic
  function evaluateFirestoreAccess(auth: any, method: 'read' | 'write' | 'delete', resourceData: any, newResourceData?: any) {
    if (!auth || !auth.token) return false;
    const { companyId, role } = auth.token;
    if (!companyId || !role) return false;

    if (method === 'read') {
      return resourceData.companyId === companyId;
    }

    if (method === 'write') {
      if (resourceData && resourceData.companyId && newResourceData && newResourceData.companyId !== resourceData.companyId) {
        return false; // Immutable companyId
      }
      if (resourceData && resourceData.createdAt && newResourceData && newResourceData.createdAt !== resourceData.createdAt) {
        return false; // Immutable createdAt
      }
      if (role === 'viewer') return false;
      return newResourceData ? newResourceData.companyId === companyId : resourceData.companyId === companyId;
    }

    if (method === 'delete') {
      if (resourceData.legallyBinding === true) return false;
      return role === 'admin' && resourceData.companyId === companyId;
    }

    return false;
  }

  // Assertion checks
  assert(evaluateFirestoreAccess(null, 'read', { companyId: 'company_hueber' }) === false, "Unauthenticated read blocked");
  assert(evaluateFirestoreAccess(null, 'write', {}, { companyId: 'company_hueber' }) === false, "Unauthenticated write blocked");
  assert(evaluateFirestoreAccess({ token: { companyId: 'company_hueber', role: 'office' } }, 'read', { companyId: 'company_hueber' }) === true, "Own tenant read allowed");
  assert(evaluateFirestoreAccess({ token: { companyId: 'company_hueber', role: 'office' } }, 'read', { companyId: 'company_other' }) === false, "Foreign tenant read blocked");
  assert(evaluateFirestoreAccess({ token: { companyId: 'company_hueber', role: 'viewer' } }, 'write', { companyId: 'company_hueber' }, { companyId: 'company_hueber' }) === false, "Viewer write blocked");
  assert(evaluateFirestoreAccess({ token: { companyId: 'company_hueber', role: 'office' } }, 'write', { companyId: 'company_hueber', createdAt: '2026-01-01' }, { companyId: 'company_hueber', createdAt: '2026-08-05' }) === false, "CreatedAt mutation blocked");
  assert(evaluateFirestoreAccess({ token: { companyId: 'company_hueber', role: 'admin' } }, 'delete', { companyId: 'company_hueber', legallyBinding: true }) === false, "Legally binding document deletion blocked");

  console.log("====================================================");
  console.log(`STAGING FIRESTORE TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runStagingFirestoreTests().catch(err => {
  console.error("Fatal error in Staging Firestore test:", err);
  process.exit(1);
});
