import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export default function TransactionsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-2xl font-bold">Transactions</Text>
      <Text variant="muted" className="mt-2 text-center">
        Transaction list ships in Phase 2.
      </Text>
    </View>
  );
}
