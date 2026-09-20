/** GitHub release fetching, version comparison, and notes parsing. */

export interface ReleaseAsset {
  name: string;
  url: string;
  size?: number;
}

export interface LatestRelease {
  version: string;
  notes: string;
  assets: ReleaseAsset[];
}

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

export async function fetchLatestRelease(): Promise<LatestRelease | null> {
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

export function pickAndroidApkAsset(release: {
  assets: { name: string; url: string; size?: number }[];
}): { name: string; url: string; size?: number } | null {
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

export function compareVersions(a: string, b: string): number {
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

export function parseReleaseNotes(notes: string): {
  bullets: string[];
  changelogUrl: string | null;
} {
  const bullets: string[] = [];
  let changelogUrl: string | null = null;

  for (const raw of notes.split('\n')) {
    const line = raw.trim();
    const url = line.match(/https?:\/\/\S+/)?.[0];
    if (url && /compare|changelog|releases|pull/i.test(line)) {
      changelogUrl = url;
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const text = line.replace(/^[-*]\s+/, '').replace(/\*\*/g, '');
      if (text) {
        bullets.push(text);
      }
    }
  }

  return { bullets, changelogUrl };
}