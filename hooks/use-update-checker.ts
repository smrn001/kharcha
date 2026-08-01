import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getSkippedUpdateVersion, setSkippedUpdateVersion } from '@/lib/db/updates';
import { GithubReleaseProvider, pickAndroidApkAsset } from '@/lib/update/github-provider';
import type { ReleaseProvider } from '@/lib/update/types';
import { isNewerThan } from '@/lib/update/version';

export type UpdateState =
  | { status: 'checking' }
  | { status: 'up-to-date' }
  | { status: 'error' }
  | { status: 'available'; currentVersion: string; latestVersion: string; notes: string; downloadUrl: string; assetName: string };

interface UpdateCheckerOptions {
  provider?: ReleaseProvider;
}

export function useUpdateChecker(options: UpdateCheckerOptions = {}) {
  const db = useSQLiteContext();
  const [state, setState] = useState<UpdateState>(() =>
    Platform.OS === 'android' ? { status: 'checking' } : { status: 'up-to-date' }
  );
  const checkedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    if (checkedRef.current) {
      return;
    }
    checkedRef.current = true;

    let active = true;

    async function check() {
      const currentVersion = Constants.expoConfig?.version ?? '1.0.0';
      const provider =
        options.provider ??
        new GithubReleaseProvider({
          owner: 'smrn001',
          repo: 'kharcha',
        });

      try {
        const release = await provider.getLatestRelease();
        if (!active || !release) {
          return;
        }

        if (!isNewerThan(release.version, currentVersion)) {
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
          assetName: asset.name,
        });
      } catch {
        if (active) {
          setState({ status: 'error' });
        }
      }
    }

    check();
    return () => {
      active = false;
    };
  }, [db, options.provider]);

  async function skipVersion() {
    if (state.status === 'available') {
      await setSkippedUpdateVersion(db, state.latestVersion);
    }
    setState({ status: 'up-to-date' });
  }

  function dismiss() {
    setState({ status: 'up-to-date' });
  }

  return { state, dismiss, skipVersion };
}
