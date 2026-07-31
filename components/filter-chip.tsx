import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Pressable } from 'react-native';

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
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full border px-3 py-1.5',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      )}
    >
      <Text
        className={cn('text-sm', selected ? 'font-medium text-foreground' : 'text-muted-foreground')}
      >
        {label}
      </Text>
    </Pressable>
  );
}
