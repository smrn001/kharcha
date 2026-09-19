import { Icon } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useI18n } from '@/hooks/use-i18n';
import { categoryIcon } from '@/lib/category-icons';
import { hapticSelection } from '@/lib/haptics';
import { categoryDisplayName } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import type { Category } from '@/types';
import { Pressable, Text, View } from 'react-native';

/**
 * Wrapping row of Material 3-style category chips. Shares the filter-screen
 * chip aesthetics: the selected chip gets the `secondaryContainer` tonal fill,
 * the resting chip a `surfaceContainer` fill with an `outline` border.
 */
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
  const colors = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {categories.map((category) => {
        const selected = category.id === selectedId;
        return (
          <Pressable
            key={category.id}
            onPress={() => {
              if (category.id !== selectedId) void hapticSelection();
              onSelect(category.id);
            }}
            style={({ pressed }) => [
              {
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: selected ? colors.secondaryContainer : colors.surfaceContainer,
                borderColor: selected ? colors.secondaryContainer : colors.outline,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <NativeBlock>
              <Icon
                name={categoryIcon(category.icon)}
                size={15}
                color={selected ? colors.onSecondaryContainer : colors.textSecondary}
              />
            </NativeBlock>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: selected ? colors.onSecondaryContainer : colors.textSecondary,
              }}
            >
              {categoryDisplayName(category, lang)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}