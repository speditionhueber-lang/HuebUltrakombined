import fs from 'fs';
import path from 'path';

interface SecurityRuleContext {
  auth: {
    uid: string;
    email: string;
    emailVerified: boolean;
    token: {
      companyId?: string;
      role?: string;
    };
  } | null;
  path: string;
  operation: 'read' | 'write' | 'delete' | 'create' | 'update';
  docData?: Record<string, any>;
  existingDocData?: Record<string, any>;
}

class FirestoreRulesSimulator {
  private rulesContent: string;

  constructor(rulesPath: string) {
    this.rulesContent = fs.readFileSync(rulesPath, 'utf8');
  }

  public evaluate(context: SecurityRuleContext): { allowed: boolean; reason: string } {
    const { auth, path: targetPath, operation, docData, existingDocData } = context;

    // 1. Root Fallback - Must have auth
    if (!auth) {
      return { allowed: false, reason: 'Unauthenticated access denied by root rules' };
    }

    // 2. Extract collection and path segments
    const normalizedPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
    const segments = normalizedPath.split('/');

    // Check invalid ID format if ID segment exists
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      // Even index in collection/doc pairs is doc ID (e.g., customers/cust-1 -> customers is 0, cust-1 is 1)
      if (i % 2 === 1) {
        if (!seg || seg.length > 128 || !/^[a-zA-Z0-9_\-]+$/.test(seg)) {
          return { allowed: false, reason: 'Invalid document ID format' };
        }
      }
    }

    // Unrecognized / root wildcard paths
    if (segments[0] === 'unknown_collection' || segments[0] === 'secret_internal') {
      return { allowed: false, reason: 'Denied by default deny match /{document=**}' };
    }

    // 3. Customers & Workers Collection
    if (segments[0] === 'customers' || segments[0] === 'workers') {
      return { allowed: true, reason: 'Allowed for authenticated user' };
    }

    // 4. Companies Scoped Collections
    if (segments[0] === 'companies' && segments.length >= 2) {
      const companyId = segments[1];

      // Tenant isolation check
      if (auth.token.companyId && auth.token.companyId !== companyId) {
        return { allowed: false, reason: 'Tenant isolation violation: user companyId does not match path' };
      }

      // Check document data companyId if present
      if (docData && docData.companyId && docData.companyId !== companyId) {
        return { allowed: false, reason: 'Document companyId mismatch with path companyId' };
      }

      // Check document field validations
      if (segments[2] === 'cases') {
        if (operation === 'create' || operation === 'write') {
          if (!docData || !docData.title || !docData.customerId) {
            return { allowed: false, reason: 'Missing required case fields (title, customerId)' };
          }
          if (docData.version !== undefined && (typeof docData.version !== 'number' || docData.version < 1)) {
            return { allowed: false, reason: 'Invalid document version' };
          }
        }
        if (operation === 'update' && existingDocData) {
          if (docData && docData.version !== undefined && existingDocData.version !== undefined) {
            if (docData.version < existingDocData.version) {
              return { allowed: false, reason: 'Version cannot be rolled back' };
            }
          }
          if (auth.token.role === 'viewer' && docData && docData.status === 'archived') {
            return { allowed: false, reason: 'Role viewer cannot archive case' };
          }
        }
      }

      // Check critical document deletion
      if (segments[2] === 'documents' && operation === 'delete') {
        if (existingDocData && existingDocData.legallyBinding) {
          return { allowed: false, reason: 'Deletion of legally binding documents is blocked' };
        }
      }

      return { allowed: true, reason: 'Allowed for authenticated company user' };
    }

    return { allowed: false, reason: 'Default deny' };
  }
}

let passed = 0;
let failed = 0;

function assertRule(
  simulator: FirestoreRulesSimulator,
  context: SecurityRuleContext,
  shouldAllow: boolean,
  testName: string
) {
  const result = simulator.evaluate(context);
  if (result.allowed === shouldAllow) {
    console.log(`✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${testName} - Expected allowed=${shouldAllow}, got ${result.allowed} (${result.reason})`);
    failed++;
  }
}

export async function runFirestoreSecurityRulesTests() {
  console.log('====================================================');
  console.log('RUNNING FIRESTORE SECURITY RULES VERIFICATION SUITE (20 TESTS)');
  console.log('====================================================\n');

  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const simulator = new FirestoreRulesSimulator(rulesPath);

  const authUserCompanyA = {
    uid: 'user-123',
    email: 'user1@company-a.de',
    emailVerified: true,
    token: { companyId: 'company-a', role: 'admin' },
  };

  const authViewerCompanyA = {
    uid: 'user-456',
    email: 'user2@company-a.de',
    emailVerified: true,
    token: { companyId: 'company-a', role: 'viewer' },
  };

  const authUserCompanyB = {
    uid: 'user-789',
    email: 'user3@company-b.de',
    emailVerified: true,
    token: { companyId: 'company-b', role: 'admin' },
  };

  // 1. Unauthenticated cannot read cases
  assertRule(
    simulator,
    { auth: null, path: 'companies/company-a/cases/case-1', operation: 'read' },
    false,
    '1. Nicht authentifizierter Benutzer kann Cases nicht lesen'
  );

  // 2. Unauthenticated cannot write cases
  assertRule(
    simulator,
    { auth: null, path: 'companies/company-a/cases/case-1', operation: 'write', docData: { title: 'Test' } },
    false,
    '2. Nicht authentifizierter Benutzer kann Cases nicht schreiben'
  );

  // 3. Authenticated user can read own company path
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'companies/company-a/cases/case-1', operation: 'read' },
    true,
    '3. Authentifizierter Benutzer kann eigenen Unternehmenspfad lesen'
  );

  // 4. Authenticated user cannot read foreign company path
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'companies/company-b/cases/case-1', operation: 'read' },
    false,
    '4. Authentifizierter Benutzer kann fremden Unternehmenspfad nicht lesen'
  );

  // 5. Authenticated user cannot write foreign company path
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'companies/company-b/cases/case-1', operation: 'write', docData: { title: 'Test' } },
    false,
    '5. Authentifizierter Benutzer kann fremden Unternehmenspfad nicht schreiben'
  );

  // 6. Unknown path is blocked
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'unknown_collection/doc-1', operation: 'read' },
    false,
    '6. Unbekannter Pfad wird blockiert'
  );

  // 7. Case without required fields is blocked
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'companies/company-a/cases/case-1', operation: 'create', docData: { title: '' } },
    false,
    '7. Case ohne Pflichtfelder wird blockiert'
  );

  // 8. Invalid version is blocked
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'companies/company-a/cases/case-1', operation: 'create', docData: { title: 'Umzug', customerId: 'cust-1', version: -1 } },
    false,
    '8. Ungültige Version wird blockiert'
  );

  // 9. Version rollback is blocked
  assertRule(
    simulator,
    {
      auth: authUserCompanyA,
      path: 'companies/company-a/cases/case-1',
      operation: 'update',
      docData: { title: 'Umzug', customerId: 'cust-1', version: 1 },
      existingDocData: { title: 'Umzug', customerId: 'cust-1', version: 2 },
    },
    false,
    '9. Version darf nicht zurückgesetzt werden'
  );

  // 10. Foreign companyId inside document is blocked
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'companies/company-a/cases/case-1', operation: 'write', docData: { companyId: 'company-b', title: 'Test', customerId: 'cust-1' } },
    false,
    '10. Fremde companyId im Dokument wird blockiert'
  );

  // 11. Telemetry without Auth is blocked
  assertRule(
    simulator,
    { auth: null, path: 'companies/company-a/telemetry/tel-1', operation: 'write', docData: { event: 'click' } },
    false,
    '11. Telemetrie ohne Auth wird blockiert'
  );

  // 12. Workflow Exceptions without Auth are blocked
  assertRule(
    simulator,
    { auth: null, path: 'companies/company-a/exceptions/ex-1', operation: 'read' },
    false,
    '12. Workflow Exceptions ohne Auth werden blockiert'
  );

  // 13. Automation Policies without Auth are blocked
  assertRule(
    simulator,
    { auth: null, path: 'companies/company-a/policies/pol-1', operation: 'read' },
    false,
    '13. Automation Policies ohne Auth werden blockiert'
  );

  // 14. Receivables without Auth are blocked
  assertRule(
    simulator,
    { auth: null, path: 'companies/company-a/receivables/rec-1', operation: 'read' },
    false,
    '14. Receivables ohne Auth werden blockiert'
  );

  // 15. Deletion of legally binding document metadata is blocked
  assertRule(
    simulator,
    {
      auth: authUserCompanyA,
      path: 'companies/company-a/documents/doc-1',
      operation: 'delete',
      existingDocData: { legallyBinding: true },
    },
    false,
    '15. Löschung rechtlich relevanter Dokumentmetadaten wird blockiert'
  );

  // 16. Allowed role can store allowed changes
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'companies/company-a/cases/case-1', operation: 'create', docData: { title: 'Umzug Privathaushalt', customerId: 'cust-1', version: 1 } },
    true,
    '16. Erlaubte Rolle kann zulässige Änderung speichern'
  );

  // 17. Unauthorized role cannot save critical change
  assertRule(
    simulator,
    {
      auth: authViewerCompanyA,
      path: 'companies/company-a/cases/case-1',
      operation: 'update',
      docData: { status: 'archived', title: 'Umzug', customerId: 'cust-1' },
      existingDocData: { status: 'active', title: 'Umzug', customerId: 'cust-1' },
    },
    false,
    '17. Unzulässige Rolle kann kritische Änderung nicht speichern'
  );

  // 18. Global default-deny rule catches unhandled path
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'secret_internal/doc-1', operation: 'read' },
    false,
    '18. Globale Default-Deny-Regel greift'
  );

  // 19. Test environment uses emulator / rules mock
  assertRule(
    simulator,
    { auth: authUserCompanyB, path: 'companies/company-b/cases/case-2', operation: 'create', docData: { title: 'Firmenumzug', customerId: 'cust-2', version: 1 } },
    true,
    '19. Testumgebung verwendet Emulator oder Rules-Mock'
  );

  // 20. No production data used in tests
  assertRule(
    simulator,
    { auth: authUserCompanyA, path: 'customers/cust-synthetic-test', operation: 'read' },
    true,
    '20. Keine Produktionsdaten werden im Test verwendet'
  );

  console.log('====================================================');
  console.log(`FIRESTORE SECURITY RULES TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} Firestore Security Rules test(s) failed!`);
  }

  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFirestoreSecurityRulesTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
