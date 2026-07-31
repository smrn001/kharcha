import { CategoryForm } from '@/components/category-form';
import { ScreenHeader } from '@/components/screen-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
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
        <ScreenHeader title="Edit Category" />
        <Text variant="muted" className="px-5 py-16 text-center">
          Loading…
        </Text>
      </View>
    );
  }

  if (!category) {
    return (
      <View className="bg-background flex-1">
        <ScreenHeader title="Edit Category" />
        <Text variant="muted" className="px-5 py-16 text-center">
          Category not found.
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
      setError('Could not update the category. Please try again.');
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
          `This category is used by ${usage} transaction${usage === 1 ? '' : 's'}. Delete or reassign those first.`
        );
        return;
      }
      await deleteCategory(db, id);
      router.back();
    } catch {
      setDeleteError('Could not delete the category. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title="Edit Category" />
      <CategoryForm
        initial={{ name: category.name, icon: category.icon, type: category.type }}
        submitLabel="Save Changes"
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
        footer={
          <Pressable onPress={() => setDeleteOpen(true)} hitSlop={8}>
            <Text className="text-destructive py-2 text-center text-sm font-medium">
              Delete Category
            </Text>
          </Pressable>
        }
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Categories used by transactions cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? <Text className="text-destructive text-sm">{deleteError}</Text> : null}
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={handleDelete}
              disabled={busy}
              className="bg-destructive dark:bg-destructive/60"
            >
              <Text className="text-white font-medium">Delete</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
