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
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { useSettings } from '@/hooks/use-settings';
import { categoryIcon } from '@/lib/category-icons';
import { deleteTransaction, getTransactionById } from '@/lib/db/transactions';
import { formatDateTime } from '@/lib/dates';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Transaction } from '@/types';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text variant="muted">{label}</Text>
      <Text className="text-sm font-medium">{value}</Text>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { categories } = useCategories();
  const { settings } = useSettings();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;
    getTransactionById(db, id).then((tx) => {
      if (active) {
        setTransaction(tx);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [db, id]);

  const category = transaction
    ? categories.find((c) => c.id === transaction.categoryId) ?? null
    : null;

  if (loading || !transaction) {
    return (
      <View className="bg-background flex-1">
        <ScreenHeader title="Transaction" />
        <View className="flex-1 items-center pt-16">
          <Text variant="muted">Loading…</Text>
        </View>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const IconComponent = categoryIcon(category?.icon);

  const handleDelete = async () => {
    try {
      await deleteTransaction(db, transaction.id);
      router.back();
    } catch {
      setConfirmDelete(false);
    }
  };

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title="Transaction" />

      <View className="flex-1 items-center px-6 pt-8">
        <View className="bg-muted h-16 w-16 items-center justify-center rounded-full">
          <Icon as={IconComponent} size={28} />
        </View>
        <Text className="mt-4 text-4xl font-bold">
          {isIncome ? '+' : '-'}
          {formatAmount(transaction.amount, settings.currency)}
        </Text>
        <Text className={cn('mt-1 text-sm font-medium', isIncome ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
          {isIncome ? 'Income' : 'Expense'}
        </Text>

        <View className="mt-8 w-full rounded-xl border-border bg-card px-4">
          <DetailRow label="Category" value={category?.name ?? 'Unknown'} />
          <View className="border-border h-px bg-border" />
          <DetailRow label="Title" value={transaction.title || '—'} />
          <View className="border-border h-px bg-border" />
          <DetailRow label="Note" value={transaction.note || '—'} />
          <View className="border-border h-px bg-border" />
          <DetailRow label="Date & Time" value={formatDateTime(transaction.date)} />
        </View>

        <View className="mt-8 w-full gap-3">
          <Button
            onPress={() => router.push(`/transaction/new?id=${transaction.id}`)}
            className="w-full"
          >
            <Text className="text-primary-foreground font-medium">Edit</Text>
          </Button>
          <Pressable onPress={() => setConfirmDelete(true)}>
            <Text className="text-destructive py-3 text-center text-sm font-medium">Delete</Text>
          </Pressable>
        </View>
      </View>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The transaction will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={handleDelete}
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
