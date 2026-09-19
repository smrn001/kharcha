import { UpdateDialog } from '@/components/update-dialog';
import { SettingsProvider } from '@/hooks/use-settings';
import { UpdateCheckerProvider, useUpdateChecker } from '@/hooks/use-update-checker';
import { DatabaseProvider } from '@/lib/db/database';
import { Host } from '@expo/ui';
import { Stack } from 'expo-router';
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
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="auto" />
      <Host style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <Stack screenOptions={{ headerShown: false }} />
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