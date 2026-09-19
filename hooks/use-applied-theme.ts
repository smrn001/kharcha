import { useSettings } from '@/hooks/use-settings';
import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';

/**
 * Push the persisted theme preference into React Native's Appearance. Every
 * `useColorScheme()` consumer (theme tokens in `lib/theme.ts`, `Host`
 * colorScheme props, the pinned status bar, and the navigation theme) reads
 * the forced scheme, so a manual choice re-themes the whole app with no extra
 * plumbing. `'unspecified'` resets to following the device scheme.
 *
 * Applying is gated on settings load so a persisted override never flashes the
 * device scheme on launch.
 */
export function useAppliedTheme(): void {
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (loading) return;
    Appearance.setColorScheme(settings.theme === 'system' ? 'unspecified' : settings.theme);
  }, [settings.theme, loading]);
}

export type AppliedColorScheme = 'light' | 'dark' | null;

/**
 * The scheme the user actually sees: the forced theme when one is set, the
 * system scheme otherwise. Unlike relying on the Appearance global, this is
 * exact on the very first render after settings load, so the status bar and
 * `Host` never mismatch the applied theme.
 */
export function useAppliedColorScheme(): AppliedColorScheme {
  const { settings, loading } = useSettings();
  const systemScheme = useColorScheme();
  if (loading) return systemScheme === 'dark' ? 'dark' : 'light';
  if (settings.theme === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return settings.theme;
}