import { FloatingAddButton } from '@/components/floating-add-button';
import { NativeBlock } from '@/components/native-block';
import { PageHeader } from '@/components/page-header';
import { RecentTransactions } from '@/components/recent-transactions';
import { Text } from '@expo/ui';
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
import { StyleSheet, View } from 'react-native';

const RECENT_FILTERS: TransactionFilters = { limit: 5 };

function greetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 17) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

function SpendingRow({
  label,
  amount,
  showDivider,
}: {
  label: string;
  amount: string;
  showDivider: boolean;
}) {
  const colors = useTheme();
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
        }}
      >
        <NativeBlock>
          <Text textStyle={{ fontSize: 15, color: colors.text }}>{label}</Text>
        </NativeBlock>
        <NativeBlock>
          <Text textStyle={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
            {amount}
          </Text>
        </NativeBlock>
      </View>
      {showDivider ? (
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
      ) : null}
    </View>
  );
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PageHeader title={t(greetingKey())} subtitle={t('home.subtitle')} />

      {/* Hero: balance, no container — whitespace carries the hierarchy. */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
        <NativeBlock>
          <Text textStyle={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary }}>
            {t('home.balance')}
          </Text>
        </NativeBlock>
        <NativeBlock>
          <Text
            textStyle={{
              fontSize: 40,
              fontWeight: 'bold',
              color: overspend ? colors.destructive : colors.text,
            }}
          >
            {formatAmount(summary.balance, settings.currency)}
          </Text>
        </NativeBlock>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <NativeBlock>
              <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
                {t('home.income')}
              </Text>
            </NativeBlock>
            <NativeBlock>
              <Text textStyle={{ fontSize: 14, fontWeight: '600', color: colors.success }}>
                {formatAmount(summary.income, settings.currency)}
              </Text>
            </NativeBlock>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <NativeBlock>
              <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
                {t('home.expenses')}
              </Text>
            </NativeBlock>
            <NativeBlock>
              <Text textStyle={{ fontSize: 14, fontWeight: '600', color: colors.destructive }}>
                {formatAmount(summary.expense, settings.currency)}
              </Text>
            </NativeBlock>
          </View>
        </View>
      </View>

      {/* One compact spending container instead of three cards. */}
      <View style={{ paddingHorizontal: 20 }}>
        <View
          style={{
            backgroundColor: colors.surfaceContainer,
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 6,
          }}
        >
          <SpendingRow
            label={t('home.today')}
            amount={formatAmount(summary.spentToday, settings.currency)}
            showDivider
          />
          <SpendingRow
            label={t('home.week')}
            amount={formatAmount(summary.spentWeek, settings.currency)}
            showDivider
          />
          <SpendingRow
            label={t('home.month')}
            amount={formatAmount(summary.spentMonth, settings.currency)}
            showDivider={false}
          />
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: 24 }}>
        <RecentTransactions
          title={t('home.recent')}
          seeAllLabel={t('home.viewAll')}
          transactions={transactions}
          categoryById={categoryMap}
          currency={settings.currency}
          onSeeAll={() => router.push('/transactions')}
          onTransactionPress={(id) => router.push(`/transaction/${id}`)}
          variant="grouped"
          headerPaddingHorizontal={20}
        />
      </View>

      <FloatingAddButton />
    </View>
  );
}