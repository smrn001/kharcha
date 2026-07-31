import { CategoryForm } from '@/components/category-form';
import { ScreenHeader } from '@/components/screen-header';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { createCategory } from '@/lib/db/categories';
import type { NewCategory } from '@/types';

export default function NewCategoryScreen() {
  const db = useSQLiteContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (input: NewCategory) => {
    setSubmitting(true);
    setError(null);
    try {
      await createCategory(db, input);
      router.back();
    } catch {
      setError('Could not create the category. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title="New Category" />
      <CategoryForm
        submitLabel="Create Category"
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
