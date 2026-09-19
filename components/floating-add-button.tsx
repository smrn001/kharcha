import { Icon } from '@/components/ui/icon';
import { useI18n } from '@/hooks/use-i18n';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';

export function FloatingAddButton() {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={() => router.push('/transaction/new')}
      accessibilityLabel={t('fab.add')}
      accessibilityRole="button"
      className="bg-primary absolute bottom-6 right-6 z-10 h-14 w-14 items-center justify-center rounded-full transition-transform duration-100 active:scale-95 active:bg-primary/90"
      style={{
        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.2)',

      }}
    >
      <Icon as={Plus} size={24} className="text-primary-foreground" />
    </Pressable>
  );
}
