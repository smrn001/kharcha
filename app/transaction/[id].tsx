import { ConfirmSheet } from '@/components/confirm-sheet';
import { Button, Icon, Text } from '@expo/ui';
import { useCategories } from '@/hooks/use-categories';
import { useDetailDate } from '@/hooks/use-day-heading';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { categoryIcon } from '@/lib/category-icons';
import { hapticMediumImpact } from '@/lib/haptics';
import { categoryDisplayName } from '@/lib/i18n';
import { deleteTransaction, getTransactionById } from '@/lib/db/transactions';
import { formatAmount } from '@/lib/format';
import { useAppColors } from '@/lib/colors';
import { useSQLiteContext } from 'expo-sqlite';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Transaction } from '@/types';

function DetailRow({
  label,
  value,
  separator,
}: {
  label: string;
  value: string;
  separator?: boolean;
}) {
  const colors = useAppColors();
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12 },
        separator ? { borderTopWidth: 1, borderTopColor: colors.separator } : null,
      ]}
    >
      <Text textStyle={{ fontSize: 15, color: colors.mutedForeground }}>{label}</Text>
      <Text textStyle={{ fontSize: 15, fontWeight: '500', textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { t, lang } = useI18n();
  const colors = useAppColors();
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
      <View style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            title: t('det.title'),
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={{ flex: 1, alignItems: 'center', paddingTop: 64 }}>
          <Text textStyle={{ fontSize: 14, color: colors.mutedForeground }}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';

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
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: t('det.title'),
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24 }}>
        <Icon name={categoryIcon(category?.icon)} size={40} color={colors.mutedForeground} />
        <Text textStyle={{ fontSize: 36, fontWeight: 'bold' }}>
          {`${isIncome ? '+' : '-'}${formatAmount(transaction.amount, settings.currency)}`}
        </Text>
        <View style={{ marginTop: 4 }}>
          <Text
            textStyle={{
              fontSize: 14,
              fontWeight: '500',
              color: isIncome ? colors.positive : colors.mutedForeground,
            }}
          >
            {isIncome ? t('det.income') : t('det.expense')}
          </Text>
        </View>

        <View style={{ width: '100%', marginTop: 24, paddingHorizontal: 12 }}>
          <DetailRow
            label={t('det.category')}
            value={category ? categoryDisplayName(category, lang) : t('common.unknown')}
          />
          <DetailRow separator label={t('det.titleRow')} value={transaction.title || '—'} />
          <DetailRow separator label={t('det.note')} value={transaction.note || '—'} />
          <DetailRow separator label={t('det.dateTime')} value={detailDate(transaction)} />
        </View>

        <View style={{ width: '100%', gap: 12, marginTop: 24, paddingHorizontal: 12 }}>
          <Button
            label={t('det.edit')}
            onPress={() => router.push(`/transaction/new?id=${transaction.id}`)}
          />
          <Button
            variant="text"
            label={t('det.delete')}
            onPress={() => setConfirmDelete(true)}
          />
        </View>
      </View>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('det.delTitle')}
        description={t('det.delDesc')}
        cancelLabel={t('det.cancel')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
      />
    </View>
  );
}