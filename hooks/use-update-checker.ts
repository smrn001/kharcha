import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getSkippedUpdateVersion, setSkippedUpdateVersion } from '@/lib/db/settings';

export type UpdateState =
  | { status: 'checking' }
  | { status: 'up-to-date' }
  | { status: 'error' }
  | { status: 'available'; currentVersion: string; latestVersion: string; notes: string; downloadUrl: string; assetName: string };

interface GithubAssetJson {
  name: string;
  browser_download_url: string;
  size?: number;
}

interface GithubReleaseJson {
  tag_name: string;
  name?: string | null;
  body?: string | null;
  published_at?: string | null;
  assets?: GithubAssetJson[];
}

interface GithubReleaseProviderConfig {
  owner: string;
  repo: string;
  timeoutMs?: number;
}

class GithubReleaseProvider {
  constructor(private readonly config: GithubReleaseProviderConfig) {}

  async getLatestRelease() {
    const { owner, repo, timeoutMs = 10000 } = this.config;
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
        tagName: data.tag_name,
        name: data.name ?? `Kharcha ${data.tag_name}`,
        notes: data.body ?? '',
        publishedAt: data.published_at ?? undefined,
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

function isNewerThan(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) > 0;
}

export function useUpdateChecker() {
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
      const provider = new GithubReleaseProvider({
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
  }, [db]);

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