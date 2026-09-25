import { NativeBlock } from '@/components/native-block';
import { ConnectedRow, RecentTransactions } from '@/components/recent-transactions';
import { SelectionSheet } from '@/components/selection-sheet';
import { Card, CardHeader, SeeAllAction } from './components/card';
import { CompareBar } from './components/compare-bar';
import { SpendingTrend } from './components/spending-trend';
import { SummaryCard } from './components/summary-card';
import { TrendModeToggle } from './components/trend-mode-toggle';
import { Column, Icon, ListItem, Row, Spacer, Text } from '@expo/ui';
import {
  useAnalytics,
  type AnalyticsComparison,
  type AnalyticsPeriod,
} from '@/hooks/use-analytics';
import { useCategories } from '@/hooks/use-categories';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useTransactions } from '@/hooks/use-transactions';
import { categoryDisplayName, type DictionaryKey } from '@/lib/i18n';
import { CALENDAR_ICON, CHEVRON_DOWN_ICON, EQUAL_ICON, TREND_DOWN_ICON, TREND_UP_ICON } from '@/lib/icons';
import { categoryIcon } from '@/lib/category-icons';
import { formatAmount } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

const RECENT_LIMIT = 5;

const PERIOD_OPTIONS: { value: AnalyticsPeriod; labelKey: DictionaryKey }[] = [
  { value: 'week', labelKey: 'an.week' },
  { value: 'month', labelKey: 'an.month' },
  { value: 'year', labelKey: 'an.year' },
];

export default function AnalyticsScreen() {
  const colors = useTheme();
  const { settings } = useSettings();
  const { t } = useI18n();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [trendMode, setTrendMode] = useState<'expense' | 'income'>('expense');
  const [periodOpen, setPeriodOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AnalyticsContent
        period={period}
        trendMode={trendMode}
        currency={settings.currency}
        startOfWeek={settings.startOfWeek}
        onPeriodOpenChange={setPeriodOpen}
        onTrendModeChange={setTrendMode}
      />
      <SelectionSheet
        open={periodOpen}
        onOpenChange={setPeriodOpen}
        title={t('an.choosePeriod')}
        options={PERIOD_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
        selected={period}
        onSelect={(value) => setPeriod(value)}
      />
    </View>
  );
}

function AnalyticsContent({
  period,
  trendMode,
  currency,
  startOfWeek,
  onPeriodOpenChange,
  onTrendModeChange,
}: {
  period: AnalyticsPeriod;
  trendMode: 'expense' | 'income';
  currency: string;
  startOfWeek: number;
  onPeriodOpenChange: (open: boolean) => void;
  onTrendModeChange: (mode: 'expense' | 'income') => void;
}) {
  const { summary, counts, comparison, categories, trend, loading, refresh } = useAnalytics(
    period,
    startOfWeek
  );
  const colors = useTheme();
  const { t, lang, plural } = useI18n();
  const { categories: allCategories } = useCategories();
  const { transactions: recent, refresh: refreshRecent } = useTransactions({
    limit: RECENT_LIMIT,
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshRecent();
    }, [refresh, refreshRecent])
  );

  const categoryById = useMemo(
    () => new Map(allCategories.map((category) => [category.id, category])),
    [allCategories]
  );

  const periodTitle =
    period === 'week' ? t('an.thisWeek') : period === 'month' ? t('an.thisMonth') : t('an.thisYear');
  const rangeLabel = comparison?.currentRangeLabel ?? '';

  const savedPct = comparison?.saved.pct ?? null;
  const hasHistory =
    comparison != null && (comparison.previous.income !== 0 || comparison.previous.expense !== 0);
  const netUp = (comparison?.saved.diff ?? 0) >= 0;
  const lastKey =
    period === 'week' ? 'an.lastWeek' : period === 'month' ? 'an.lastMonth' : 'an.lastYear';
  const totalTxns = counts.income + counts.expense;
  const netDelta =
    hasHistory && savedPct !== null
      ? `${netUp ? '↑' : '↓'} ${Math.abs(Math.round(savedPct))}% ${t('an.vs', { label: t(lastKey as DictionaryKey) })}`
      : t('an.txnCount', { count: totalTxns, plural: plural(totalTxns) });

  const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);
  const topCategories = categories.slice(0, 4);
  const restAmount = totalExpense - topCategories.reduce((sum, c) => sum + c.amount, 0);
  const legendRows = [
    ...topCategories.map((category) => ({
      key: category.categoryId,
      icon: categoryIcon(category.icon),
      name: categoryDisplayName(
        { name: category.name, slug: category.slug },
        lang
      ),
      amount: formatAmount(category.amount, currency),
      pct: `${category.percentage}%`,
    })),
    ...(restAmount > 0
      ? [
          {
            key: '__others',
            icon: categoryIcon(undefined),
            name: t('an.others'),
            amount: formatAmount(restAmount, currency),
            pct: `${Math.round((restAmount / (totalExpense || 1)) * 100)}%`,
          },
        ]
      : []),
  ];

  const totalFlow = summary.income + summary.expense;
  const incomeFraction = totalFlow > 0 ? summary.income / totalFlow : 0;
  const expenseFraction = totalFlow > 0 ? summary.expense / totalFlow : 0;

  const showLoading =
    loading && summary.income === 0 && summary.expense === 0 && trend.length === 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 8,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <NativeBlock>
            <Text textStyle={{ fontSize: 26, fontWeight: '700', color: colors.text }}>
              {t('tabs.analytics')}
            </Text>
          </NativeBlock>
          <NativeBlock>
            <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
              {t('an.subtitle')}
            </Text>
          </NativeBlock>
        </View>
        <Pressable onPress={() => onPeriodOpenChange(true)} hitSlop={8}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.secondaryContainer,
              borderRadius: 999,
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <NativeBlock>
              <Icon name={CALENDAR_ICON} size={16} color={colors.onSecondaryContainer} />
            </NativeBlock>
            <NativeBlock>
              <Text
                textStyle={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.onSecondaryContainer,
                }}
              >
                {periodTitle}
              </Text>
            </NativeBlock>
            <NativeBlock>
              <Icon name={CHEVRON_DOWN_ICON} size={16} color={colors.onSecondaryContainer} />
            </NativeBlock>
          </View>
        </Pressable>
      </View>

      {showLoading ? (
        <View style={{ paddingTop: 48, alignItems: 'center' }}>
          <NativeBlock>
            <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
              {t('common.loading')}
            </Text>
          </NativeBlock>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <SummaryCard
              icon={TREND_UP_ICON}
              tintColor={colors.success}
              label={t('an.totalIncome')}
              amount={formatAmount(summary.income, currency)}
              sub={t('an.txnCount', { count: counts.income, plural: plural(counts.income) })}
            />
            <SummaryCard
              icon={TREND_DOWN_ICON}
              tintColor={colors.destructive}
              label={t('an.totalExpenses')}
              amount={formatAmount(summary.expense, currency)}
              sub={t('an.txnCount', { count: counts.expense, plural: plural(counts.expense) })}
            />
            <SummaryCard
              icon={EQUAL_ICON}
              tintColor={colors.primary}
              label={t('an.netBalance')}
              amount={formatAmount(summary.saved, currency)}
              sub={netDelta}
              subColor={
                hasHistory && savedPct !== null
                  ? netUp
                    ? colors.success
                    : colors.destructive
                  : undefined
              }
            />
          </View>

          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <NativeBlock>
                  <Text textStyle={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
                    {t('an.trendTitle')}
                  </Text>
                </NativeBlock>
                {rangeLabel ? (
                  <NativeBlock>
                    <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>
                      {rangeLabel}
                    </Text>
                  </NativeBlock>
                ) : null}
              </View>
              <TrendModeToggle mode={trendMode} onChange={onTrendModeChange} />
            </View>
            <SpendingTrend
              period={period}
              currency={currency}
              trend={trend}
              loading={loading}
              series={trendMode}
            />
          </Card>

          <View>
            <CardHeader
              title={t('an.byCategoryTitle')}
              subtitle={t('an.byCategorySub')}
              action={<SeeAllAction onPress={() => router.push('/categories')} />}
            />
            {categories.length === 0 ? (
              <NativeBlock>
                <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
                  {t(period === 'week' ? 'an.noCatWeek' : period === 'month' ? 'an.noCatMonth' : 'an.noCatYear')}
                </Text>
              </NativeBlock>
            ) : (
              <View style={{ gap: 2 }}>
                {legendRows.map((row, index) => (
                  <ConnectedRow
                    key={row.key}
                    first={index === 0}
                    last={index === legendRows.length - 1}
                  >
                    <NativeBlock matchContents={false}>
                      <ListItem colors={{ containerColor: colors.surfaceContainer }}>
                        <Row alignment="center" spacing={12}>
                          <Icon name={row.icon} size={18} />
                          <Column spacing={2}>
                            <Text textStyle={{ fontSize: 16, color: colors.text }}>
                              {row.name}
                            </Text>
                            <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>
                              {row.pct}
                            </Text>
                          </Column>
                          <Spacer flexible />
                          <Text textStyle={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                            {row.amount}
                          </Text>
                        </Row>
                      </ListItem>
                    </NativeBlock>
                  </ConnectedRow>
                ))}
              </View>
            )}
          </View>

          <Card>
            <CardHeader title={t('an.compareTitle')} subtitle={rangeLabel || undefined} />
            <View style={{ gap: 14 }}>
              <CompareBar
                label={t('an.income')}
                amount={formatAmount(summary.income, currency)}
                fraction={incomeFraction}
                barColor={colors.success}
              />
              <CompareBar
                label={t('an.expenses')}
                amount={formatAmount(summary.expense, currency)}
                fraction={expenseFraction}
                barColor={colors.destructive}
              />
            </View>
          </Card>

          <RecentTransactions
            title={t('an.recentTitle')}
            subtitle={t('an.recentSub', { count: String(RECENT_LIMIT) })}
            seeAllLabel={t('an.seeAll')}
            transactions={recent}
            categoryById={categoryById}
            currency={currency}
            onSeeAll={() => router.push('/transactions')}
            onTransactionPress={(id) => router.push(`/transaction/${id}`)}
            variant="divided"
          />
        </>
      )}
    </ScrollView>
  );
}

export type { AnalyticsComparison };