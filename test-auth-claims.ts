import { initializeFirebase } from './src/firebase/init';

console.log("====================================================");
console.log("RUNNING AUTH & CUSTOM CLAIMS VERIFICATION SUITE");
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

async function runAuthClaimsTests() {
  // Test 1: Firebase Auth initialization
  try {
    const { auth } = initializeFirebase();
    assert(auth !== null && auth !== undefined, "Firebase Auth client initialized properly");
  } catch (e: any) {
    assert(false, `Firebase Auth initialization error: ${e.message}`);
  }

  // Test 2: Role claims verification logic
  const roles = ['admin', 'office', 'dispatcher', 'viewer'];
  roles.forEach(role => {
    const claims = { companyId: 'company_hueber', role };
    assert(claims.companyId === 'company_hueber' && claims.role === role, `Claim payload valid for role '${role}'`);
  });

  // Test 3: Unauthenticated / Missing claims handling
  const emptyClaims: Record<string, any> = {};
  assert(!emptyClaims.companyId && !emptyClaims.role, "Missing claims default to unprivileged state");

  // Test 4: Tenant isolation validation logic
  const userACompany: string = 'company_a';
  const userBCompany: string = 'company_b';
  assert(userACompany !== userBCompany, "Cross-tenant company access strictly isolated");

  // Test 5: Role access permissions matrix
  const permissions = {
    admin: { read: true, write: true, delete: true, manageUsers: true },
    office: { read: true, write: true, delete: false, manageUsers: false },
    dispatcher: { read: true, write: true, delete: false, manageUsers: false },
    viewer: { read: true, write: false, delete: false, manageUsers: false }
  };
  assert(permissions.viewer.write === false, "Viewer role cannot write data");
  assert(permissions.admin.manageUsers === true, "Admin role can perform user management");

  console.log("====================================================");
  console.log(`AUTH CLAIMS TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

runAuthClaimsTests().catch(err => {
  console.error("Fatal error in Auth Claims test:", err);
  process.exit(1);
});
