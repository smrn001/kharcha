import { Button, Column, Icon, Row, Spacer, Text } from '@expo/ui';
import { CHEVRON_ICON } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import type { ReactNode } from 'react';

/**
 * A single `FieldGroup` row: label (plus optional supporting line) on the
 * left, current `value` and/or custom `trailing` on the right, chevron by
 * default. Used for settings rows that open a sheet or run an action.
 */
export function FieldRow({
  label,
  value,
  supporting,
  onPress,
  disabled,
  trailing,
}: {
  label: string;
  value?: string;
  supporting?: string;
  onPress?: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
}) {
  const colors = useTheme();
  return (
    <Button
      variant="text"
      onPress={onPress}
      disabled={disabled}
      style={{ paddingVertical: 0, paddingHorizontal: 0, borderRadius: 12 }}
    >
      <Row alignment="center" spacing={12}>
        <Column spacing={2}>
          <Text textStyle={{ fontSize: 16, color: colors.text }}>{label}</Text>
          {supporting ? (
            <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>{supporting}</Text>
          ) : null}
        </Column>
        <Spacer flexible />
        {value ? (
          <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>{value}</Text>
        ) : null}
        {trailing ?? <Icon name={CHEVRON_ICON} size={16} color={colors.textSecondary} />}
      </Row>
    </Button>
  );
}