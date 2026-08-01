import '@/global.css';

import { useAppliedTheme } from '@/hooks/use-applied-theme';
import { SettingsProvider, useSettings } from '@/hooks/use-settings';
import { DatabaseProvider } from '@/lib/db/database';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <SettingsProvider>
          <ThemedRoot />
        </SettingsProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

function ThemedRoot() {
  const { settings, loading } = useSettings();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  useAppliedTheme(loading ? 'system' : settings.theme);
  useBlurOnNavigation();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View
        className="flex-1 web:mx-auto web:h-full web:w-full web:max-w-md web:border-x web:border-border web:bg-background web:shadow-2xl"
        style={{
          paddingTop: Platform.OS === 'web' ? 0 : insets.top,
        }}
      >
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <PortalHost />
    </ThemeProvider>
  );
}

function useBlurOnNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS === 'web' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [pathname]);
}
