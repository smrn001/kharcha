import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export function ScreenHeader({
  title,
  rightAction,
}: {
  title: string;
  rightAction?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityLabel="Go back"
        className="bg-muted h-10 w-10 items-center justify-center rounded-full active:bg-muted/80"
      >
        <Icon as={ArrowLeft} size={20} />
      </Pressable>
      <Text className="text-base font-semibold">{title}</Text>
      <View className="h-10 w-10">{rightAction}</View>
    </View>
  );
}
