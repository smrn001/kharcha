import { Button, Text } from '@expo/ui';
import { hapticSelection } from '@/lib/haptics';

export function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      variant={selected ? 'filled' : 'outlined'}
      onPress={() => {
        void hapticSelection();
        onPress();
      }}
      style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}
    >
      <Text textStyle={{ fontSize: 14, fontWeight: selected ? '500' : '400' }}>{label}</Text>
    </Button>
  );
}