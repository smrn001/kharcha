import { CategoryForm } from '@/components/category-form';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/hooks/use-i18n';
import { useSQLiteContext } from 'expo-sqlite';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  countCategoryUsage,
  deleteCategory,
  getCategoryById,
  updateCategory,
} from '@/lib/db/categories';
import type { Category, NewCategory } from '@/types';

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { t, plural } = useI18n();

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getCategoryById(db, id).then((row) => {
      if (active) {
        setCategory(row);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [db, id]);

  if (loading) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{
            title: t('cat.editTitle'),
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Text variant="muted" className="px-5 py-16 text-center">
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (!category) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{
            title: t('cat.editTitle'),
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Text variant="muted" className="px-5 py-16 text-center">
          {t('cat.notFound')}
        </Text>
      </View>
    );
  }

  const handleSubmit = async (input: NewCategory) => {
    setSubmitting(true);
    setError(null);
    try {
      await updateCategory(db, id, input);
      router.back();
    } catch {
      setError(t('cat.errUpdate'));
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setDeleteError(null);
    try {
      const usage = await countCategoryUsage(db, id);
      if (usage > 0) {
        setDeleteError(
          t('cat.usedMsg', { count: usage, plural: plural(usage) })
        );
        return;
      }
      await deleteCategory(db, id);
      router.back();
    } catch {
      setDeleteError(t('cat.errDelete'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          title: t('cat.editTitle'),
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <CategoryForm
        initial={{ name: category.name, icon: category.icon, type: category.type }}
        submitLabel={t('common.saveChanges')}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
        footer={
          <Pressable onPress={() => setDeleteOpen(true)} hitSlop={8} className="active:opacity-60">
            <Text className="text-destructive py-2 text-center text-sm font-medium">
              {t('cat.deleteBtn')}
            </Text>
          </Pressable>
        }
      />

      <ConfirmSheet
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('cat.delTitle')}
        description={t('cat.delDesc')}
        error={deleteError}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        busy={busy}
        onConfirm={handleDelete}
      />
    </View>
  );
}
