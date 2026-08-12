import { Case } from './case-service';
import { initializeFirebase } from '../firebase/init';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';

export function cleanFirestoreData<T>(obj: T): T {
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

export function sanitizeCaseForFirestore(caseItem: Case): Case {
  const sanitized = JSON.parse(JSON.stringify(caseItem));
  if (sanitized.offerDrafts) {
    sanitized.offerDrafts = sanitized.offerDrafts.map((od: any) => {
      const { pdfDataUrl, dataUrl, ...rest } = od;
      return rest;
    });
  }
  if (sanitized.invoiceDrafts) {
    sanitized.invoiceDrafts = sanitized.invoiceDrafts.map((id: any) => {
      const { pdfDataUrl, dataUrl, ...rest } = id;
      return rest;
    });
  }
  if (sanitized.emailDrafts) {
    sanitized.emailDrafts = sanitized.emailDrafts.map((ed: any) => {
      if (ed.attachments) {
        ed.attachments = ed.attachments.map((att: any) => {
          const { dataUrl, contentBytes, base64, ...attRest } = att;
          return attRest;
        });
      }
      return ed;
    });
  }
  return cleanFirestoreData(sanitized);
}

export interface CaseRepositoryMetadata {
  schemaVersion: number;
  lastSuccessfulMailSyncAt?: string;
  processedMessageIds?: string[];
  lastMigrationAt?: string;
  repositoryVersion: string;
  lastSyncAt?: string;
}

export type RepositorySyncStatus =
  | 'initializing'
  | 'synced'
  | 'offline'
  | 'pending_sync'
  | 'syncing'
  | 'conflict'
  | 'error';

export interface CaseRepository {
  initialize(): Promise<void>;
  getAllCases(): Promise<Case[]>;
  getAllCasesSync(): Case[];
  getCase(caseId: string): Promise<Case | undefined>;
  saveCase(caseItem: Case): Promise<void>;
  saveCases(cases: Case[]): Promise<void>;
  saveCasesSync?(cases: Case[]): void;
  deleteCase(caseId: string): Promise<void>;
  subscribe(listener: (cases: Case[]) => void): () => void;
  getMetadata(): Promise<CaseRepositoryMetadata>;
  saveMetadata(metadata: CaseRepositoryMetadata): Promise<void>;
  getSyncStatus(): RepositorySyncStatus;
  syncPending?(): Promise<void>;
}

const STORAGE_KEY_V2 = 'app_cases_v2';
const STORAGE_KEY_V1 = 'app_cases_v1';
const METADATA_KEY = 'app_cases_metadata';
const PENDING_SYNC_KEY = 'app_cases_pending_sync';
const DEFAULT_COMPANY_ID = 'default_company';

/**
 * LocalCaseRepository handles client-side storage using localStorage with in-memory fallback.
 */
export class LocalCaseRepository implements CaseRepository {
  private casesMap: Map<string, Case> = new Map();
  private metadata: CaseRepositoryMetadata = {
    schemaVersion: 2,
    repositoryVersion: '2.0.0',
    processedMessageIds: [],
  };
  private listeners: Set<(cases: Case[]) => void> = new Set();
  private syncStatus: RepositorySyncStatus = 'synced';

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
        if (rawV2) {
          const parsed = JSON.parse(rawV2);
          const casesList: Case[] = parsed.cases || [];
          casesList.forEach((c: any) => this.casesMap.set(c.id, c));
          if (parsed.integrationMetadata?.outlook) {
            this.metadata.processedMessageIds = parsed.integrationMetadata.outlook.processedMessageIds || [];
            this.metadata.lastSuccessfulMailSyncAt = parsed.integrationMetadata.outlook.lastSuccessfulMailSyncAt;
          }
        }
        const rawMeta = localStorage.getItem(METADATA_KEY);
        if (rawMeta) {
          this.metadata = { ...this.metadata, ...JSON.parse(rawMeta) };
        }
      } catch (e) {
        console.error('LocalCaseRepository initialize error:', e);
      }
    }
  }

  public async initialize(): Promise<void> {
    this.syncStatus = 'initializing';
    this.loadFromLocalStorage();
    this.syncStatus = 'synced';
  }

  public async getAllCases(): Promise<Case[]> {
    return this.getAllCasesSync();
  }

  public getAllCasesSync(): Case[] {
    return Array.from(this.casesMap.values());
  }

  public async getCase(caseId: string): Promise<Case | undefined> {
    return this.casesMap.get(caseId);
  }

  public async saveCase(caseItem: Case): Promise<void> {
    this.casesMap.set(caseItem.id, { ...caseItem });
    this.persist();
    this.notify();
  }

  public async saveCases(cases: Case[]): Promise<void> {
    this.saveCasesSync(cases);
  }

  public saveCasesSync(cases: Case[]): void {
    cases.forEach(c => this.casesMap.set(c.id, { ...c }));
    this.persist();
    this.notify();
  }

  public async deleteCase(caseId: string): Promise<void> {
    this.casesMap.delete(caseId);
    this.persist();
    this.notify();
  }

  public subscribe(listener: (cases: Case[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async getMetadata(): Promise<CaseRepositoryMetadata> {
    return { ...this.metadata };
  }

  public async saveMetadata(metadata: CaseRepositoryMetadata): Promise<void> {
    this.metadata = { ...metadata };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(METADATA_KEY, JSON.stringify(this.metadata));
      } catch (e) {}
    }
  }

  public getSyncStatus(): RepositorySyncStatus {
    return this.syncStatus;
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    const casesArray = Array.from(this.casesMap.values());
    const payload = {
      cases: casesArray,
      integrationMetadata: {
        outlook: {
          processedMessageIds: this.metadata.processedMessageIds || [],
          lastSuccessfulMailSyncAt: this.metadata.lastSuccessfulMailSyncAt,
        },
      },
    };

    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
    } catch (e: any) {
      if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.number === -2147024882 || String(e).includes('quota')) {
        try {
          // Keep top 30 cases, stripping heavy attachment and audio payload fields
          const leanCases = casesArray.slice(-30).map(c => {
            const { attachments, rawPayload, transcripts, ...rest } = c as any;
            return rest;
          });
          const leanPayload = {
            ...payload,
            cases: leanCases,
          };
          localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(leanPayload));
        } catch (retryErr) {
          console.warn('LocalStorage quota limit reached for LocalCaseRepository, utilizing in-memory state.');
        }
      } else {
        console.warn('Could not persist cases to localStorage:', e?.message || e);
      }
    }
  }

  private notify(): void {
    const current = Array.from(this.casesMap.values());
    this.listeners.forEach(cb => {
      try {
        cb(current);
      } catch (e) {}
    });
  }
}

/**
 * FirestoreCaseRepository connects to Firestore as primary store with LocalCaseRepository as fallback/cache.
 */
export class FirestoreCaseRepository implements CaseRepository {
  private localRepo: LocalCaseRepository;
  private companyId: string;
  private syncStatus: RepositorySyncStatus = 'initializing';
  private firestoreUnsubscribe: Unsubscribe | null = null;
  private listeners: Set<(cases: Case[]) => void> = new Set();
  private isOnline: boolean = true;
  private pendingSyncIds: Set<string> = new Set();
  private mockMode: boolean = false;

  constructor(companyId: string = DEFAULT_COMPANY_ID, mockMode: boolean = false) {
    this.companyId = companyId;
    this.localRepo = new LocalCaseRepository();
    this.mockMode = mockMode;
  }

  public async initialize(): Promise<void> {
    this.syncStatus = 'initializing';
    await this.localRepo.initialize();

    if (this.mockMode || typeof window === 'undefined') {
      // In SSR or testing environment without Firestore, operate seamlessly with local repo
      this.syncStatus = 'synced';
      this.localRepo.subscribe(cases => this.notifyListeners(cases));
      return;
    }

    try {
      const { firestore } = initializeFirebase();
      if (!firestore) {
        this.syncStatus = 'offline';
        return;
      }

      // Check remote metadata and migration status
      const metaDocRef = doc(firestore, 'companies', this.companyId, 'metadata', 'caseRepository');
      const metaSnap = await getDoc(metaDocRef).catch(() => null);

      let remoteMeta: CaseRepositoryMetadata | null = metaSnap?.exists()
        ? (metaSnap.data() as CaseRepositoryMetadata)
        : null;

      // Check if migration is needed from local to Firestore
      const localCases = await this.localRepo.getAllCases();
      if ((!remoteMeta || !remoteMeta.lastMigrationAt) && localCases.length > 0) {
        await this.migrateLocalToRemote(firestore, localCases);
        remoteMeta = {
          schemaVersion: 2,
          repositoryVersion: '2.0.0',
          lastMigrationAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
          processedMessageIds: (await this.localRepo.getMetadata()).processedMessageIds || [],
        };
        await setDoc(metaDocRef, remoteMeta).catch(e =>
          console.warn('Could not save remote metadata', e)
        );
      }

      // Set up real-time listener on cases collection
      const casesColRef = collection(firestore, 'companies', this.companyId, 'cases');
      this.firestoreUnsubscribe = onSnapshot(
        casesColRef,
        snapshot => {
          const remoteCases: Case[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Case;
            if (data && data.id && data.status) {
              remoteCases.push(data);
            } else {
              console.warn('Rejected invalid remote case document:', docSnap.id, data);
            }
          });
          // Cache in local repository
          this.localRepo.saveCases(remoteCases);
          this.syncStatus = this.pendingSyncIds.size > 0 ? 'pending_sync' : 'synced';
          this.notifyListeners(remoteCases);
        },
        error => {
          console.warn('Firestore onSnapshot error, falling back to offline:', error);
          this.syncStatus = 'offline';
          this.isOnline = false;
        }
      );

      this.syncStatus = 'synced';
      this.isOnline = true;
    } catch (e) {
      console.warn('Firestore initialization failed, using offline mode:', e);
      this.syncStatus = 'offline';
      this.isOnline = false;
      this.localRepo.subscribe(cases => this.notifyListeners(cases));
    }
  }

  private async migrateLocalToRemote(firestore: any, localCases: Case[]): Promise<void> {
    try {
      const batch = writeBatch(firestore);
      let count = 0;
      for (const c of localCases) {
        const caseRef = doc(firestore, 'companies', this.companyId, 'cases', c.id);
        const prepared = {
          ...c,
          version: c.version || 1,
          updatedAt: c.updatedAt || new Date().toISOString(),
        };
        const sanitized = sanitizeCaseForFirestore(prepared as Case);
        batch.set(caseRef, sanitized);
        count++;
        if (count >= 450) {
          // Firestore batch limit is 500
          await batch.commit();
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    } catch (e: any) {
      console.warn('Local cases migration to Firestore skipped due to permission or restriction:', e?.message || e);
    }
  }

  public async getAllCases(): Promise<Case[]> {
    return this.localRepo.getAllCases();
  }

  public getAllCasesSync(): Case[] {
    return this.localRepo.getAllCasesSync();
  }

  public async getCase(caseId: string): Promise<Case | undefined> {
    return this.localRepo.getCase(caseId);
  }

  public async saveCase(caseItem: Case): Promise<void> {
    // Measure document size for safety
    const jsonStr = JSON.stringify(caseItem);
    if (jsonStr.length > 800000) {
      console.warn(`Case ${caseItem.id} document size is large (${jsonStr.length} bytes). Warn threshold reached.`);
    }

    const nextVersion = (caseItem.version || 1) + 1;
    const now = new Date().toISOString();
    const updatedCase: Case = {
      ...caseItem,
      version: nextVersion,
      updatedAt: now,
    };

    // Update local cache immediately
    await this.localRepo.saveCase(updatedCase);

    if (!this.mockMode && typeof window !== 'undefined') {
      try {
        const { firestore } = initializeFirebase();
        if (firestore) {
          const caseRef = doc(firestore, 'companies', this.companyId, 'cases', caseItem.id);

          // Optimistic locking version check
          const existingSnap = await getDoc(caseRef).catch(() => null);
          if (existingSnap && existingSnap.exists()) {
            const remoteData = existingSnap.data() as Case;
            if (remoteData.version && remoteData.version > (caseItem.version || 1)) {
              this.syncStatus = 'conflict';
              throw new Error(
                `PERSISTENCE_CONFLICT: Remote version (${remoteData.version}) is newer than local version (${caseItem.version || 1}) for case ${caseItem.id}.`
              );
            }
          }

          const sanitizedCase = sanitizeCaseForFirestore(updatedCase);
          await setDoc(caseRef, sanitizedCase);
          this.pendingSyncIds.delete(caseItem.id);
          this.syncStatus = this.pendingSyncIds.size > 0 ? 'pending_sync' : 'synced';
          return;
        }
      } catch (err: any) {
        if (err?.message?.includes('PERSISTENCE_CONFLICT')) {
          this.syncStatus = 'conflict';
          throw err;
        }
        console.warn(`Firestore save failed for case ${caseItem.id}, marked as pending sync:`, err);
      }
    }

    // Mark pending sync if Firestore save failed or offline
    this.pendingSyncIds.add(caseItem.id);
    this.syncStatus = 'pending_sync';
  }

  public async saveCases(cases: Case[]): Promise<void> {
    this.saveCasesSync(cases);
    for (const c of cases) {
      await this.saveCase(c);
    }
  }

  public saveCasesSync(cases: Case[]): void {
    this.localRepo.saveCasesSync(cases);
  }

  public async deleteCase(caseId: string): Promise<void> {
    await this.localRepo.deleteCase(caseId);
    if (!this.mockMode && typeof window !== 'undefined') {
      try {
        const { firestore } = initializeFirebase();
        if (firestore) {
          const caseRef = doc(firestore, 'companies', this.companyId, 'cases', caseId);
          await deleteDoc(caseRef);
        }
      } catch (e) {
        console.warn(`Firestore delete failed for case ${caseId}:`, e);
      }
    }
  }

  public subscribe(listener: (cases: Case[]) => void): () => void {
    this.listeners.add(listener);
    // Also trigger initial call
    this.localRepo.getAllCases().then(cases => listener(cases));
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async getMetadata(): Promise<CaseRepositoryMetadata> {
    return this.localRepo.getMetadata();
  }

  public async saveMetadata(metadata: CaseRepositoryMetadata): Promise<void> {
    await this.localRepo.saveMetadata(metadata);
    if (!this.mockMode && typeof window !== 'undefined') {
      try {
        const { firestore } = initializeFirebase();
        if (firestore) {
          const metaRef = doc(firestore, 'companies', this.companyId, 'metadata', 'caseRepository');
          await setDoc(metaRef, metadata, { merge: true });
        }
      } catch (e) {
        console.warn('Could not save metadata to Firestore:', e);
      }
    }
  }

  public getSyncStatus(): RepositorySyncStatus {
    return this.syncStatus;
  }

  public async syncPending(): Promise<void> {
    if (this.pendingSyncIds.size === 0) return;
    this.syncStatus = 'syncing';
    const pendingIds = Array.from(this.pendingSyncIds);
    for (const id of pendingIds) {
      const caseItem = await this.localRepo.getCase(id);
      if (caseItem) {
        try {
          await this.saveCase(caseItem);
        } catch (e) {
          console.error(`Failed to sync pending case ${id}:`, e);
        }
      }
    }
  }

  private notifyListeners(cases: Case[]): void {
    this.listeners.forEach(cb => {
      try {
        cb(cases);
      } catch (e) {}
    });
  }
}
