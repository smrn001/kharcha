export interface ReleaseAsset {
  name: string;
  url: string;
  size?: number;
}

export interface AppRelease {
  version: string;
  tagName: string;
  name: string;
  notes: string;
  publishedAt?: string;
  assets: ReleaseAsset[];
}

export interface ReleaseProvider {
  getLatestRelease(): Promise<AppRelease | null>;
}
