import { ScreenHeader } from '@/components/screen-header';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { categoryIcon } from '@/lib/category-icons';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { Category, TransactionType } from '@/types';

interface Section {
  key: TransactionType;
  title: string;
  data: Category[];
}

function CategoryRow({ category, onPress }: { category: Category; onPress: () => void }) {
  const IconComponent = categoryIcon(category.icon);
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-3">
      <View className="bg-muted h-10 w-10 items-center justify-center rounded-full">
        <Icon as={IconComponent} size={18} />
      </View>
      <Text className="flex-1 text-sm font-medium">{category.name}</Text>
      <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
    </Pressable>
  );
}

export default function CategoriesScreen() {
  const { categories, loading, refresh } = useCategories();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const sections: Section[] = [
    { key: 'expense', title: 'Expenses', data: categories.filter((c) => c.type === 'expense') },
    { key: 'income', title: 'Income', data: categories.filter((c) => c.type === 'income') },
  ];

  return (
    <View className="bg-background flex-1">
      <ScreenHeader
        title="Categories"
        rightAction={
          <Pressable
            onPress={() => router.push('/categories/new')}
            accessibilityLabel="Add category"
            className="bg-primary h-10 w-10 items-center justify-center rounded-full active:bg-primary/90"
          >
            <Icon as={Plus} size={20} className="text-primary-foreground" />
          </Pressable>
        }
      />

      {loading && categories.length === 0 ? (
        <Text variant="muted" className="px-5 py-16 text-center">
          Loading…
        </Text>
      ) : (
        <ScrollView contentContainerClassName="gap-6 px-5 pb-8">
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
