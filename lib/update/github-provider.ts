import type { AppRelease, ReleaseAsset, ReleaseProvider } from './types';

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

export interface GithubReleaseProviderConfig {
  owner: string;
  repo: string;
  timeoutMs?: number;
}

export class GithubReleaseProvider implements ReleaseProvider {
  constructor(private readonly config: GithubReleaseProviderConfig) {}

  async getLatestRelease(): Promise<AppRelease | null> {
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

export function pickAndroidApkAsset(release: AppRelease): ReleaseAsset | null {
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
