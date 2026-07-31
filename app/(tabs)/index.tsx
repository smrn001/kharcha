import { FloatingAddButton } from '@/components/floating-add-button';
import { TransactionRow } from '@/components/transaction-row';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { useDashboardSummary } from '@/hooks/use-dashboard';
import { useSettings } from '@/hooks/use-settings';
import { useTransactions } from '@/hooks/use-transactions';
import { type TransactionFilters } from '@/lib/db/transactions';
import { formatAmount } from '@/lib/format';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, ReceiptText } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

const RECENT_FILTERS: TransactionFilters = { limit: 5 };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { summary, refresh: refreshSummary } = useDashboardSummary();
  const { transactions, refresh: refreshTransactions } = useTransactions(RECENT_FILTERS);
  const { categories } = useCategories();
  const { settings } = useSettings();

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  useFocusEffect(
    useCallback(() => {
      refreshSummary();
      refreshTransactions();
    }, [refreshSummary, refreshTransactions])
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="pb-28">
        <View className="px-5 pt-6">
          <Text className="text-2xl font-bold">{greeting()}</Text>
          <Text variant="muted">Here is your spending overview.</Text>
        </View>

        <View className="px-5 pt-5">
          <View className="rounded-xl border-border bg-card p-5">
            <Text variant="muted" className="text-sm">
              Current Balance
            </Text>
            <Text className="mt-1 text-3xl font-bold">
              {formatAmount(summary.balance, settings.currency)}
            </Text>

            <View className="mt-4 flex-row gap-4">
              <View className="flex-1">
                <Text variant="muted" className="text-xs">
                  Income
                </Text>
                <Text className="text-sm font-semibold text-positive">
                  {formatAmount(summary.income, settings.currency)}
                </Text>
              </View>
              <View className="flex-1">
                <Text variant="muted" className="text-xs">
                  Expenses
                </Text>
                <Text className="text-sm font-semibold text-destructive">
                  {formatAmount(summary.expense, settings.currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3 px-5 pt-4">
          <View className="flex-1 rounded-xl border-border bg-card p-3">
            <Text variant="muted" className="text-xs">
              Today
            </Text>
            <Text className="mt-1 text-sm font-semibold">
              {formatAmount(summary.spentToday, settings.currency)}
            </Text>
          </View>
          <View className="flex-1 rounded-xl border-border bg-card p-3">
            <Text variant="muted" className="text-xs">
              This Week
            </Text>
            <Text className="mt-1 text-sm font-semibold">
              {formatAmount(summary.spentWeek, settings.currency)}
            </Text>
          </View>
          <View className="flex-1 rounded-xl border-border bg-card p-3">
            <Text variant="muted" className="text-xs">
              This Month
            </Text>
            <Text className="mt-1 text-sm font-semibold">
              {formatAmount(summary.spentMonth, settings.currency)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between px-5 pt-6">
          <Text className="text-lg font-bold">Recent Transactions</Text>
          <Pressable
            onPress={() => router.push('/transactions')}
            accessibilityRole="link"
            className="flex-row items-center gap-1"
          >
            <Text className="text-primary text-sm font-medium">View All</Text>
            <Icon as={ArrowRight} size={14} className="text-primary" />
          </Pressable>
        </View>

        {transactions.length === 0 ? (
          <View className="items-center gap-2 px-5 py-10">
            <Icon as={ReceiptText} size={40} className="text-muted-foreground" />
            <Text className="text-base font-semibold">No transactions yet</Text>
            <Text variant="muted" className="text-center">
              Tap the + button to add your first expense or income.
            </Text>
          </View>
        ) : (
          <View className="mt-2">
            {transactions.map((transaction) => (
              <Pressable
                key={transaction.id}
                onPress={() => router.push(`/transaction/${transaction.id}`)}
              >
                <View className="px-5">
                  <TransactionRow
                    transaction={transaction}
                    category={categoryMap.get(transaction.categoryId)}
                    currency={settings.currency}
                  />
                </View>
                <View className="bg-border h-px" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingAddButton />
    </View>
  );
}
