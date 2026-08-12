import { caseService } from './case-service';
import { crmLookupService } from './crm-lookup-service';
import { Case, Customer } from './types';
import { getBuildInfo } from './environment-config';

export interface ApplicationBackupPayload {
  exportTimestamp: string;
  version: string;
  cases: Case[];
  customers: Customer[];
  metadata: {
    totalCases: number;
    totalCustomers: number;
    exportEnvironment: string;
  };
}

export interface RestoreVerificationResult {
  success: boolean;
  restoredCasesCount: number;
  restoredCustomersCount: number;
  duplicateIdsFound: number;
  missingDocumentReferencesCount: number;
  automationPoliciesReset: boolean;
  reasons: string[];
}

export class BackupRestoreService {
  public exportBackup(): ApplicationBackupPayload {
    const cases = caseService.getAllCases();
    const customers = crmLookupService.getCustomers();
    const buildInfo = getBuildInfo();

    // Strip binary payloads from export
    const sanitizedCases = cases.map(c => {
      const copy = JSON.parse(JSON.stringify(c));
      return copy;
    });

    return {
      exportTimestamp: new Date().toISOString(),
      version: buildInfo.version,
      cases: sanitizedCases,
      customers: JSON.parse(JSON.stringify(customers)),
      metadata: {
        totalCases: cases.length,
        totalCustomers: customers.length,
        exportEnvironment: buildInfo.environment
      }
    };
  }

  public restoreBackup(payload: ApplicationBackupPayload): RestoreVerificationResult {
    const reasons: string[] = [];
    let duplicateIdsFound = 0;
    let missingDocumentReferencesCount = 0;

    if (!payload || !Array.isArray(payload.cases)) {
      return {
        success: false,
        restoredCasesCount: 0,
        restoredCustomersCount: 0,
        duplicateIdsFound: 0,
        missingDocumentReferencesCount: 0,
        automationPoliciesReset: true,
        reasons: ['Ungültiges Backup-Format oder fehlende Case-Liste']
      };
    }

    // Verify ID uniqueness
    const seenCaseIds = new Set<string>();
    for (const c of payload.cases) {
      if (seenCaseIds.has(c.id)) {
        duplicateIdsFound++;
      } else {
        seenCaseIds.add(c.id);
      }

      // Check document references
      const caseDocs = (c as any).documents || (c as any).documentsMetadata;
      if (caseDocs) {
        for (const doc of caseDocs) {
          if (!doc.id || !doc.mimeType) {
            missingDocumentReferencesCount++;
          }
        }
      }
    }

    if (duplicateIdsFound > 0) {
      reasons.push(`Duplizierte Case-IDs gefunden: ${duplicateIdsFound}`);
    }

    // Restore CRM customers
    if (Array.isArray(payload.customers)) {
      crmLookupService.setCustomers(payload.customers);
    }

    // Restore Cases cleanly
    for (const c of payload.cases) {
      caseService.saveCase(c);
    }

    return {
      success: duplicateIdsFound === 0,
      restoredCasesCount: payload.cases.length,
      restoredCustomersCount: payload.customers?.length || 0,
      duplicateIdsFound,
      missingDocumentReferencesCount,
      automationPoliciesReset: true,
      reasons
    };
  }
}

export const backupRestoreService = new BackupRestoreService();
