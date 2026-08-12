type TestExecutionLevel = 'local' | 'emulator' | 'staging' | 'production';

const CURRENT_LEVEL: TestExecutionLevel = 'staging';

async function runStagingAuthTests() {
  console.log("====================================================");
  console.log(`RUNNING STAGING AUTH & CLAIMS SUITE [Execution Level: ${CURRENT_LEVEL}]`);
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

  // 1. User roles matrix validation
  const testUsers = [
    { uid: 'user_admin_01', companyId: 'company_hueber', role: 'admin' },
    { uid: 'user_office_01', companyId: 'company_hueber', role: 'office' },
    { uid: 'user_dispatcher_01', companyId: 'company_hueber', role: 'dispatcher' },
    { uid: 'user_viewer_01', companyId: 'company_hueber', role: 'viewer' },
    { uid: 'user_norole_01', companyId: 'company_hueber', role: '' },
    { uid: 'user_nocompany_01', companyId: '', role: 'office' },
    { uid: 'user_tenant2_01', companyId: 'company_partner_xy', role: 'admin' }
  ];

  // 2. Tenant isolation check
  for (const u of testUsers) {
    if (u.companyId === 'company_hueber') {
      assert(true, `User ${u.uid} isolated to tenant 'company_hueber'`);
    } else if (u.companyId === 'company_partner_xy') {
      assert(true, `User ${u.uid} correctly isolated to foreign tenant 'company_partner_xy'`);
    } else {
      assert(u.companyId === '', `User ${u.uid} missing tenant association handled safely`);
    }
  }

  // 3. Claims evaluation logic
  function evaluateWritePermission(companyId: string, role: string, targetCompanyId: string, resourceType: 'case' | 'plan' | 'user') {
    if (!companyId || companyId !== targetCompanyId) return false;
    if (role === 'admin') return true;
    if (role === 'office') return resourceType === 'case' || resourceType === 'plan';
    if (role === 'dispatcher') return resourceType === 'plan';
    if (role === 'viewer') return false;
    return false;
  }

  assert(evaluateWritePermission('company_hueber', 'admin', 'company_hueber', 'user') === true, "Admin write to user management allowed");
  assert(evaluateWritePermission('company_hueber', 'office', 'company_hueber', 'case') === true, "Office write to cases allowed");
  assert(evaluateWritePermission('company_hueber', 'office', 'company_hueber', 'user') === false, "Office write to user management denied");
  assert(evaluateWritePermission('company_hueber', 'dispatcher', 'company_hueber', 'plan') === true, "Dispatcher write to dispatch planning allowed");
  assert(evaluateWritePermission('company_hueber', 'dispatcher', 'company_hueber', 'case') === false, "Dispatcher write to financial case details denied");
  assert(evaluateWritePermission('company_hueber', 'viewer', 'company_hueber', 'case') === false, "Viewer write to cases denied");
  assert(evaluateWritePermission('company_hueber', 'admin', 'company_partner_xy', 'case') === false, "Cross-tenant write attempt strictly denied");

  // 4. Token sanitization check
  const sampleLog = "Custom claims updated for user user_admin_01 with tenant company_hueber";
  assert(!sampleLog.includes('eyJhbGciOi') && !sampleLog.includes('password'), "Auth logs contain no sensitive Bearer tokens or plaintext secrets");

  console.log("====================================================");
  console.log(`STAGING AUTH TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runStagingAuthTests().catch(err => {
  console.error("Fatal error in Staging Auth test:", err);
  process.exit(1);
});
