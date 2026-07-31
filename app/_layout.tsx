import '@/global.css';

import { useAppliedTheme } from '@/hooks/use-applied-theme';
import { SettingsProvider, useSettings } from '@/hooks/use-settings';
import { DatabaseProvider } from '@/lib/db/database';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <SettingsProvider>
        <ThemedRoot />
      </SettingsProvider>
    </DatabaseProvider>
  );
}

function ThemedRoot() {
  const { settings, loading } = useSettings();
  const { colorScheme } = useColorScheme();
  useAppliedTheme(loading ? 'system' : settings.theme);

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      <PortalHost />
    </ThemeProvider>
  );
}
