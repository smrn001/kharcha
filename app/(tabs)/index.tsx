import { FloatingAddButton } from '@/components/floating-add-button';
import { PageHeader } from '@/components/page-header';
import { TransactionRow } from '@/components/transaction-row';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { useDashboardSummary } from '@/hooks/use-dashboard';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useTransactions } from '@/hooks/use-transactions';
import { type TransactionFilters } from '@/lib/db/transactions';
import { formatAmount } from '@/lib/format';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, ReceiptText } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

const RECENT_FILTERS: TransactionFilters = { limit: 5 };

function greetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 17) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

export default function HomeScreen() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const { summary, refresh: refreshSummary } = useDashboardSummary(settings.startOfWeek);
  const { transactions, refresh: refreshTransactions } = useTransactions(RECENT_FILTERS);
  const { categories } = useCategories();

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
        <PageHeader title={t(greetingKey())} subtitle={t('home.subtitle')} />

        <View className="px-5 pt-5">
          <View className="rounded-xl border border-border bg-card p-5">
            <Text variant="muted" className="text-sm">
              {t('home.balance')}
            </Text>
            <Text className="mt-1 text-3xl font-bold">
              {formatAmount(summary.balance, settings.currency)}
            </Text>

            <View className="mt-4 flex-row gap-4">
              <View className="flex-1">
                <Text variant="muted" className="text-xs">
                  {t('home.income')}
                </Text>
                <Text className="text-sm font-semibold text-positive">
                  {formatAmount(summary.income, settings.currency)}
                </Text>
              </View>
              <View className="flex-1">
                <Text variant="muted" className="text-xs">
                  {t('home.expenses')}
                </Text>
                <Text className="text-sm font-semibold text-destructive">
                  {formatAmount(summary.expense, settings.currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3 px-5 pt-4">
          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <Text variant="muted" className="text-xs">
              {t('home.today')}
            </Text>
            <Text className="mt-1 text-sm font-semibold">
              {formatAmount(summary.spentToday, settings.currency)}
            </Text>
          </View>
          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <Text variant="muted" className="text-xs">
              {t('home.week')}
            </Text>
            <Text className="mt-1 text-sm font-semibold">
              {formatAmount(summary.spentWeek, settings.currency)}
            </Text>
          </View>
          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <Text variant="muted" className="text-xs">
              {t('home.month')}
            </Text>
            <Text className="mt-1 text-sm font-semibold">
              {formatAmount(summary.spentMonth, settings.currency)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between px-5 pt-6">
          <Text className="text-lg font-bold">{t('home.recent')}</Text>
          <Pressable
            onPress={() => router.push('/transactions')}
            accessibilityRole="link"
            className="flex-row items-center gap-1"
          >
            <Text className="text-primary text-sm font-medium">{t('home.viewAll')}</Text>
            <Icon as={ArrowRight} size={14} className="text-primary" />
          </Pressable>
        </View>

        {transactions.length === 0 ? (
          <View className="items-center gap-2 px-5 py-10">
            <Icon as={ReceiptText} size={40} className="text-muted-foreground" />
            <Text className="text-base font-semibold">{t('home.emptyTitle')}</Text>
            <Text variant="muted" className="text-center">
              {t('home.emptyMsg')}
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
                    category={
                      transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined
                    }
                    currency={settings.currency}
                  />
                </View>
                <View className="bg-border mx-5 h-px" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingAddButton />
    </View>
  );
}
