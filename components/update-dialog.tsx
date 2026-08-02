import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { Download } from 'lucide-react-native';
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import type { UpdateState } from '@/hooks/use-update-checker';

type UpdateDialogProps = {
  state: Extract<UpdateState, { status: 'available' }>;
  onDownload: (url: string) => void;
  onLater: () => void;
  onSkip: () => void;
};

export function UpdateDialog({ state, onDownload, onLater, onSkip }: UpdateDialogProps) {
  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update available</DialogTitle>
          <DialogDescription>
            A newer version of Kharcha is ready to install.
          </DialogDescription>
        </DialogHeader>

        <View className="gap-4">
          <View className="flex-row items-center justify-center gap-6 py-1">
            <View className="flex-1 items-center gap-1 rounded-lg bg-muted/50 px-4 py-3">
              <Text variant="muted" className="text-xs font-medium uppercase">
                Current
              </Text>
              <Text className="text-lg font-semibold">v{state.currentVersion}</Text>
            </View>
            <View className="flex-1 items-center gap-1 rounded-lg bg-primary/10 px-4 py-3">
              <Text className="text-primary text-xs font-medium uppercase">Latest</Text>
              <Text className="text-primary text-lg font-semibold">v{state.latestVersion}</Text>
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium">Whats new</Text>
            <ScrollView
              className="border-border bg-muted/30 max-h-40 rounded-lg border p-3"
              showsVerticalScrollIndicator={false}
            >
              <Text variant="muted" className="text-sm">
                {state.notes || 'No release notes provided.'}
              </Text>
            </ScrollView>
          </View>

          <Text variant="muted" className="text-center text-xs">
            Downloading will open your browser to install the update.
          </Text>
        </View>

        <DialogFooter className="gap-3 sm:flex-col">
          <Button onPress={() => onDownload(state.downloadUrl)} size="lg">
            <Download className="size-4" />
            <Text>Download Update</Text>
          </Button>
          <View className="flex-row items-center justify-center gap-4">
            <Pressable onPress={onLater} hitSlop={8}>
              <Text className="text-sm font-medium text-foreground">Later</Text>
            </Pressable>
            <View className="bg-border h-3 w-px" />
            <Pressable onPress={onSkip} hitSlop={8}>
              <Text className="text-muted-foreground text-sm">Skip this version</Text>
            </Pressable>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function openDownloadUrl(url: string): void {
  if (Platform.OS === 'android') {
    Linking.openURL(url).catch(() => {});
  }
}
