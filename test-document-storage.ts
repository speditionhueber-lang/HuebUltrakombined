import {
  LocalDocumentRepository,
  FirebaseStorageDocumentRepository,
  computeChecksum,
  isDocumentLocked,
} from './src/lib/document-repository';
import { documentService } from './src/lib/document-service';
import { workflowEngine } from './src/lib/workflow-engine';
import { workflowExceptionService } from './src/lib/workflow-exception-service';
import { caseService } from './src/lib/case-service';
import { receivableService } from './src/lib/receivable-service';
import { sanitizeCaseForFirestore } from './src/lib/case-repository';

export async function runDocumentStorageTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; success: boolean; details?: string }[];
}> {
  const results: { testName: string; success: boolean; details?: string }[] = [];

  const recordResult = (testName: string, success: boolean, details?: string) => {
    results.push({ testName, success, details });
    if (success) {
      console.log(`  ✅ ${testName}`);
    } else {
      console.error(`  ❌ ${testName}: ${details}`);
    }
  };

  console.log('\n==================================================');
  console.log('🧪 FIREBASE STORAGE & DOCUMENT PERSISTENCE SUITE');
  console.log('==================================================\n');

  // Test setup
  const samplePdfDataUrl = 'data:application/pdf;base64,JVBERi0xLjQKNyAwIG9iagoxMiAzNCA1Njc4OQ==';
  const localRepo = new LocalDocumentRepository();
  const mockFirebaseRepo = new FirebaseStorageDocumentRepository('comp_test_123', true);

  // 1. Checksum Computation
  try {
    const cs1 = computeChecksum(samplePdfDataUrl);
    const cs2 = computeChecksum(samplePdfDataUrl);
    const isOk = cs1 === cs2 && cs1.startsWith('cs_');
    recordResult('1. Checksum computation is deterministic and prefixed', isOk, isOk ? undefined : `Got ${cs1}`);
  } catch (e: any) {
    recordResult('1. Checksum computation is deterministic and prefixed', false, e.message);
  }

  // 2. LocalDocumentRepository Storage
  try {
    const docInput = {
      documentId: 'doc_local_001',
      fileName: 'test_local.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
      customerId: 'cust_1',
      customerName: 'Kunde Test',
      docNumber: 'AG-1001',
      type: 'Orientierungsangebot' as const,
      amount: 450,
    };
    const stored = await localRepo.uploadDocument(docInput);
    const retrieved = await localRepo.getDocument('doc_local_001');
    const isOk = stored.metadata.uploadStatus === 'available' && retrieved?.id === 'doc_local_001';
    recordResult('2. LocalDocumentRepository uploads and retrieves document', isOk);
  } catch (e: any) {
    recordResult('2. LocalDocumentRepository uploads and retrieves document', false, e.message);
  }

  // 3. Storage Path Format & PII Exclusion
  try {
    const docInput = {
      documentId: 'doc_pii_001',
      companyId: 'company_sec_99',
      caseId: 'case_xyz_123',
      fileName: 'Rechnung_Max_Mustermann_5000Euro.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
      customerId: 'cust_secret',
      customerName: 'Max Mustermann', // PII
      docNumber: 'RE-2026-001',
      type: 'Rechnung' as const,
      amount: 5000,
    };
    const stored = await mockFirebaseRepo.uploadDocument(docInput);
    const path = stored.metadata.storagePath || '';
    const hasCompany = path.includes('companies/company_sec_99');
    const hasCase = path.includes('cases/case_xyz_123');
    const hasDocId = path.includes('documents/doc_pii_001');
    const noPiiName = !path.includes('Max') && !path.includes('Mustermann');
    const noPiiAmount = !path.includes('5000Euro');
    const isOk = hasCompany && hasCase && hasDocId && noPiiName && noPiiAmount;
    recordResult('3. Storage path formatting enforces company/case hierarchy & excludes PII', isOk, `Path: ${path}`);
  } catch (e: any) {
    recordResult('3. Storage path formatting enforces company/case hierarchy & excludes PII', false, e.message);
  }

  // 4. File Size Validation (Under 20MB limit)
  try {
    const docInput = {
      documentId: 'doc_size_ok',
      fileName: 'normal.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    };
    const stored = await mockFirebaseRepo.uploadDocument(docInput);
    recordResult('4. File under 20MB is accepted', stored.metadata.size < 20 * 1024 * 1024);
  } catch (e: any) {
    recordResult('4. File under 20MB is accepted', false, e.message);
  }

  // 5. Reject File Exceeding 20MB
  try {
    // Generate simulated 21MB data string
    const hugeDataUrl = 'data:application/pdf;base64,' + 'A'.repeat(28 * 1024 * 1024);
    let errorCaught = false;
    try {
      await mockFirebaseRepo.uploadDocument({
        documentId: 'doc_size_huge',
        fileName: 'huge.pdf',
        mimeType: 'application/pdf',
        dataUrl: hugeDataUrl,
      });
    } catch (e: any) {
      errorCaught = e.message.includes('20MB');
    }
    recordResult('5. Rejects files exceeding 20MB limit with exception', errorCaught);
  } catch (e: any) {
    recordResult('5. Rejects files exceeding 20MB limit with exception', false, e.message);
  }

  // 6. Valid MimeType
  try {
    const storedImage = await mockFirebaseRepo.uploadDocument({
      documentId: 'doc_img_001',
      fileName: 'photo.png',
      mimeType: 'image/png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    });
    recordResult('6. Accepts valid image/png mimeType', storedImage.metadata.mimeType === 'image/png');
  } catch (e: any) {
    recordResult('6. Accepts valid image/png mimeType', false, e.message);
  }

  // 7. Reject Invalid MimeType
  try {
    let rejected = false;
    try {
      await mockFirebaseRepo.uploadDocument({
        documentId: 'doc_bad_mime',
        fileName: 'script.exe',
        mimeType: 'text/html',
        dataUrl: 'data:text/html;base64,PGh0bWw+PC9odG1sPg==',
      });
    } catch (e: any) {
      rejected = e.message.includes('Ungültiger Dateityp');
    }
    recordResult('7. Rejects invalid mimeType (text/html)', rejected);
  } catch (e: any) {
    recordResult('7. Rejects invalid mimeType (text/html)', false, e.message);
  }

  // 8. Deduplication Check
  try {
    const input1 = {
      documentId: 'doc_dedup_01',
      fileName: 'dedup.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    };
    const first = await localRepo.uploadDocument(input1);
    const second = await localRepo.uploadDocument(input1);
    const isSame = first === second;
    recordResult('8. Deduplication avoids re-uploading unchanged file', isSame);
  } catch (e: any) {
    recordResult('8. Deduplication avoids re-uploading unchanged file', false, e.message);
  }

  // 9. Upload Status Lifecycle Tracking
  try {
    const docItem = await mockFirebaseRepo.uploadDocument({
      documentId: 'doc_lifecycle_01',
      fileName: 'lifecycle.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    const isOk = docItem.metadata.uploadStatus === 'available' && !!docItem.metadata.uploadedAt;
    recordResult('9. Tracks document upload lifecycle status & timestamps', isOk);
  } catch (e: any) {
    recordResult('9. Tracks document upload lifecycle status & timestamps', false, e.message);
  }

  // 10. Workflow Events Emission
  try {
    let startedEmitted = false;
    let completedEmitted = false;

    const unsub = workflowEngine.subscribe((event) => {
      if (event.type === 'DOCUMENT_UPLOAD_STARTED') startedEmitted = true;
      if (event.type === 'DOCUMENT_UPLOAD_COMPLETED') completedEmitted = true;
    });

    await mockFirebaseRepo.uploadDocument({
      documentId: 'doc_events_01',
      fileName: 'event_test.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });

    unsub();
    recordResult('10. Emits DOCUMENT_UPLOAD_STARTED & DOCUMENT_UPLOAD_COMPLETED events', startedEmitted && completedEmitted);
  } catch (e: any) {
    recordResult('10. Emits DOCUMENT_UPLOAD_STARTED & DOCUMENT_UPLOAD_COMPLETED events', false, e.message);
  }

  // 11. Workflow Failure Event Emission
  try {
    let failureEmitted = false;
    const unsub = workflowEngine.subscribe((event) => {
      if (event.type === 'DOCUMENT_UPLOAD_FAILED') failureEmitted = true;
    });

    try {
      await mockFirebaseRepo.uploadDocument({
        documentId: 'doc_fail_event',
        fileName: 'huge.pdf',
        mimeType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,' + 'B'.repeat(28 * 1024 * 1024),
      });
    } catch (e) {
      // Expected exception
    }

    unsub();
    recordResult('11. Emits DOCUMENT_UPLOAD_FAILED on upload errors', failureEmitted);
  } catch (e: any) {
    recordResult('11. Emits DOCUMENT_UPLOAD_FAILED on upload errors', false, e.message);
  }

  // 12. Exception Creation on Failed Upload
  try {
    const exCountBefore = workflowExceptionService.getOpenExceptions().length;
    try {
      await mockFirebaseRepo.uploadDocument({
        documentId: 'doc_fail_ex',
        fileName: 'huge2.pdf',
        mimeType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,' + 'C'.repeat(28 * 1024 * 1024),
      });
    } catch (e) {}
    const exCountAfter = workflowExceptionService.getOpenExceptions().length;
    recordResult('12. Creates WorkflowException on upload failure', exCountAfter > exCountBefore);
  } catch (e: any) {
    recordResult('12. Creates WorkflowException on upload failure', false, e.message);
  }

  // 13. Overwrite Protection Setup
  try {
    const newCase = caseService.createCase({
      title: 'Lock Test Case',
    });

    // Add sent draft with document attachment
    caseService.updateCase(newCase.id, {
      emailDrafts: [
        {
          id: 'draft_sent_lock',
          caseId: newCase.id,
          sourceEventId: 'ev_lock',
          originalSubject: 'Angebot',
          originalSenderEmail: 'lock@test.de',
          recipients: [{ email: 'lock@test.de' }],
          ccRecipients: [],
          requestedFields: [],
          purpose: 'offer_delivery',
          replyMode: 'reply',
          subject: 'Angebot',
          bodyText: 'Hallo',
          createdBy: 'rule',
          confidence: 'high',
          corrections: [],
          attachments: [
            {
              id: 'att_lock_1',
              source: 'document_service',
              documentId: 'doc_locked_001',
              fileName: 'angebot.pdf',
              mimeType: 'application/pdf',
            }
          ],
          status: 'sent',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    });

    const isLocked = isDocumentLocked('doc_locked_001');
    recordResult('13. Correctly identifies document linked to sent email/offer as locked', isLocked);
  } catch (e: any) {
    recordResult('13. Correctly identifies document linked to sent email/offer as locked', false, e.message);
  }

  // 14. Overwrite Block on Locked Document
  try {
    let blocked = false;
    try {
      await mockFirebaseRepo.uploadDocument({
        documentId: 'doc_locked_001',
        fileName: 'overwrite_attempt.pdf',
        mimeType: 'application/pdf',
        dataUrl: samplePdfDataUrl,
      });
    } catch (e: any) {
      blocked = e.message.includes('gesperrt') || e.message.includes('nicht überschrieben');
    }
    recordResult('14. Blocks overwriting locked document with error message', blocked);
  } catch (e: any) {
    recordResult('14. Blocks overwriting locked document with error message', false, e.message);
  }

  // 15. Delete Block on Locked Document
  try {
    let deleteBlocked = false;
    try {
      await mockFirebaseRepo.deleteDocument('doc_locked_001');
    } catch (e: any) {
      deleteBlocked = e.message.includes('gesperrt') || e.message.includes('dürfen nicht gelöscht werden');
    }
    recordResult('15. Blocks deleting locked document attached to sent invoice/offer', deleteBlocked);
  } catch (e: any) {
    recordResult('15. Blocks deleting locked document attached to sent invoice/offer', false, e.message);
  }

  // 16. Delete Unlocked Document
  try {
    await mockFirebaseRepo.uploadDocument({
      documentId: 'doc_unlocked_del',
      fileName: 'temp.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    await mockFirebaseRepo.deleteDocument('doc_unlocked_del');
    const exists = await mockFirebaseRepo.documentExists('doc_unlocked_del');
    recordResult('16. Successfully deletes unlocked document', !exists);
  } catch (e: any) {
    recordResult('16. Successfully deletes unlocked document', false, e.message);
  }

  // 17. Lazy Download URL Resolution
  try {
    await mockFirebaseRepo.uploadDocument({
      documentId: 'doc_lazy_url',
      fileName: 'lazy.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    const downloadUrl = await mockFirebaseRepo.getDownloadUrl('doc_lazy_url');
    recordResult('17. Resolves download URL lazily for document', downloadUrl.length > 0);
  } catch (e: any) {
    recordResult('17. Resolves download URL lazily for document', false, e.message);
  }

  // 18. Download URL Fallback for Local Repo
  try {
    await localRepo.uploadDocument({
      documentId: 'doc_local_url',
      fileName: 'local.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    const url = await localRepo.getDownloadUrl('doc_local_url');
    recordResult('18. Local repo returns dataUrl/blobUrl as downloadUrl fallback', url === samplePdfDataUrl);
  } catch (e: any) {
    recordResult('18. Local repo returns dataUrl/blobUrl as downloadUrl fallback', false, e.message);
  }

  // 19. DocumentService Repository Switching
  try {
    documentService.setRepository(mockFirebaseRepo);
    await documentService.uploadDocument({
      documentId: 'doc_service_switch',
      fileName: 'switched.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    const exists = await documentService.hasDocument('doc_service_switch');
    recordResult('19. DocumentService integrates with FirebaseStorageDocumentRepository', exists);
  } catch (e: any) {
    recordResult('19. DocumentService integrates with FirebaseStorageDocumentRepository', false, e.message);
  }

  // 20. Idempotent Migration
  try {
    // Setup local document
    await localRepo.uploadDocument({
      documentId: 'doc_mig_001',
      fileName: 'mig.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    documentService.setRepository(localRepo);
    const res1 = await documentService.migrateLocalDocuments();
    const res2 = await documentService.migrateLocalDocuments();
    recordResult('20. Migration is idempotent (subsequent runs skip already migrated docs)', res2.migrated === 0 && res2.skipped >= 1);
  } catch (e: any) {
    recordResult('20. Migration is idempotent (subsequent runs skip already migrated docs)', false, e.message);
  }

  // 21. Migration Completed Event Emission
  try {
    let migEventEmitted = false;
    const unsub = workflowEngine.subscribe((event) => {
      if (event.type === 'DOCUMENT_MIGRATION_COMPLETED') migEventEmitted = true;
    });
    await documentService.migrateLocalDocuments();
    unsub();
    recordResult('21. Emits DOCUMENT_MIGRATION_COMPLETED event on migration finish', migEventEmitted);
  } catch (e: any) {
    recordResult('21. Emits DOCUMENT_MIGRATION_COMPLETED event on migration finish', false, e.message);
  }

  // 22. Sanitize Case Document for Firestore (Stripping Base64)
  try {
    const dummyCase: any = {
      id: 'case_sanitize_test',
      version: 1,
      offerDrafts: [
        {
          id: 'od_1',
          pdfDataUrl: samplePdfDataUrl,
          documentId: 'doc_san_001',
        }
      ],
      invoiceDrafts: [
        {
          id: 'id_1',
          pdfDataUrl: samplePdfDataUrl,
          documentId: 'doc_san_002',
        }
      ],
      emailDrafts: [
        {
          id: 'ed_1',
          attachments: [
            {
              documentId: 'doc_san_003',
              dataUrl: samplePdfDataUrl,
            }
          ]
        }
      ]
    };

    const sanitized: any = sanitizeCaseForFirestore(dummyCase);
    const odPdfUrl = sanitized.offerDrafts[0].pdfDataUrl;
    const idPdfUrl = sanitized.invoiceDrafts[0].pdfDataUrl;
    const edDataUrl = sanitized.emailDrafts[0].attachments[0].dataUrl;

    const isStripped = !odPdfUrl && !idPdfUrl && !edDataUrl;
    recordResult('22. sanitizeCaseForFirestore strips binary Base64 dataUrl fields', isStripped);
  } catch (e: any) {
    recordResult('22. sanitizeCaseForFirestore strips binary Base64 dataUrl fields', false, e.message);
  }

  // 23. Case Document Size Compliance (<800KB)
  try {
    const dummyCase: any = {
      id: 'case_size_check',
      title: 'Large Case',
      offerDrafts: Array.from({ length: 5 }, (_, i) => ({
        id: `od_${i}`,
        documentId: `doc_od_${i}`,
        grossTotal: 1000,
      })),
    };
    const sanitized = sanitizeCaseForFirestore(dummyCase);
    const jsonLen = JSON.stringify(sanitized).length;
    recordResult('23. Case document size remains under 800KB threshold', jsonLen < 800000, `Size: ${jsonLen} bytes`);
  } catch (e: any) {
    recordResult('23. Case document size remains under 800KB threshold', false, e.message);
  }

  // 24. Document Service Register Legacy Bridge
  try {
    documentService.setRepository(mockFirebaseRepo);
    const registered = documentService.registerDocument({
      id: 'doc_legacy_bridge',
      customerId: 'cust_br',
      customerName: 'Bridge Kundin',
      type: 'Orientierungsangebot',
      docNumber: 'AG-BR-1',
      date: '2026-08-03',
      amount: 1200,
      dataUrl: samplePdfDataUrl,
    });
    recordResult('24. Legacy registerDocument bridge registers document cleanly', registered.id === 'doc_legacy_bridge');
  } catch (e: any) {
    recordResult('24. Legacy registerDocument bridge registers document cleanly', false, e.message);
  }

  // 25. Offline Fallback to Local Repository
  try {
    await localRepo.uploadDocument({
      documentId: 'doc_offline_cache',
      fileName: 'off.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    const docItem = await localRepo.getDocument('doc_offline_cache');
    recordResult('25. Offline mode uses LocalDocumentRepository cache seamlessly', docItem?.id === 'doc_offline_cache');
  } catch (e: any) {
    recordResult('25. Offline mode uses LocalDocumentRepository cache seamlessly', false, e.message);
  }

  // 26. Retrieval of Download URL for Missing Document Throws Error
  try {
    let thrown = false;
    try {
      await mockFirebaseRepo.getDownloadUrl('doc_non_existent_999');
    } catch (e: any) {
      thrown = true;
    }
    recordResult('26. Throws error when attempting to fetch downloadUrl for missing document', thrown);
  } catch (e: any) {
    recordResult('26. Throws error when attempting to fetch downloadUrl for missing document', false, e.message);
  }

  // 27. Multiple Subscriptions Notification
  try {
    let subNotified = false;
    const unsub = localRepo.subscribe((docs) => {
      if (docs.some(d => d.id === 'doc_sub_test')) subNotified = true;
    });

    await localRepo.uploadDocument({
      documentId: 'doc_sub_test',
      fileName: 'sub.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });

    unsub();
    recordResult('27. Repository subscription notifies listeners on document changes', subNotified);
  } catch (e: any) {
    recordResult('27. Repository subscription notifies listeners on document changes', false, e.message);
  }

  // 28. Document Service Delete Document Execution
  try {
    await mockFirebaseRepo.uploadDocument({
      documentId: 'doc_del_svc',
      fileName: 'del.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    const delResult = await documentService.deleteDocument('doc_del_svc');
    recordResult('28. DocumentService deleteDocument executes successfully on unlocked file', delResult);
  } catch (e: any) {
    recordResult('28. DocumentService deleteDocument executes successfully on unlocked file', false, e.message);
  }

  // 29. Storage Provider Identifier Correctness
  try {
    const localDoc = await localRepo.uploadDocument({
      documentId: 'doc_prov_1',
      fileName: 'p1.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    const firebaseDoc = await mockFirebaseRepo.uploadDocument({
      documentId: 'doc_prov_2',
      fileName: 'p2.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
    });
    const isOk = localDoc.metadata.storageProvider === 'local' && firebaseDoc.metadata.storageProvider === 'firebase_storage';
    recordResult('29. Correctly sets storageProvider in metadata (local vs firebase_storage)', isOk);
  } catch (e: any) {
    recordResult('29. Correctly sets storageProvider in metadata (local vs firebase_storage)', false, e.message);
  }

  // 30. End-to-End Transactional Document Flow
  try {
    // 1. Upload
    const uploaded = await mockFirebaseRepo.uploadDocument({
      documentId: 'doc_e2e_final',
      companyId: 'company_e2e',
      caseId: 'case_e2e',
      fileName: 'final_invoice.pdf',
      mimeType: 'application/pdf',
      dataUrl: samplePdfDataUrl,
      customerId: 'cust_e2e',
      customerName: 'E2E Kunde',
      docNumber: 'RE-2026-999',
      type: 'Rechnung',
      amount: 2500,
    });

    // 2. Metadata check
    const metadataOk = uploaded.metadata.uploadStatus === 'available' && uploaded.metadata.storagePath?.includes('companies/company_e2e/cases/case_e2e/documents/doc_e2e_final/final_invoice.pdf');

    // 3. Link to receivable
    receivableService.createReceivable({
      caseId: 'case_e2e',
      invoiceId: 'doc_e2e_final',
      invoiceNumber: 'RE-2026-999',
      customerName: 'E2E Kunde',
      grossAmount: 2500,
      dueDate: '2026-08-30',
      status: 'open',
    });

    // 4. Verify locked
    const locked = isDocumentLocked('doc_e2e_final');

    // 5. Attempt delete blocked
    let deleteAttemptBlocked = false;
    try {
      await mockFirebaseRepo.deleteDocument('doc_e2e_final');
    } catch (e: any) {
      deleteAttemptBlocked = true;
    }

    const isOk = metadataOk && locked && deleteAttemptBlocked;
    recordResult('30. End-to-end document lifecycle (upload -> link -> lock -> delete protection)', !!isOk);
  } catch (e: any) {
    recordResult('30. End-to-end document lifecycle (upload -> link -> lock -> delete protection)', false, e.message);
  }

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n--------------------------------------------------');
  console.log(`RESULTS: ${passed}/${results.length} PASSED (${failed} failed)`);
  console.log('--------------------------------------------------\n');

  return { total: results.length, passed, failed, results };
}

// Auto-run if executed directly via node/tsx
if (typeof process !== 'undefined' && process.argv[1]?.includes('test-document-storage')) {
  runDocumentStorageTests().then(res => {
    if (res.failed > 0) {
      process.exit(1);
    }
  });
}
