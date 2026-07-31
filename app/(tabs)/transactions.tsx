import { FloatingAddButton } from '@/components/floating-add-button';
import { TransactionRow } from '@/components/transaction-row';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { useSettings } from '@/hooks/use-settings';
import { useTransactions, NO_FILTERS } from '@/hooks/use-transactions';
import { formatDateLabel, toDateKey } from '@/lib/dates';
import { router, useFocusEffect } from 'expo-router';
import { ReceiptText } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import type { Transaction } from '@/types';

interface Section {
  key: string;
  title: string;
  data: Transaction[];
}

export default function TransactionsScreen() {
  const { transactions, loading, refresh } = useTransactions(NO_FILTERS);
  const { categories } = useCategories();
  const { settings } = useSettings();

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    for (const transaction of transactions) {
      const key = toDateKey(new Date(transaction.date));
      const group = grouped.get(key) ?? [];
      group.push(transaction);
      grouped.set(key, group);
    }
    return [...grouped.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]): Section => ({ key, title: formatDateLabel(data[0].date), data }));
  }, [transactions]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <View className="bg-background flex-1">
      <View className="px-5 pb-2 pt-4">
        <Text className="text-2xl font-bold">Transactions</Text>
      </View>

      <SectionList<Transaction, Section>
        sections={sections}
        keyExtractor={(item) => item.id}
        className="flex-1"
        contentContainerClassName="pb-28"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text variant="muted" className="bg-background px-5 pb-2 pt-6 text-xs font-semibold uppercase">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="px-5">
            <Pressable onPress={() => router.push(`/transaction/${item.id}`)}>
              <TransactionRow
                transaction={item}
                category={categoryMap.get(item.categoryId)}
                currency={settings.currency}
              />
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View className="bg-border px-5 h-px" />}
        ListEmptyComponent={
          loading ? (
            <Text variant="muted" className="px-5 py-16 text-center">
              Loading…
            </Text>
          ) : (
            <View className="items-center gap-2 px-5 py-16">
              <Icon as={ReceiptText} size={40} className="text-muted-foreground" />
              <Text className="text-base font-semibold">No transactions yet</Text>
              <Text variant="muted" className="text-center">
                Tap the + button to add your first expense or income.
              </Text>
            </View>
          )
        }
      />

      <FloatingAddButton />
    </View>
  );
}
