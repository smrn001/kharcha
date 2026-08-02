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

interface GithubAssetJson {
  name: string;
  browser_download_url: string;
  size?: number;
}

interface GithubReleaseJson {
  tag_name: string;
  body?: string | null;
  assets?: GithubAssetJson[];
}

async function fetchLatestRelease() {
  const url = 'https://api.github.com/repos/smrn001/kharcha/releases/latest';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const data = (await response.json()) as GithubReleaseJson;
    if (!data.tag_name) {
      return null;
    }

    return {
      version: data.tag_name.replace(/^v/, ''),
      notes: data.body ?? '',
      assets: (data.assets ?? []).map((asset) => ({
        name: asset.name,
        url: asset.browser_download_url,
        size: asset.size,
      })),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function pickAndroidApkAsset(release: { assets: { name: string; url: string; size?: number }[] }) {
  const arm64 = release.assets.find((asset) => /arm64[-_]?v8a/i.test(asset.name));
  if (arm64) {
    return arm64;
  }
  const universal = release.assets.find((asset) => /universal/i.test(asset.name));
  if (universal) {
    return universal;
  }
  const fallback = release.assets.find((asset) => /\.apk$/i.test(asset.name));
  return fallback ?? null;
}

function compareVersions(a: string, b: string): number {
  const cleanA = a.replace(/^v/, '');
  const cleanB = b.replace(/^v/, '');

  const partsA = cleanA.split('.').map((part) => parseInt(part, 10));
  const partsB = cleanB.split('.').map((part) => parseInt(part, 10));

  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const partA = partsA[i] ?? 0;
    const partB = partsB[i] ?? 0;
    if (partA !== partB) {
      return partA < partB ? -1 : 1;
    }
  }
  return 0;
}

interface UpdateCheckerContextValue {
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
