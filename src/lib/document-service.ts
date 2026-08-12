import { AppDocument, DocumentUploadInput, StoredDocument } from './types';
import {
  DocumentRepository,
  LocalDocumentRepository,
  FirebaseStorageDocumentRepository,
} from './document-repository';
import { workflowEngine } from './workflow-engine';

class DocumentService {
  private _repository?: DocumentRepository;
  private cache: Map<string, AppDocument> = new Map();

  private get repo(): DocumentRepository {
    if (!this._repository) {
      this._repository = new FirebaseStorageDocumentRepository('company_default', true);
    }
    return this._repository;
  }

  constructor(repo?: DocumentRepository) {
    if (repo) {
      this._repository = repo;
    }
  }

  /**
   * Sets the repository implementation (e.g. for testing or mock switching).
   */
  setRepository(repo: DocumentRepository): void {
    this._repository = repo;
  }

  /**
   * Uploads or registers a document in the document service repository.
   */
  async uploadDocument(input: DocumentUploadInput): Promise<StoredDocument> {
    if (!input.documentId) {
      throw new Error('Dokumenten-ID fehlt.');
    }
    const stored = await this.repo.uploadDocument(input);
    this.cache.set(stored.id, stored);
    return stored;
  }

  /**
   * Legacy bridge: Registers or updates a document using AppDocument format.
   */
  registerDocument(docItem: AppDocument): AppDocument {
    if (!docItem.id) {
      throw new Error('Dokumenten-ID fehlt.');
    }

    this.cache.set(docItem.id, docItem);

    // Fire and forget upload to document repository
    this.uploadDocument({
      documentId: docItem.id,
      fileName: `${docItem.docNumber || docItem.id}.pdf`,
      mimeType: 'application/pdf',
      dataUrl: docItem.dataUrl,
      customerId: docItem.customerId,
      customerName: docItem.customerName,
      docNumber: docItem.docNumber,
      type: docItem.type,
      amount: docItem.amount,
      date: docItem.date,
    }).catch(err => {
      console.warn('DocumentService background upload warning:', err);
    });

    return docItem;
  }

  /**
   * Retrieves a document by its ID (synchronous attempt from local cache or async fallback).
   */
  getDocument(id: string): AppDocument | undefined {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    let result: AppDocument | undefined;
    // Attempt synchronous resolution from repo if local
    if ('getDocument' in this.repo) {
      const promise = this.repo.getDocument(id);
      // If already resolved or sync mock
      promise.then(doc => {
        if (doc) {
          this.cache.set(id, doc);
          result = doc;
        }
      }).catch(() => {});
    }
    return result;
  }

  /**
   * Async get document.
   */
  async getDocumentAsync(id: string): Promise<StoredDocument | undefined> {
    return this.repo.getDocument(id);
  }

  /**
   * Retrieves the download URL for a document.
   */
  async getDownloadUrl(id: string): Promise<string> {
    return this.repo.getDownloadUrl(id);
  }

  /**
   * Checks if a document exists.
   */
  async hasDocument(id: string): Promise<boolean> {
    return this.repo.documentExists(id);
  }

  /**
   * Returns all registered documents asynchronously.
   */
  async getAllDocumentsAsync(): Promise<StoredDocument[]> {
    return this.repo.getAllDocuments();
  }

  /**
   * Synchronous getAllDocuments fallback.
   */
  getAllDocuments(): AppDocument[] {
    let list: AppDocument[] = [];
    this.repo.getAllDocuments().then(res => {
      list = res;
    }).catch(() => {});
    return list;
  }

  /**
   * Deletes a document by ID.
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      await this.repo.deleteDocument(id);
      return true;
    } catch (e: any) {
      console.error('Delete document failed:', e.message);
      throw e;
    }
  }

  /**
   * Migrates existing local documents with dataUrl to Firebase Storage.
   * Idempotent migration.
   */
  async migrateLocalDocuments(): Promise<{ migrated: number; skipped: number; failed: number }> {
    const allDocs = await this.repo.getAllDocuments();
    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const docItem of allDocs) {
      if (docItem.dataUrl && docItem.metadata?.uploadStatus !== 'available') {
        try {
          await this.repo.uploadDocument({
            documentId: docItem.id,
            fileName: `${docItem.docNumber || docItem.id}.pdf`,
            mimeType: docItem.metadata?.mimeType || 'application/pdf',
            dataUrl: docItem.dataUrl,
            customerId: docItem.customerId,
            customerName: docItem.customerName,
            docNumber: docItem.docNumber,
            type: docItem.type,
            amount: docItem.amount,
            date: docItem.date,
          });
          migrated++;
        } catch (e) {
          failed++;
        }
      } else {
        skipped++;
      }
    }

    workflowEngine.emitEvent('DOCUMENT_MIGRATION_COMPLETED', 'DocumentService', {
      migrated,
      skipped,
      failed,
    });

    return { migrated, skipped, failed };
  }

  /**
   * Clears all registered documents (useful for testing).
   */
  clear(): void {
    this.cache.clear();
    if ('clear' in this.repo && typeof (this.repo as any).clear === 'function') {
      (this.repo as any).clear();
    }
  }
}

export const documentService = new DocumentService();
