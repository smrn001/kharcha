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
import { useDetailDate } from '@/hooks/use-day-heading';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { categoryIcon } from '@/lib/category-icons';
import { hapticMediumImpact } from '@/lib/haptics';
import { categoryDisplayName } from '@/lib/i18n';
import { deleteTransaction, getTransactionById } from '@/lib/db/transactions';
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
  const { t, lang } = useI18n();
  const detailDate = useDetailDate();

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
        <ScreenHeader title={t('det.title')} />
        <View className="flex-1 items-center pt-16">
          <Text variant="muted">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const IconComponent = categoryIcon(category?.icon);

  const handleDelete = async () => {
    try {
      await deleteTransaction(db, transaction.id);
      void hapticMediumImpact();
      router.back();
    } catch {
      setConfirmDelete(false);
    }
  };

  return (
    <View className="bg-background flex-1">
      <ScreenHeader title={t('det.title')} />

      <View className="flex-1 items-center px-6 pt-8">
        <View className="bg-muted h-16 w-16 items-center justify-center rounded-full">
          <Icon as={IconComponent} size={28} />
        </View>
        <Text selectable className="mt-4 text-4xl font-bold tabular-nums">
          {isIncome ? '+' : '-'}
          {formatAmount(transaction.amount, settings.currency)}
        </Text>
        <Text className={cn('mt-1 text-sm font-medium', isIncome ? 'text-positive' : 'text-muted-foreground')}>
          {isIncome ? t('det.income') : t('det.expense')}
        </Text>

        <View className="mt-8 w-full rounded-xl border border-border bg-card px-4">
          <DetailRow label={t('det.category')} value={category ? categoryDisplayName(category, lang) : t('common.unknown')} />
          <View className="bg-border mx-4 h-px" />
          <DetailRow label={t('det.titleRow')} value={transaction.title || '—'} />
          <View className="bg-border mx-4 h-px" />
          <DetailRow label={t('det.note')} value={transaction.note || '—'} />
          <View className="bg-border mx-4 h-px" />
          <DetailRow label={t('det.dateTime')} value={detailDate(transaction)} />
        </View>

        <View className="mt-8 w-full gap-3">
          <Button
            onPress={() => router.push(`/transaction/new?id=${transaction.id}`)}
            className="w-full"
          >
            <Text className="text-primary-foreground font-medium">{t('det.edit')}</Text>
          </Button>
          <Pressable onPress={() => setConfirmDelete(true)} hitSlop={8} className="active:opacity-60">
            <Text className="text-destructive py-3 text-center text-sm font-medium">{t('det.delete')}</Text>
          </Pressable>
        </View>
      </View>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('det.delTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('det.delDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>{t('det.cancel')}</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={handleDelete}
              className="bg-destructive dark:bg-destructive/60"
            >
              <Text className="text-white font-medium">{t('common.delete')}</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
