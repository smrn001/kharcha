import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-2xl font-bold">Settings</Text>
      <Text variant="muted" className="mt-2 text-center">
        Currency and theme settings ship in Phase 6.
      </Text>
    </View>
  );
}
