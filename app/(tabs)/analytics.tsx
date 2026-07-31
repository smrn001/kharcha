import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-2xl font-bold">Analytics</Text>
      <Text variant="muted" className="mt-2 text-center">
        Charts and trends ship in Phase 5.
      </Text>
    </View>
  );
}
