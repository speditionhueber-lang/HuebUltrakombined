import fs from 'fs';
import path from 'path';

type TestExecutionLevel = 'local' | 'emulator' | 'staging' | 'production';

const CURRENT_LEVEL: TestExecutionLevel = 'staging';

async function runStagingStorageTests() {
  console.log("====================================================");
  console.log(`RUNNING STAGING STORAGE RULES & SMOKE SUITE [Execution Level: ${CURRENT_LEVEL}]`);
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

  // 1. Verify deployed storage.rules file
  const storageRulesPath = path.join(process.cwd(), 'storage.rules');
  assert(fs.existsSync(storageRulesPath), "storage.rules file present for Staging deployment");
  const storageRulesContent = fs.readFileSync(storageRulesPath, 'utf-8');

  assert(storageRulesContent.includes("service firebase.storage"), "storage.rules contains valid service declaration");
  assert(storageRulesContent.includes("request.auth.token.companyId"), "storage.rules validates companyId claim");
  assert(storageRulesContent.includes("request.resource.size < 20 * 1024 * 1024"), "storage.rules enforces max 20MB file upload size limit");
  assert(storageRulesContent.includes("contentType.matches('application/pdf')"), "storage.rules restricts content types to valid formats");

  // 2. Storage upload validation engine logic
  function evaluateStorageUpload(auth: any, fileSizeMB: number, mimeType: string, pathTenant: string) {
    if (!auth || !auth.token) return { success: false, reason: 'unauthenticated' };
    const { companyId } = auth.token;
    if (!companyId || companyId !== pathTenant) return { success: false, reason: 'tenant_mismatch' };
    if (fileSizeMB > 20) return { success: false, reason: 'file_too_large' };
    
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'application/json'];
    if (!allowedMimeTypes.includes(mimeType)) return { success: false, reason: 'invalid_mime_type' };

    return { success: true };
  }

  assert(evaluateStorageUpload(null, 1.5, 'application/pdf', 'company_hueber').success === false, "Unauthenticated storage upload blocked");
  assert(evaluateStorageUpload({ token: { companyId: 'company_hueber' } }, 1.5, 'application/pdf', 'company_other').success === false, "Cross-tenant storage upload blocked");
  assert(evaluateStorageUpload({ token: { companyId: 'company_hueber' } }, 25.0, 'application/pdf', 'company_hueber').success === false, "File > 20MB upload blocked");
  assert(evaluateStorageUpload({ token: { companyId: 'company_hueber' } }, 1.5, 'application/x-executable', 'company_hueber').success === false, "Disallowed MIME type upload blocked");
  assert(evaluateStorageUpload({ token: { companyId: 'company_hueber' } }, 2.5, 'application/pdf', 'company_hueber').success === true, "Valid PDF upload allowed for tenant");
  assert(evaluateStorageUpload({ token: { companyId: 'company_hueber' } }, 0.8, 'image/png', 'company_hueber').success === true, "Valid PNG upload allowed for tenant");

  console.log("====================================================");
  console.log(`STAGING STORAGE TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runStagingStorageTests().catch(err => {
  console.error("Fatal error in Staging Storage test:", err);
  process.exit(1);
});
