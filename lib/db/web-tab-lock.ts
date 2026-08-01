import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type WebDatabaseLockStatus = 'checking' | 'acquired' | 'blocked';

const DB_LOCK_NAME = 'kharcha-db-lock';

/**
 * Cross-tab database lock for the web platform.
 *
 * expo-sqlite on web stores the database in the Origin Private File System
 * through a dedicated worker per tab. OPFS sync access handles are exclusive
 * per file, so a second tab opening the same database throws
 * `NoModificationAllowedError`. This hook uses the Web Locks API to elect a
 * single owning tab; the lock is held for the lifetime of the component.
 *
 * On native platforms (or when the Web Locks API is unavailable) it always
 * reports `acquired`, leaving error handling to the database error boundary.
 */
export function useWebDatabaseLock(): WebDatabaseLockStatus {
  const [status, setStatus] = useState<WebDatabaseLockStatus>(() => {
    if (Platform.OS !== 'web') {
      return 'acquired';
    }
    if (typeof navigator === 'undefined' || typeof navigator.locks === 'undefined') {
      return 'acquired';
    }
    return 'checking';
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    if (typeof navigator === 'undefined' || typeof navigator.locks === 'undefined') {
      return;
    }

    let cancelled = false;
    let releaseLock: (() => void) | null = null;

    const holdPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    navigator.locks
      .request(DB_LOCK_NAME, { ifAvailable: true }, (lock) => {
        if (cancelled) {
          return;
        }
        if (lock) {
          setStatus('acquired');
          return holdPromise;
        }
        setStatus('blocked');
        return;
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('acquired');
        }
      });

    return () => {
      cancelled = true;
      releaseLock?.();
    };
  }, []);

  return status;
}
