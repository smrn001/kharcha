import { Button, Icon, Row, Spacer, Text } from '@expo/ui';
import { useTheme } from '@/lib/theme';

const CHEVRON_ICON = Icon.select({
  ios: 'chevron.right',
  android: import('@expo/material-symbols/chevron_right.xml'),
});

/**
 * A `FieldGroup` row that shows the current value and opens a `SelectionSheet`
 * on tap (label + current value + chevron on the right).
 */
export function SelectionRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Button
      variant="text"
      onPress={onPress}
      style={{ paddingVertical: 0, paddingHorizontal: 0, borderRadius: 12 }}
    >
      <Row alignment="center" spacing={12}>
        <Text textStyle={{ fontSize: 16, color: colors.text }}>{label}</Text>
        <Spacer flexible />
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>{value}</Text>
        <Icon name={CHEVRON_ICON} size={16} color={colors.textSecondary} />
      </Row>
    </Button>
  );
}