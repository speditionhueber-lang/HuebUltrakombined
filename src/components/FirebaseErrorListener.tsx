'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/src/firebase/error-emitter';
import { FirestorePermissionError } from '@/src/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * Dispatches a toast notification and logs warnings rather than unmounting the app tree.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      const failureType = error.failureType || 'permission_denied';
      console.error(`Firestore ${failureType} Error:`, error.message);
      setError(error);

      if (failureType === 'permission_denied' || failureType === 'unauthenticated') {
        window.dispatchEvent(
          new CustomEvent('toast_notification', {
            detail: {
              type: 'error',
              message: 'Zugriff verweigert: Keine Berechtigung oder nicht angemeldet.',
            },
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('toast_notification', {
            detail: {
              type: 'warning',
              message: 'Datenbankverbindung eingeschränkt oder im Offline-Modus.',
            },
          })
        );
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}


