import { BottomSheet, Button, Column, Text } from '@expo/ui';
import { useAppColors } from '@/lib/colors';

/**
 * Confirmation modal built on the universal `BottomSheet` from `@expo/ui`.
 * Uses device-adaptive surfaces and the accent (filled/plain) buttons.
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
  const colors = useAppColors();

  return (
    <BottomSheet
      isPresented={open}
      onDismiss={() => onOpenChange(false)}
      contentPadding={{ left: 24, right: 24, top: 8, bottom: 20 }}
    >
      <Column spacing={20}>
        <Column spacing={6}>
          <Text textStyle={{ fontSize: 18, fontWeight: '600' }}>{title}</Text>
          {description ? (
            <Text textStyle={{ fontSize: 14, color: colors.mutedForeground, lineHeight: 20 }}>
              {description}
            </Text>
          ) : null}
          {error ? (
            <Text textStyle={{ fontSize: 14, color: colors.destructiveError }}>{error}</Text>
          ) : null}
        </Column>
        <Column spacing={8}>
          <Button variant="text" label={cancelLabel} onPress={() => onOpenChange(false)} disabled={busy} />
          <Button variant="filled" label={confirmLabel} onPress={onConfirm} disabled={busy} />
        </Column>
      </Column>
    </BottomSheet>
  );
}