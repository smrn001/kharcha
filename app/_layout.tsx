import { UpdateDialog } from '@/components/update-dialog';
import { SettingsProvider } from '@/hooks/use-settings';
import { UpdateCheckerProvider, useUpdateChecker } from '@/hooks/use-update-checker';
import { DatabaseProvider } from '@/lib/db/database';
import { useTheme } from '@/lib/theme';
import { Host } from '@expo/ui';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Platform, View, useColorScheme, AppState } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

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
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const scheme = useColorScheme();
  const [, resyncPalette] = useState(0);

  // `getMaterialColors` reads the palette per render but never subscribes to
  // system changes, so forcing a re-render on foreground keeps the JS-side
  // tokens in sync after a wallpaper/theme change.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        resyncPalette((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, []);

  // react-navigation paints each native screen with the navigation theme's
  // background; without a themed ThemeProvider every screen renders opaque
  // white and covers the host canvas. Toggle the nav theme with the device
  // scheme and pin the content background to our themed canvas.
  const navigationTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <>
      <StatusBar style="auto" />
      <Host style={{ flex: 1 }} colorScheme={scheme ?? undefined}>
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.background }}>
          <ThemeProvider value={navigationTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            />
          </ThemeProvider>
        </View>
      </Host>
      <AndroidUpdateChecker />
    </>
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