import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { hslToHex, THEME } from '@/lib/theme';
import { BottomSheet } from '@expo/ui';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

/**
 * Confirmation modal built on the universal `BottomSheet` from `@expo/ui`.
 * Used for destructive confirmations (reset data, delete transaction, delete
 * category). Children are regular React Native views, so they stay fully
 * themed with the app palette.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  busy,
  error,
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];

  return (
    <BottomSheet
      isPresented={open}
      onDismiss={() => onOpenChange(false)}
      containerColor={hslToHex(colors.background)}
      contentPadding={{ left: 20, right: 20, top: 20, bottom: 24 }}
    >
      <View className="gap-5">
        <View className="gap-1.5">
          <Text className="text-foreground text-lg font-semibold">{title}</Text>
          {description ? (
            <Text variant="muted" className="text-sm leading-5">
              {description}
            </Text>
          ) : null}
          {error ? (
            <Text selectable className="text-destructive text-sm">
              {error}
            </Text>
          ) : null}
        </View>
        <View className="gap-2.5">
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={busy}>
            <Text className="font-medium">{cancelLabel}</Text>
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onPress={onConfirm}
            disabled={busy}
          >
            <Text className="font-medium">{confirmLabel}</Text>
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}