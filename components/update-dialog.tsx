import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { ArrowRight, Check, Download } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import type { UpdateState } from '@/hooks/use-update-checker';

type UpdateDialogProps = {
  state: Extract<UpdateState, { status: 'available' }>;
  onDownload: (url: string) => void;
  onOpenLink: (url: string) => void;
  onLater: () => void;
  onSkip: () => void;
};

function parseReleaseNotes(notes: string): { bullets: string[]; changelogUrl: string | null } {
  const bullets: string[] = [];
  let changelogUrl: string | null = null;

  for (const raw of notes.split('\n')) {
    const line = raw.trim();
    const url = line.match(/https?:\/\/\S+/)?.[0];
    if (url && /compare|changelog|releases|pull/i.test(line)) {
      changelogUrl = url;
      continue;
    }
    if (/^[-*]\s/.test(line) || /^#{1,6}\s/.test(line)) {
      const text = line
        .replace(/^[-*]\s+/, '')
        .replace(/^#+\s+/, '')
        .replace(/\*\*/g, '');
      if (text) {
        bullets.push(text);
      }
    }
  }

  return { bullets, changelogUrl };
}

export function UpdateDialog({ state, onDownload, onOpenLink, onLater, onSkip }: UpdateDialogProps) {
  const { bullets, changelogUrl } = parseReleaseNotes(state.notes);

  return (
    <Dialog open>
      <DialogContent className="max-h-[75%] p-0 sm:max-w-md">
        <View className="border-border flex-row items-start justify-between gap-4 border-b px-6 py-5 pr-14">
          <View className="gap-1">
            <DialogTitle>Update available</DialogTitle>
            <DialogDescription>
              Version {state.latestVersion} is ready to install.
            </DialogDescription>
          </View>
        </View>

        <ScrollView
          className="flex-shrink px-6 py-5"
          contentContainerClassName="gap-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row gap-3">
            <View className="bg-muted/50 flex-1 gap-1 rounded-lg px-4 py-3">
              <Text variant="muted" className="text-xs font-medium uppercase">
                Installed
              </Text>
              <Text className="text-lg font-semibold">v{state.currentVersion}</Text>
            </View>
            <View className="border-primary/30 bg-primary/10 flex-1 gap-1 rounded-lg border px-4 py-3">
              <Text className="text-primary text-xs font-medium uppercase">Available</Text>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-primary text-lg font-semibold">v{state.latestVersion}</Text>
                <View className="bg-primary rounded-full px-1.5 py-0.5">
                  <Text className="text-primary-foreground text-[10px] font-semibold uppercase">
                    New
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium">What&apos;s new</Text>
            {bullets.length > 0 ? (
              <View className="gap-2.5">
                {bullets.map((bullet, index) => (
                  <View key={index} className="flex-row gap-2.5">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                    <Text variant="muted" className="flex-1 text-sm">
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text variant="muted" className="text-sm">
                No release notes provided.
              </Text>
            )}
            {changelogUrl ? (
              <Pressable
                onPress={() => onOpenLink(changelogUrl)}
                hitSlop={8}
                className="mt-1 flex-row items-center gap-1 self-start"
              >
                <Text className="text-primary text-sm font-medium">View full changelog</Text>
                <ArrowRight className="text-primary size-3.5" />
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        <View className="border-border gap-4 border-t px-6 py-5">
          <View className="flex-row items-center justify-center gap-4">
            <Pressable onPress={onLater} hitSlop={8}>
              <Text className="text-sm font-medium text-foreground">Later</Text>
            </Pressable>
            <View className="bg-border h-3 w-px" />
            <Pressable onPress={onSkip} hitSlop={8}>
              <Text className="text-muted-foreground text-sm">Skip this version</Text>
            </Pressable>
          </View>
          <Button onPress={() => onDownload(state.downloadUrl)} size="lg" className="w-full">
            <Download className="size-4" />
            <Text>Download Update</Text>
          </Button>
        </View>
      </DialogContent>
    </Dialog>
  );
}
