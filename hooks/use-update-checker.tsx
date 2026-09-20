import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { getSkippedUpdateVersion, setSkippedUpdateVersion } from '@/lib/db/settings';
import { compareVersions, fetchLatestRelease, pickAndroidApkAsset } from '@/lib/releases';

export type UpdateState =
  | { status: 'up-to-date' }
  | { status: 'error' }
  | {
      status: 'available';
      currentVersion: string;
      latestVersion: string;
      notes: string;
      downloadUrl: string;
    };

export interface UpdateCheckerContextValue {
  isChecking: boolean;
  state: UpdateState;
  dismiss: () => void;
  skipVersion: () => void;
  checkNow: () => void;
}

const UpdateCheckerContext = createContext<UpdateCheckerContextValue | null>(null);

export function UpdateCheckerProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [isChecking, setIsChecking] = useState(false);
  const [state, setState] = useState<UpdateState>({ status: 'up-to-date' });
  const autoCheckedRef = useRef(false);
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (checkingRef.current) {
      return;
    }
    checkingRef.current = true;
    setIsChecking(true);

    const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

    try {
      const release = await fetchLatestRelease();
      if (!release) {
        setState({ status: 'error' });
        return;
      }

      if (compareVersions(release.version, currentVersion) <= 0) {
        setState({ status: 'up-to-date' });
        return;
      }

      const skipped = await getSkippedUpdateVersion(db);
      if (skipped === release.version) {
        setState({ status: 'up-to-date' });
        return;
      }

      const asset = pickAndroidApkAsset(release);
      if (!asset) {
        setState({ status: 'up-to-date' });
        return;
      }

      setState({
        status: 'available',
        currentVersion,
        latestVersion: release.version,
        notes: release.notes,
        downloadUrl: asset.url,
      });
    } catch {
      setState({ status: 'error' });
    } finally {
      checkingRef.current = false;
      setIsChecking(false);
    }
  }, [db]);

  useEffect(() => {
    if (Platform.OS !== 'android' || autoCheckedRef.current) {
      return;
    }
    autoCheckedRef.current = true;
    check();
  }, [check]);

  async function skipVersion() {
    if (state.status === 'available') {
      await setSkippedUpdateVersion(db, state.latestVersion);
    }
    setState({ status: 'up-to-date' });
  }

  function dismiss() {
    setState({ status: 'up-to-date' });
  }

  const value: UpdateCheckerContextValue = { isChecking, state, dismiss, skipVersion, checkNow: check };

  return <UpdateCheckerContext.Provider value={value}>{children}</UpdateCheckerContext.Provider>;
}

export function useUpdateChecker(): UpdateCheckerContextValue {
  const context = useContext(UpdateCheckerContext);
  if (!context) {
    throw new Error('useUpdateChecker must be used within an UpdateCheckerProvider');
  }
  return context;
}
