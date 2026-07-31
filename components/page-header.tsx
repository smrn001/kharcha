import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="px-5 pb-2 pt-4">
      <Text className="text-2xl font-bold">{title}</Text>
      {subtitle ? <Text variant="muted">{subtitle}</Text> : null}
    </View>
  );
}
