import { Icon } from '@/components/ui/icon';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';

export function FloatingAddButton() {
  return (
    <Pressable
      onPress={() => router.push('/transaction/new')}
      accessibilityLabel="Add transaction"
      className="bg-primary absolute bottom-6 right-6 z-10 h-14 w-14 items-center justify-center rounded-full active:bg-primary/90"
      style={{
        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.2)',
        elevation: 4,
      }}
    >
      <Icon as={Plus} size={24} className="text-primary-foreground" />
    </Pressable>
  );
}
