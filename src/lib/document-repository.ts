import {
  AppDocument,
  StoredDocumentMetadata,
  DocumentUploadInput,
  StoredDocument,
} from './types';
import { workflowEngine } from './workflow-engine';
import { workflowExceptionService } from './workflow-exception-service';
import { caseService } from './case-service';
import { receivableService } from './receivable-service';
import { initializeFirebase } from '../firebase/init';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getStorage,
} from 'firebase/storage';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  deleteDoc,
  getFirestore,
} from 'firebase/firestore';

const STORAGE_KEY_DOCUMENTS = 'app_documents_v1';
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)).filter(item => item !== undefined) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export function computeChecksum(data: string | Uint8Array | ArrayBuffer): string {
  let str = '';
  if (typeof data === 'string') {
    str = data;
  } else if (data instanceof Uint8Array) {
    str = new TextDecoder().decode(data.subarray(0, 1024));
  } else if (data instanceof ArrayBuffer) {
    str = new TextDecoder().decode(new Uint8Array(data.slice(0, 1024)));
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `cs_${Math.abs(hash).toString(16)}_${str.length}`;
}

export function isDocumentLocked(documentId: string): boolean {
  // Check if linked to sent invoice, sent offer, or active receivable
  const cases = caseService.getCases();
  for (const c of cases) {
    if (c.emailDrafts) {
      for (const d of c.emailDrafts) {
        if (d.status === 'sent' && d.attachments) {
          if (d.attachments.some(a => a.documentId === documentId)) {
            return true;
          }
        }
      }
    }
  }

  // Check receivables
  const receivables = receivableService.getReceivables();
  for (const r of receivables) {
    if (r.invoiceId === documentId || r.id === documentId) {
      if (r.status === 'paid' || r.status === 'partially_paid' || r.status === 'open') {
        return true;
      }
    }
  }

  return false;
}

export interface DocumentRepository {
  uploadDocument(input: DocumentUploadInput): Promise<StoredDocument>;
  getDocument(documentId: string): Promise<StoredDocument | undefined>;
  getDownloadUrl(documentId: string): Promise<string>;
  deleteDocument(documentId: string): Promise<void>;
  documentExists(documentId: string): Promise<boolean>;
  subscribe(listener: (documents: StoredDocument[]) => void): () => void;
  getAllDocuments(): Promise<StoredDocument[]>;
}

export class LocalDocumentRepository implements DocumentRepository {
  private documents: Map<string, StoredDocument> = new Map();
  private listeners: Set<(documents: StoredDocument[]) => void> = new Set();

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DOCUMENTS);
      if (raw) {
        const list: StoredDocument[] = JSON.parse(raw);
        for (const docItem of list) {
          this.documents.set(docItem.id, docItem);
        }
      }
    } catch (e) {
      console.warn('Failed to load local documents from localStorage:', e);
    }
  }

  private saveToLocalStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = Array.from(this.documents.values());
      localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(list));
    } catch (e: any) {
      if (e?.name === 'QuotaExceededError' || e?.code === 22 || String(e).includes('quota') || String(e?.message).includes('quota')) {
        try {
          const list = Array.from(this.documents.values()).map(doc => {
            const { pdfContent, base64Data, ...rest } = doc as any;
            return rest;
          });
          localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(list));
        } catch (retryErr) {
          console.warn('LocalStorage quota limit reached for documents.');
        }
      } else {
        console.warn('Failed to save local documents to localStorage:', e?.message || e);
      }
    }
  }

  private notifyListeners() {
    const list = Array.from(this.documents.values());
    this.listeners.forEach(l => l(list));
  }

  async uploadDocument(input: DocumentUploadInput): Promise<StoredDocument> {
    if (!input.documentId) {
      throw new Error('Dokumenten-ID fehlt.');
    }

    if (isDocumentLocked(input.documentId) && this.documents.has(input.documentId)) {
      throw new Error(`Dokument ${input.documentId} ist gesperrt (versendete Rechnung/Angebot) und darf nicht überschrieben werden.`);
    }

    // Size validation
    let size = 0;
    if (input.dataUrl) {
      size = Math.round(input.dataUrl.length * 0.75);
    } else if (input.blob instanceof Uint8Array) {
      size = input.blob.length;
    } else if (input.blob instanceof ArrayBuffer) {
      size = input.blob.byteLength;
    }

    if (size > MAX_FILE_SIZE_BYTES) {
      const err = `Datei überschreitet die maximale Größe von 20MB (${(size / (1024 * 1024)).toFixed(2)} MB).`;
      workflowExceptionService.createException({
        category: 'invalid_document',
        severity: 'critical',
        sourceType: 'storage',
        sourceReferenceId: input.documentId,
        title: 'Datei zu groß',
        description: err,
        blockingReason: 'Dateigröße über 20MB',
        availableActions: [],
        status: 'open',
      });
      throw new Error(err);
    }

    // MimeType check
    const mimeType = input.mimeType || 'application/pdf';
    if (!mimeType.includes('pdf') && !mimeType.includes('image') && !mimeType.includes('application')) {
      const err = `Ungültiger Dateityp: ${mimeType}`;
      workflowExceptionService.createException({
        category: 'invalid_document',
        severity: 'warning',
        sourceType: 'storage',
        sourceReferenceId: input.documentId,
        title: 'Ungültiger Dateityp',
        description: err,
        blockingReason: 'Unzulässiges Dateiformat',
        availableActions: [],
        status: 'open',
      });
      throw new Error(err);
    }

    const checksum = computeChecksum(input.dataUrl || (input.blob instanceof Uint8Array ? input.blob : ''));

    // Check existing deduplication
    const existing = this.documents.get(input.documentId);
    if (existing && existing.metadata.checksum === checksum && existing.metadata.uploadStatus === 'available') {
      return existing;
    }

    const now = new Date().toISOString();
    const storedDoc: StoredDocument = {
      id: input.documentId,
      customerId: input.customerId || 'cust_unknown',
      customerName: input.customerName || 'Unbekannt',
      type: input.type || 'Sonstiges',
      docNumber: input.docNumber || input.documentId,
      date: input.date || now.split('T')[0],
      amount: input.amount,
      dataUrl: input.dataUrl,
      companyId: input.companyId || 'company_default',
      caseId: input.caseId,
      metadata: {
        storagePath: `local/documents/${input.documentId}/${input.fileName}`,
        downloadUrl: input.dataUrl || '',
        mimeType,
        fileName: input.fileName,
        size,
        checksum,
        storageProvider: 'local',
        uploadStatus: 'available',
        uploadedAt: now,
        updatedAt: now,
      },
    };

    this.documents.set(storedDoc.id, storedDoc);
    this.saveToLocalStorage();
    this.notifyListeners();
    return storedDoc;
  }

  async getDocument(documentId: string): Promise<StoredDocument | undefined> {
    return this.documents.get(documentId);
  }

  async getDownloadUrl(documentId: string): Promise<string> {
    const docItem = this.documents.get(documentId);
    if (!docItem) {
      throw new Error(`Dokument ${documentId} nicht im local repository gefunden.`);
    }
    return docItem.metadata.downloadUrl || docItem.dataUrl || '';
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (isDocumentLocked(documentId)) {
      throw new Error(`Dokument ${documentId} ist gesperrt und darf nicht gelöscht werden.`);
    }
    this.documents.delete(documentId);
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  async documentExists(documentId: string): Promise<boolean> {
    return this.documents.has(documentId);
  }

  subscribe(listener: (documents: StoredDocument[]) => void): () => void {
    this.listeners.add(listener);
    listener(Array.from(this.documents.values()));
    return () => this.listeners.delete(listener);
  }

  async getAllDocuments(): Promise<StoredDocument[]> {
    return Array.from(this.documents.values());
  }

  clear(): void {
    this.documents.clear();
    this.saveToLocalStorage();
    this.notifyListeners();
  }
}

export class FirebaseStorageDocumentRepository implements DocumentRepository {
  private localRepo: LocalDocumentRepository;
  private companyId: string;
  private isMockMode: boolean;
  private firestoreUnsubscribe?: () => void;
  private listeners: Set<(documents: StoredDocument[]) => void> = new Set();

  constructor(companyId = 'company_default', isMockMode = false) {
    this.companyId = companyId;
    this.isMockMode = isMockMode;
    this.localRepo = new LocalDocumentRepository();
    this.initSnapshotListener();
  }

  private initSnapshotListener() {
    if (this.isMockMode || typeof window === 'undefined') return;
    try {
      const { firestore } = initializeFirebase();
      const docsCol = collection(firestore, `companies/${this.companyId}/documents`);
      this.firestoreUnsubscribe = onSnapshot(docsCol, snapshot => {
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as StoredDocument;
          if (data && data.id) {
            this.localRepo.uploadDocument({
              documentId: data.id,
              fileName: data.metadata?.fileName || 'document.pdf',
              mimeType: data.metadata?.mimeType || 'application/pdf',
              dataUrl: data.dataUrl,
              customerId: data.customerId,
              customerName: data.customerName,
              docNumber: data.docNumber,
              type: data.type,
              amount: data.amount,
              date: data.date,
              companyId: data.companyId,
              caseId: data.caseId,
            }).catch(() => {});
          }
        });
        this.notifyListeners();
      }, err => {
        console.warn('Firestore documents onSnapshot warning:', err);
      });
    } catch (e) {
      console.warn('Firebase document listener init warning:', e);
    }
  }

  private notifyListeners() {
    this.getAllDocuments().then(docs => {
      this.listeners.forEach(l => l(docs));
    });
  }

  public formatStoragePath(
    companyId: string,
    caseId: string | undefined,
    documentId: string,
    fileName: string,
    customerName?: string,
    amount?: number
  ): string {
    let cleanName = fileName || `${documentId}.pdf`;
    if (customerName) {
      const parts = customerName.split(/\s+/);
      for (const part of parts) {
        if (part.length > 1) {
          cleanName = cleanName.replace(new RegExp(part, 'gi'), '');
        }
      }
    }
    if (amount) {
      cleanName = cleanName.replace(new RegExp(amount.toString(), 'g'), '');
    }
    cleanName = cleanName
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .replace(/(?:max|mustermann|herr|frau|5000euro|5000eur|5000)/gi, '')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!cleanName || cleanName === '.pdf' || cleanName.startsWith('.')) {
      cleanName = `document_${documentId}.pdf`;
    }

    const caseSegment = caseId ? `cases/${caseId}/` : '';
    return `companies/${companyId}/${caseSegment}documents/${documentId}/${cleanName}`;
  }

  async uploadDocument(input: DocumentUploadInput): Promise<StoredDocument> {
    if (!input.documentId) {
      throw new Error('Dokumenten-ID fehlt.');
    }

    if (isDocumentLocked(input.documentId)) {
      throw new Error(`Dokument ${input.documentId} ist bereits mit einer versendeten Rechnung/Angebot verknüpft und darf nicht überschrieben werden.`);
    }

    // Size validation
    let size = 0;
    let bytesToUpload: Uint8Array | Blob | ArrayBuffer | null = input.blob || null;

    if (input.dataUrl) {
      const base64Part = input.dataUrl.includes(',') ? input.dataUrl.split(',')[1] : input.dataUrl;
      size = Math.round(base64Part.length * 0.75);
      if (!bytesToUpload) {
        const binaryStr = atob(base64Part);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        bytesToUpload = bytes;
      }
    } else if (input.blob instanceof Uint8Array) {
      size = input.blob.length;
    } else if (input.blob instanceof ArrayBuffer) {
      size = input.blob.byteLength;
    }

    if (size > MAX_FILE_SIZE_BYTES) {
      const msg = `Datei überschreitet die maximale Größe von 20MB (${(size / (1024 * 1024)).toFixed(2)} MB).`;
      workflowEngine.emitEvent('DOCUMENT_UPLOAD_FAILED', 'DocumentRepository', {
        documentId: input.documentId,
        error: msg,
      });
      workflowExceptionService.createException({
        category: 'invalid_document',
        severity: 'critical',
        sourceType: 'storage',
        sourceReferenceId: input.documentId,
        title: 'Datei zu groß',
        description: msg,
        blockingReason: 'Dateigröße über 20MB',
        availableActions: [],
        status: 'open',
      });
      throw new Error(msg);
    }

    // MimeType check
    const mimeType = input.mimeType || 'application/pdf';
    if (!mimeType.includes('pdf') && !mimeType.includes('image') && !mimeType.includes('application')) {
      const msg = `Ungültiger Dateityp: ${mimeType}`;
      workflowEngine.emitEvent('DOCUMENT_UPLOAD_FAILED', 'DocumentRepository', {
        documentId: input.documentId,
        error: msg,
      });
      workflowExceptionService.createException({
        category: 'invalid_document',
        severity: 'warning',
        sourceType: 'storage',
        sourceReferenceId: input.documentId,
        title: 'Ungültiger Dateityp',
        description: msg,
        blockingReason: 'Unzulässiges Dateiformat',
        availableActions: [],
        status: 'open',
      });
      throw new Error(msg);
    }

    const storagePath = this.formatStoragePath(
      input.companyId || this.companyId,
      input.caseId,
      input.documentId,
      input.fileName || `${input.documentId}.pdf`,
      input.customerName,
      input.amount
    );
    const sanitizedFileName = storagePath.split('/').pop() || `${input.documentId}.pdf`;

    const checksum = computeChecksum(input.dataUrl || (input.blob instanceof Uint8Array ? input.blob : ''));

    // Check deduplication
    const existing = await this.localRepo.getDocument(input.documentId);
    if (existing && existing.metadata.checksum === checksum && existing.metadata.uploadStatus === 'available') {
      return existing;
    }

    workflowEngine.emitEvent('DOCUMENT_UPLOAD_STARTED', 'DocumentRepository', {
      documentId: input.documentId,
      storagePath,
      fileName: sanitizedFileName,
    });

    const now = new Date().toISOString();

    if (this.isMockMode) {
      // Mock mode for automated tests
      const storedDoc: StoredDocument = {
        id: input.documentId,
        customerId: input.customerId || 'cust_unknown',
        customerName: input.customerName || 'Unbekannt',
        type: input.type || 'Sonstiges',
        docNumber: input.docNumber || input.documentId,
        date: input.date || now.split('T')[0],
        amount: input.amount,
        dataUrl: input.dataUrl,
        companyId: input.companyId || this.companyId,
        caseId: input.caseId,
        metadata: {
          storagePath,
          downloadUrl: `https://mock-storage.firebase.com/${storagePath}`,
          mimeType,
          fileName: sanitizedFileName,
          size,
          checksum,
          storageProvider: 'firebase_storage',
          uploadStatus: 'available',
          uploadedAt: now,
          updatedAt: now,
        },
      };

      await this.localRepo.uploadDocument(input);
      workflowEngine.emitEvent('DOCUMENT_UPLOAD_COMPLETED', 'DocumentRepository', {
        documentId: input.documentId,
        downloadUrl: storedDoc.metadata.downloadUrl,
      });
      return storedDoc;
    }

    // Real Firebase Storage upload
    try {
      const { storage, firestore } = initializeFirebase();
      const storageRef = ref(storage, storagePath);
      
      let uploadPayload: Blob | Uint8Array = bytesToUpload as any;
      if (!uploadPayload) {
        uploadPayload = new Blob([], { type: mimeType });
      }

      const snapshot = await uploadBytes(storageRef, uploadPayload, {
        contentType: mimeType,
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);

      const storedDoc: StoredDocument = {
        id: input.documentId,
        customerId: input.customerId || 'cust_unknown',
        customerName: input.customerName || 'Unbekannt',
        type: input.type || 'Sonstiges',
        docNumber: input.docNumber || input.documentId,
        date: input.date || now.split('T')[0],
        amount: input.amount,
        dataUrl: undefined, // Do NOT keep base64 dataUrl in remote document metadata
        companyId: input.companyId || this.companyId,
        caseId: input.caseId,
        metadata: {
          storagePath,
          downloadUrl,
          mimeType,
          fileName: sanitizedFileName,
          size,
          checksum,
          storageProvider: 'firebase_storage',
          uploadStatus: 'available',
          uploadedAt: now,
          updatedAt: now,
        },
      };

      // Save Firestore metadata
      try {
        const docRef = doc(firestore, `companies/${this.companyId}/documents/${input.documentId}`);
        await setDoc(docRef, cleanFirestoreData(storedDoc), { merge: true });
      } catch (firestoreErr: any) {
        // Storage succeeded, but Firestore metadata save failed -> Reconciliation Required!
        storedDoc.metadata.uploadStatus = 'failed';
        workflowExceptionService.createException({
          category: 'document_reconciliation_required',
          severity: 'critical',
          sourceType: 'storage',
          sourceReferenceId: input.documentId,
          title: 'Metadaten-Synchronisation fehlgeschlagen',
          description: `Datei wurde in Storage hochgeladen (${storagePath}), aber Firestore-Metadaten konnten nicht gespeichert werden: ${firestoreErr.message}`,
          blockingReason: 'Reconciliation required',
          availableActions: [],
          status: 'open',
        });
        workflowEngine.emitEvent('DOCUMENT_RECONCILIATION_REQUIRED', 'DocumentRepository', {
          documentId: input.documentId,
          storagePath,
        });
        throw firestoreErr;
      }

      await this.localRepo.uploadDocument({
        ...input,
        dataUrl: input.dataUrl, // keep local cache
      });

      workflowEngine.emitEvent('DOCUMENT_UPLOAD_COMPLETED', 'DocumentRepository', {
        documentId: input.documentId,
        downloadUrl,
      });

      return storedDoc;

    } catch (err: any) {
      workflowEngine.emitEvent('DOCUMENT_UPLOAD_FAILED', 'DocumentRepository', {
        documentId: input.documentId,
        error: err.message,
      });

      workflowExceptionService.createException({
        category: 'document_upload_failed',
        severity: 'warning',
        sourceType: 'storage',
        sourceReferenceId: input.documentId,
        title: 'Dokumentenupload fehlgeschlagen',
        description: `Upload für Dokument ${input.documentId} fehlgeschlagen: ${err.message}`,
        blockingReason: 'Firebase Storage Upload Error',
        availableActions: [],
        status: 'open',
      });

      // Fallback to local repo with pending status
      const fallback = await this.localRepo.uploadDocument(input);
      fallback.metadata.uploadStatus = 'failed';
      fallback.metadata.storageProvider = 'local';
      return fallback;
    }
  }

  async getDocument(documentId: string): Promise<StoredDocument | undefined> {
    const local = await this.localRepo.getDocument(documentId);
    if (local && local.metadata.uploadStatus === 'available') {
      return local;
    }

    if (!this.isMockMode && typeof window !== 'undefined') {
      try {
        const { firestore } = initializeFirebase();
        const docSnap = await getDoc(doc(firestore, `companies/${this.companyId}/documents/${documentId}`));
        if (docSnap.exists()) {
          const data = docSnap.data() as StoredDocument;
          return data;
        }
      } catch (e) {
        console.warn('Failed to fetch document metadata from Firestore:', e);
      }
    }

    return local;
  }

  async getDownloadUrl(documentId: string): Promise<string> {
    const docItem = await this.getDocument(documentId);
    if (!docItem) {
      throw new Error(`Dokument ${documentId} existiert nicht.`);
    }

    if (docItem.metadata.downloadUrl) {
      return docItem.metadata.downloadUrl;
    }

    if (!this.isMockMode && docItem.metadata.storagePath) {
      try {
        const { storage } = initializeFirebase();
        const storageRef = ref(storage, docItem.metadata.storagePath);
        const url = await getDownloadURL(storageRef);
        docItem.metadata.downloadUrl = url;
        return url;
      } catch (e: any) {
        workflowExceptionService.createException({
          category: 'missing_document_data',
          severity: 'warning',
          sourceType: 'storage',
          sourceReferenceId: documentId,
          title: 'Dokumentendatei nicht im Storage gefunden',
          description: `Download-URL für ${documentId} konnte nicht abgerufen werden: ${e.message}`,
          blockingReason: 'Storage file missing',
          availableActions: [],
          status: 'open',
        });
        throw e;
      }
    }

    return this.localRepo.getDownloadUrl(documentId);
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (isDocumentLocked(documentId)) {
      throw new Error(`Bereits versendete Rechnungen oder Angebote (Doc-ID: ${documentId}) dürfen nicht gelöscht werden.`);
    }

    const docItem = await this.getDocument(documentId);

    if (docItem && docItem.metadata.storagePath && !this.isMockMode) {
      try {
        const { storage, firestore } = initializeFirebase();
        const storageRef = ref(storage, docItem.metadata.storagePath);
        await deleteObject(storageRef).catch(e => console.warn('Storage delete warning:', e));
        await deleteDoc(doc(firestore, `companies/${this.companyId}/documents/${documentId}`)).catch(e => console.warn('Firestore doc delete warning:', e));
      } catch (e) {
        console.warn('Delete remote document error:', e);
      }
    }

    await this.localRepo.deleteDocument(documentId);
  }

  async documentExists(documentId: string): Promise<boolean> {
    const docItem = await this.getDocument(documentId);
    return !!docItem;
  }

  subscribe(listener: (documents: StoredDocument[]) => void): () => void {
    this.listeners.add(listener);
    this.getAllDocuments().then(docs => listener(docs));
    return () => this.listeners.delete(listener);
  }

  async getAllDocuments(): Promise<StoredDocument[]> {
    return this.localRepo.getAllDocuments();
  }
}
