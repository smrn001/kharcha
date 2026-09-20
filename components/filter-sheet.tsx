import { BottomSheet, Button, Column, Row, ScrollView, Spacer, Text } from '@expo/ui';
import { useTheme } from '@/lib/theme';
import type { ReactNode } from 'react';

/**
 * Bottom sheet layout used by the transaction filter sheet: title, scrollable
 * content sections, and a footer with an optional reset action beside the
 * primary action button.
 */
export function FilterSheet({
  title,
  open,
  onDismiss,
  children,
  footer,
}: {
  title: string;
  open: boolean;
  onDismiss: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const colors = useTheme();
  return (
    <BottomSheet
      isPresented={open}
      onDismiss={onDismiss}
      contentPadding={{ left: 24, right: 24, top: 8, bottom: 20 }}
    >
      <Column spacing={16}>
        <Text textStyle={{ fontSize: 18, fontWeight: '600', color: colors.text }}>{title}</Text>
        <ScrollView>
          <Column spacing={20}>{children}</Column>
        </ScrollView>
        {footer}
      </Column>
    </BottomSheet>
  );
}

/** Standard footer: optional reset action + primary action button. */
export function FilterSheetFooter({
  resetLabel,
  onReset,
  actionLabel,
  onAction,
}: {
  resetLabel?: string;
  onReset?: () => void;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Row alignment="center" spacing={8}>
      {resetLabel && onReset ? (
        <Button variant="text" label={resetLabel} onPress={onReset} />
      ) : null}
      <Spacer flexible />
      <Button
        variant="filled"
        label={actionLabel}
        onPress={onAction}
        style={{ height: 48, borderRadius: 12 }}
      />
    </Row>
  );
}