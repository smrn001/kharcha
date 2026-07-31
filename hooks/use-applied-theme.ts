import type { ThemePreference } from '@/types';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useAppliedTheme(preference: ThemePreference) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (preference === 'system') {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => setColorScheme(media.matches ? 'dark' : 'light');
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
      }
      setColorScheme(preference);
      return;
    }
    setColorScheme(preference);
  }, [preference, setColorScheme]);
}
