import { Button, Icon, ListItem, Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useCategories } from '@/hooks/use-categories';
import { useI18n } from '@/hooks/use-i18n';
import { categoryIcon } from '@/lib/category-icons';
import { categoryDisplayName } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import type { Category, TransactionType } from '@/types';
import type { SupportedLang } from '@/lib/i18n';

const PLUS_ICON = Icon.select({
  ios: 'plus',
  android: import('@expo/material-symbols/add.xml'),
});

function CategoryRow({
  category,
  lang,
  onPress,
}: {
  category: Category;
  lang: SupportedLang;
  onPress: () => void;
}) {
  return (
    <NativeBlock matchContents={false}>
      <ListItem
        leading={<Icon name={categoryIcon(category.icon)} size={18} />}
        children={categoryDisplayName(category, lang)}
        trailing={<Icon name={CHEVRON_ICON_SYM} size={16} />}
        onPress={onPress}
      />
    </NativeBlock>
  );
}

const CHEVRON_ICON_SYM = Icon.select({
  ios: 'chevron.right',
  android: import('@expo/material-symbols/chevron_right.xml'),
});

function SectionLabel({ children }: { children: string }) {
  const colors = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
      <NativeBlock>
        <Text
          textStyle={{
            fontSize: 12,
            fontWeight: '600',
            color: colors.textSecondary,
          }}
        >
          {children}
        </Text>
      </NativeBlock>
    </View>
  );
}

export default function CategoriesScreen() {
  const { categories, loading, refresh } = useCategories();
  const { t, lang } = useI18n();
  const colors = useTheme();

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
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: t('cat.title'),
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerRight: () => (
            <NativeBlock>
              <Button
                variant="text"
                label={t('cat.add')}
                onPress={() => router.push('/categories/new')}
              >
                <Icon name={PLUS_ICON} size={20} />
              </Button>
            </NativeBlock>
          ),
        }}
      />

      {loading && categories.length === 0 ? (
        <NativeBlock>
          <Text textStyle={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
            {t('common.loading')}
          </Text>
        </NativeBlock>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 48 }} contentInsetAdjustmentBehavior="automatic">
          {sections.map((section) => (
            <View key={section.key}>
              <SectionLabel>{section.title}</SectionLabel>
              {section.data.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  lang={lang}
                  onPress={() => router.push(`/categories/${category.id}`)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}