import { Button, Icon, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { categoryIcon } from '@/lib/category-icons';
import { hapticSelection } from '@/lib/haptics';
import { categoryDisplayName } from '@/lib/i18n';
import type { Category } from '@/types';
import { View } from 'react-native';

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
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {categories.map((category) => {
        const selected = category.id === selectedId;
        return (
          <Button
            key={category.id}
            variant={selected ? 'filled' : 'outlined'}
            onPress={() => {
              if (category.id !== selectedId) void hapticSelection();
              onSelect(category.id);
            }}
            style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Icon name={categoryIcon(category.icon)} size={14} />
            <Text textStyle={{ fontSize: 14, fontWeight: selected ? '500' : '400' }}>
              {categoryDisplayName(category, lang)}
            </Text>
          </Button>
        );
      })}
    </View>
  );
}