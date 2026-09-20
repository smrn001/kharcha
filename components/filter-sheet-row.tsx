import { Button, Icon, Row, Spacer, Text } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { hapticSelection } from '@/lib/haptics';
import { CHECK_ICON } from '@/lib/icons';
import { useTheme } from '@/lib/theme';

/**
 * Option row rendered inside a filter sheet. A `Button` (universal/Compose)
 * kept as a direct child of the sheet's Compose content; `fillMaxWidth` makes
 * it span the sheet.
 */
export function FilterSheetRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Button
      variant="text"
      onPress={() => {
        void hapticSelection();
        onPress();
      }}
      modifiers={[fillMaxWidth()]}
      style={{ paddingHorizontal: 0, paddingVertical: 2, borderRadius: 12 }}
    >
      <Row alignment="center" spacing={12}>
        <Text textStyle={{ fontSize: 16, fontWeight: selected ? '600' : '400', color: colors.text }}>
          {label}
        </Text>
        <Spacer flexible />
        {selected ? <Icon name={CHECK_ICON} size={20} color={colors.primary} /> : null}
      </Row>
    </Button>
  );
}