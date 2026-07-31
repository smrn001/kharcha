import { FloatingAddButton } from '@/components/floating-add-button';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { View } from 'react-native';

export default function HomeScreen() {
  const { categories, loading } = useCategories('expense');

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold">Good morning</Text>
        <Text variant="muted">Here is your spending overview.</Text>
      </View>

      <View className="gap-4 px-6 pt-6">
        <View className="rounded-xl border-border bg-card p-4">
          <Text variant="muted">Database</Text>
          <Text className="mt-1 text-lg font-semibold">
            {loading ? 'Loading…' : `${categories.length} expense categories ready`}
          </Text>
        </View>

        <View className="rounded-xl border-border bg-card p-4">
          <Text variant="muted">Phase 3</Text>
          <Text className="mt-1 text-lg font-semibold">Balance card and spending summary</Text>
        </View>
      </View>

      <FloatingAddButton />
    </View>
  );
}
