import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAppliedTheme } from '@/hooks/use-applied-theme';
import { PanelsTopLeft, TriangleAlert } from 'lucide-react-native';
import { Platform, View } from 'react-native';

type DatabaseUnavailableScreenProps = {
  kind: 'other-tab' | 'error';
  onRetry?: () => void;
};

export function DatabaseUnavailableScreen(props: DatabaseUnavailableScreenProps) {
  // The screen can render outside the themed layout tree (e.g. when the
  // database gate blocks the app before settings are loaded), so ensure the
  // web color scheme is applied. Native keeps the user's saved preference.
  if (Platform.OS === 'web') {
    return (
      <WebTheme>
        <DatabaseUnavailableContent {...props} />
      </WebTheme>
    );
  }
  return <DatabaseUnavailableContent {...props} />;
}

function WebTheme({ children }: { children: React.ReactNode }) {
  useAppliedTheme('system');
  return <>{children}</>;
}

function DatabaseUnavailableContent({ kind, onRetry }: DatabaseUnavailableScreenProps) {
  const isOtherTab = kind === 'other-tab';
  const title = isOtherTab ? 'Already open in another tab' : "Kharcha couldn't be opened";
  const message = isOtherTab
    ? 'Kharcha keeps its data in a private browser file that only one tab can use at a time. Switch to the tab that is already open, or close it and try again.'
    : 'Something went wrong while opening your expense database. Please try again.';

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="max-w-md items-center gap-4">
        <View className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
          {isOtherTab ? (
            <PanelsTopLeft className="text-muted-foreground" size={28} strokeWidth={1.75} />
          ) : (
            <TriangleAlert className="text-muted-foreground" size={28} strokeWidth={1.75} />
          )}
        </View>
        <Text className="text-center text-2xl font-semibold text-foreground">{title}</Text>
        <Text className="text-center text-muted-foreground">{message}</Text>
        {onRetry && (
          <Button onPress={onRetry} className="mt-2">
            <Text>Try again</Text>
          </Button>
        )}
      </View>
    </View>
  );
}
