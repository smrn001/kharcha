import { NativeBlock } from '@/components/native-block';
import { CALENDAR_ICON, CHEVRON_DOWN_ICON } from '@/lib/icons';
import { Button, Icon, Text } from '@expo/ui';

/**
 * Period selector for the analytics header: a single native `Button` (one
 * Compose view, therefore one reliable touch target) showing the calendar icon,
 * the current period and a chevron.
 *
 * NOTE: it used to be a React Native `Pressable` wrapping three separate
 * `NativeBlock`s. Three hosts inside a touch target means three independent
 * native views competing for the same gesture, which made the control dead in
 * places — a single `Button` avoids that entirely.
 */
export function PeriodPicker({
  periodTitle,
  onPress,
}: {
  periodTitle: string;
  onPress: () => void;
}) {
  return (
    <NativeBlock>
      <Button variant="filled" onPress={onPress}>
        <Icon name={CALENDAR_ICON} size={16} />
        <Text textStyle={{ fontSize: 14, fontWeight: '600' }}>{periodTitle}</Text>
        <Icon name={CHEVRON_DOWN_ICON} size={16} />
      </Button>
    </NativeBlock>
  );
}
