export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  currency: string;
  theme: ThemePreference;
}
