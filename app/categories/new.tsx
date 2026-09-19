import { CategoryForm } from '@/components/category-form';
import { useI18n } from '@/hooks/use-i18n';
import { useSQLiteContext } from 'expo-sqlite';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { createCategory } from '@/lib/db/categories';
import type { NewCategory } from '@/types';

export default function NewCategoryScreen() {
  const db = useSQLiteContext();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (input: NewCategory) => {
    setSubmitting(true);
    setError(null);
    try {
      await createCategory(db, input);
      router.back();
    } catch {
      setError(t('cat.errCreate'));
      setSubmitting(false);
    }
  };

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          title: t('cat.newTitle'),
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <CategoryForm
        submitLabel={t('cat.create')}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
