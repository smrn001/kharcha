import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/hooks/use-i18n';
import { categoryIcon } from '@/lib/category-icons';
import { hapticSelection } from '@/lib/haptics';
import { categoryDisplayName } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { Pressable, View } from 'react-native';

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { lang } = useI18n();
  return (
    <View className="flex-row flex-wrap gap-2">
      {categories.map((category) => {
        const selected = category.id === selectedId;
        const IconComponent = categoryIcon(category.icon);
        return (
          <Pressable
            key={category.id}
            onPress={() => {
              if (category.id !== selectedId) void hapticSelection();
              onSelect(category.id);
            }}
            className={cn(
              'flex-row items-center gap-2 rounded-full border px-3 py-2 active:opacity-70',
              selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
            )}
          >
            <Icon
              as={IconComponent}
              size={14}
              className={cn(selected ? undefined : 'text-muted-foreground')}
            />
            <Text className={cn('text-sm', selected && 'text-foreground font-medium')}>
              {categoryDisplayName(category, lang)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
