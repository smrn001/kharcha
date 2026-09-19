import { CategoryForm } from '@/components/category-form';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { NativeBlock } from '@/components/native-block';
import { Button, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { useSQLiteContext } from 'expo-sqlite';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
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
  const colors = useTheme();

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
      <View style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            title: t('cat.editTitle'),
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={{ paddingVertical: 64, alignItems: 'center' }}>
          <NativeBlock>
            <Text textStyle={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
              {t('common.loading')}
            </Text>
          </NativeBlock>
        </View>
      </View>
    );
  }

  if (!category) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            title: t('cat.editTitle'),
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={{ paddingVertical: 64, alignItems: 'center' }}>
          <NativeBlock>
            <Text textStyle={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
              {t('cat.notFound')}
            </Text>
          </NativeBlock>
        </View>
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
        setDeleteError(t('cat.usedMsg', { count: usage, plural: plural(usage) }));
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
    <View style={{ flex: 1 }}>
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
          <View style={{ alignItems: 'center' }}>
            <NativeBlock>
              <Button variant="text" onPress={() => setDeleteOpen(true)}>
                <Text textStyle={{ fontSize: 15, fontWeight: '500', color: colors.destructive }}>
                  {t('cat.deleteBtn')}
                </Text>
              </Button>
            </NativeBlock>
          </View>
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