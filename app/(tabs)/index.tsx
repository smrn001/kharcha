import { FloatingAddButton } from '@/components/floating-add-button';
import { NativeBlock } from '@/components/native-block';
import { PageHeader } from '@/components/page-header';
import { TransactionRow } from '@/components/transaction-row';
import { Button, Icon, ListItem, Text } from '@expo/ui';
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
import { ScrollView, View } from 'react-native';

const ARROW_RIGHT_ICON = Icon.select({
  ios: 'arrow.right',
  android: import('@expo/material-symbols/arrow_forward.xml'),
});

const RECEIPT_ICON = Icon.select({
  ios: 'receipt',
  android: import('@expo/material-symbols/receipt_long.xml'),
});

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
  const colors = useTheme();
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
    <View style={{ flex: 1 , backgroundColor: colors.background,}}>
      <ScrollView contentContainerStyle={{ paddingBottom: 112 }} contentInsetAdjustmentBehavior="automatic">
        <PageHeader title={t(greetingKey())} subtitle={t('home.subtitle')} />

        <NativeBlock matchContents={false}>
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
        </NativeBlock>

        <NativeBlock matchContents={false} style={{ marginTop: 8 }}>
          <ListItem
            children={t('home.today')}
            trailing={
              <Text textStyle={{ fontSize: 15, fontWeight: '600' }}>
                {formatAmount(summary.spentToday, settings.currency)}
              </Text>
            }
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('home.week')}
            trailing={
              <Text textStyle={{ fontSize: 15, fontWeight: '600' }}>
                {formatAmount(summary.spentWeek, settings.currency)}
              </Text>
            }
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('home.month')}
            trailing={
              <Text textStyle={{ fontSize: 15, fontWeight: '600' }}>
                {formatAmount(summary.spentMonth, settings.currency)}
              </Text>
            }
          />
        </NativeBlock>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 4,
          }}
        >
          <NativeBlock>
            <Text textStyle={{ fontSize: 17, fontWeight: 'bold' }}>{t('home.recent')}</Text>
          </NativeBlock>
          <NativeBlock>
            <Button
              variant="text"
              onPress={() => router.push('/transactions')}
              style={{ paddingVertical: 0 }}
            >
              <Text textStyle={{ fontSize: 14, fontWeight: '500' }}>{t('home.viewAll')}</Text>
              <Icon name={ARROW_RIGHT_ICON} size={14} />
            </Button>
          </NativeBlock>
        </View>

        {transactions.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 40 }}>
            <NativeBlock>
              <Icon name={RECEIPT_ICON} size={40} color={colors.textSecondary} />
            </NativeBlock>
            <NativeBlock>
              <Text textStyle={{ fontSize: 16, fontWeight: '600' }}>{t('home.emptyTitle')}</Text>
            </NativeBlock>
            <NativeBlock>
              <Text textStyle={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                {t('home.emptyMsg')}
              </Text>
            </NativeBlock>
          </View>
        ) : (
          <View>
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                category={
                  transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined
                }
                currency={settings.currency}
                onPress={() => router.push(`/transaction/${transaction.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingAddButton />
    </View>
  );
}