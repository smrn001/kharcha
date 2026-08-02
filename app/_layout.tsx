import '@/global.css';

import { UpdateDialog } from '@/components/update-dialog';
import { useAppliedTheme } from '@/hooks/use-applied-theme';
import { SettingsProvider, useSettings } from '@/hooks/use-settings';
import { UpdateCheckerProvider, useUpdateChecker } from '@/hooks/use-update-checker';
import { DatabaseProvider } from '@/lib/db/database';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Linking, Platform, View } from 'react-native';
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
          <UpdateCheckerProvider>
            <ThemedRoot />
          </UpdateCheckerProvider>
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
      {Platform.OS === 'android' && (
        <NavigationBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      )}
      <View
        className="flex-1 bg-background web:mx-auto web:h-full web:w-full web:max-w-md web:border-x web:border-border web:shadow-2xl"
        style={{
          paddingTop: Platform.OS === 'web' ? 0 : insets.top,
        }}
      >
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <PortalHost />
      <AndroidUpdateChecker />
    </ThemeProvider>
  );
}

function AndroidUpdateChecker() {
  const { state, dismiss, skipVersion } = useUpdateChecker();

  if (Platform.OS !== 'android' || state.status !== 'available') {
    return null;
  }

  return (
    <UpdateDialog
      state={state}
      onDownload={(url) => Linking.openURL(url).catch(() => {})}
      onOpenLink={(url) => Linking.openURL(url).catch(() => {})}
      onLater={dismiss}
      onSkip={skipVersion}
    />
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