import { FloatingAddButton } from '@/components/floating-add-button';
import { FieldRow } from '@/components/field-row';
import { PageHeader } from '@/components/page-header';
import { TransactionFieldRow } from '@/components/transaction-row';
import { Column, FieldGroup, Host, ListItem, Text } from '@expo/ui';
import { useCategories } from '@/hooks/use-categories';
import { useDashboardSummary } from '@/hooks/use-dashboard';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useTransactions } from '@/hooks/use-transactions';
import { useTheme } from '@/lib/theme';
import { type TransactionFilters } from '@/lib/db/transactions';
import { formatAmount } from '@/lib/format';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View, useColorScheme } from 'react-native';

const RECENT_FILTERS: TransactionFilters = { limit: 5 };

function greetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 17) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

// NOTE: rows must stay DIRECT children of their FieldGroup.Section (fragments
// are fine — the section flattens those). An intermediate custom component
// would collapse the group into a single ListItem on Android. The FieldGroup
// itself is the screen's scroller, so no RN ScrollView may wrap it.
export default function HomeScreen() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const colors = useTheme();
  const scheme = useColorScheme();
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

  const overspend = summary.expense > summary.income;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PageHeader title={t(greetingKey())} subtitle={t('home.subtitle')} />

      <Host style={{ flex: 1 }} colorScheme={scheme ?? undefined}>
        <FieldGroup>
          <FieldGroup.Section>
            <ListItem
              children={t('home.balance')}
              supportingText={`${t('home.income')} ${formatAmount(summary.income, settings.currency)} · ${t('home.expenses')} ${formatAmount(summary.expense, settings.currency)}`}
              trailing={
                <Text
                  textStyle={{
                    fontSize: 22,
                    fontWeight: 'bold',
                    color: overspend ? colors.destructive : colors.success,
                  }}
                >
                  {formatAmount(summary.balance, settings.currency)}
                </Text>
              }
            />
          </FieldGroup.Section>

          <FieldGroup.Section>
            <ListItem
              children={t('home.today')}
              trailing={
                <Text textStyle={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                  {formatAmount(summary.spentToday, settings.currency)}
                </Text>
              }
            />
            <ListItem
              children={t('home.week')}
              trailing={
                <Text textStyle={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                  {formatAmount(summary.spentWeek, settings.currency)}
                </Text>
              }
            />
            <ListItem
              children={t('home.month')}
              trailing={
                <Text textStyle={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                  {formatAmount(summary.spentMonth, settings.currency)}
                </Text>
              }
            />
          </FieldGroup.Section>

          <FieldGroup.Section title={t('home.recent')}>
            {transactions.length === 0 ? (
              <Column spacing={4}>
                <Text
                  textStyle={{ fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' }}
                >
                  {t('home.emptyTitle')}
                </Text>
                <Text
                  textStyle={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}
                >
                  {t('home.emptyMsg')}
                </Text>
              </Column>
            ) : (
              <>
                {transactions.map((transaction) => (
                  <TransactionFieldRow
                    key={transaction.id}
                    transaction={transaction}
                    category={
                      transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined
                    }
                    currency={settings.currency}
                    onPress={() => router.push(`/transaction/${transaction.id}`)}
                  />
                ))}
                <FieldRow
                  label={t('home.viewAll')}
                  onPress={() => router.push('/transactions')}
                />
              </>
            )}
          </FieldGroup.Section>
        </FieldGroup>
      </Host>

      <FloatingAddButton />
    </View>
  );
}