import { UpdateDialog } from '@/components/update-dialog';
import { useAppliedColorScheme, useAppliedTheme } from '@/hooks/use-applied-theme';
import { SettingsProvider } from '@/hooks/use-settings';
import { UpdateCheckerProvider, useUpdateChecker } from '@/hooks/use-update-checker';
import { DatabaseProvider } from '@/lib/db/database';
import { useTheme, ThemeTokensProvider } from '@/lib/theme';
import { Host } from '@expo/ui';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
  // Let the persisted theme preference (if any) drive the resolved scheme. This
  // must run before `ThemeTokensProvider` reads `useColorScheme()`, so it stays
  // here rather than inside the provider.
  useAppliedTheme();

  return (
    <ThemeTokensProvider>
      <ThemedContent />
    </ThemeTokensProvider>
  );
}

function ThemedContent() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const scheme = useAppliedColorScheme();

  // react-navigation paints each native screen with the navigation theme's
  // background; without a themed ThemeProvider every screen renders opaque
  // white and covers the host canvas. Toggle the nav theme with the device
  // scheme and pin the content background to our themed canvas.
  const navigationTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  // Android draws edge-to-edge, so the status bar sits directly on the themed
  // screen background. Pin the icon color to the scheme we already resolved
  // (`auto` re-reads the scheme on mount, which is null on first render in dev
  // builds and can leave the wrong icon tone on the background).
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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