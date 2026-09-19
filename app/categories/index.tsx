import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { useI18n } from '@/hooks/use-i18n';
import { categoryIcon } from '@/lib/category-icons';
import { categoryDisplayName } from '@/lib/i18n';
import { router, Stack, useFocusEffect } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { Category, TransactionType } from '@/types';
import type { SupportedLang } from '@/lib/i18n';

function CategoryRow({
  category,
  lang,
  onPress,
}: {
  category: Category;
  lang: SupportedLang;
  onPress: () => void;
}) {
  const IconComponent = categoryIcon(category.icon);
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-muted/60"
    >
      <View className="bg-muted h-10 w-10 items-center justify-center rounded-full">
        <Icon as={IconComponent} size={18} />
      </View>
      <Text className="flex-1 text-sm font-medium">{categoryDisplayName(category, lang)}</Text>
      <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
    </Pressable>
  );
}

export default function CategoriesScreen() {
  const { categories, loading, refresh } = useCategories();
  const { t, lang } = useI18n();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const sections: { key: TransactionType; title: string; data: Category[] }[] = [
    { key: 'expense', title: t('cat.expenseSec'), data: categories.filter((c) => c.type === 'expense') },
    { key: 'income', title: t('cat.incomeSec'), data: categories.filter((c) => c.type === 'income') },
  ];

  return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{
            title: t('cat.title'),
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
            headerRight: () => (
              <Pressable
                onPress={() => router.push('/categories/new')}
                accessibilityLabel={t('cat.add')}
                accessibilityRole="button"
                hitSlop={8}
                className="bg-primary h-10 w-10 items-center justify-center rounded-full active:bg-primary/90"
              >
                <Icon as={Plus} size={20} className="text-primary-foreground" />
              </Pressable>
            ),
          }}
        />

        {loading && categories.length === 0 ? (
          <Text variant="muted" className="px-5 py-16 text-center">
            {t('common.loading')}
          </Text>
        ) : (
          <ScrollView contentContainerClassName="gap-6 px-5 pb-8" contentInsetAdjustmentBehavior="automatic">
            {sections.map((section) => (
              <View key={section.key} className="gap-2">
              <Text variant="muted" className="px-1 text-xs font-semibold uppercase">
                {section.title}
              </Text>
              <View className="border-border bg-card overflow-hidden rounded-xl border">
                {section.data.map((category, index) => (
                  <View key={category.id}>
                    {index > 0 ? <View className="bg-border mx-4 h-px" /> : null}
                    <CategoryRow
                      category={category}
                      lang={lang}
                      onPress={() => router.push(`/categories/${category.id}`)}
                    />
                  </View>
                ))}
              </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
  );
}
