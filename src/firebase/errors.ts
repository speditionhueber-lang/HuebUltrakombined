import { initializeFirebase } from './init';
import { errorEmitter } from './error-emitter';

export type FirebaseFailureType =
  | 'offline'
  | 'permission_denied'
  | 'unauthenticated'
  | 'not_found'
  | 'conflict'
  | 'quota'
  | 'unknown';

export class FirestorePermissionError extends Error {
  public failureType: FirebaseFailureType;

  constructor(message: string, failureType: FirebaseFailureType = 'permission_denied') {
    super(message);
    this.name = 'FirestorePermissionError';
    this.failureType = failureType;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  failureType: FirebaseFailureType;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function classifyFirebaseError(errorMessage: string, hasAuthUser: boolean): FirebaseFailureType {
  const lower = errorMessage.toLowerCase();
  if (lower.includes('unavailable') || lower.includes('offline') || lower.includes('could not reach cloud firestore')) {
    return 'offline';
  }
  if (lower.includes('quota') || lower.includes('resource_exhausted')) {
    return 'quota';
  }
  if (lower.includes('not-found') || lower.includes('not_found')) {
    return 'not_found';
  }
  if (lower.includes('permission') || lower.includes('insufficient')) {
    return hasAuthUser ? 'permission_denied' : 'unauthenticated';
  }
  if (lower.includes('unauthenticated')) {
    return 'unauthenticated';
  }
  return 'unknown';
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let authObj: any = null;
  try {
    const { auth } = initializeFirebase();
    authObj = auth;
  } catch (e) {
    console.warn("Could not load auth context for Firestore error:", e);
  }

  const currentUser = authObj?.currentUser;
  const failureType = classifyFirebaseError(errorMessage, !!currentUser);

  if (failureType === 'permission_denied' || failureType === 'unauthenticated' || errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('insufficient')) {
    const errInfo: FirestoreErrorInfo = {
      error: errorMessage,
      failureType,
      authInfo: {
        userId: currentUser?.uid || null,
        email: currentUser?.email || null,
        emailVerified: currentUser?.emailVerified || null,
        isAnonymous: currentUser?.isAnonymous || null,
        tenantId: currentUser?.tenantId || null,
        providerInfo: currentUser?.providerData?.map((provider: any) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path
    };

    const jsonString = JSON.stringify(errInfo);
    console.error('Firestore Security / Access Failure: ', jsonString);
    const permError = new FirestorePermissionError(jsonString, failureType);
    errorEmitter.emit('permission-error', permError);
    throw permError;
  }
}

