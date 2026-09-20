import { LoadingView } from '@/components/loading-view';
import { NativeBlock } from '@/components/native-block';
import { PageHeader } from '@/components/page-header';
import { SectionLabel } from '@/components/section-label';
import { ComparisonCard } from './components/comparison-card';
import { MoversCard } from './components/movers-card';
import { SpendingTrend } from './components/spending-trend';
import { CategoryBreakdown } from './components/category-breakdown';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { ListItem, Text } from '@expo/ui';
import {
  useAnalytics,
  type AnalyticsComparison,
  type AnalyticsPeriod,
} from '@/hooks/use-analytics';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useTheme } from '@/lib/theme';
import { formatAmount } from '@/lib/format';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; labelKey: 'an.week' | 'an.month' | 'an.year' }[] = [
  { value: 'week', labelKey: 'an.week' },
  { value: 'month', labelKey: 'an.month' },
  { value: 'year', labelKey: 'an.year' },
];

export default function AnalyticsScreen() {
  const colors = useTheme();
  const { settings } = useSettings();
  const { t } = useI18n();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PageHeader title={t('tabs.analytics')} />
      <AnalyticsContent
        period={period}
        setPeriod={setPeriod}
        currency={settings.currency}
        startOfWeek={settings.startOfWeek}
      />
    </View>
  );
}

function AnalyticsContent({
  period,
  setPeriod,
  currency,
  startOfWeek,
}: {
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
  currency: string;
  startOfWeek: number;
}) {
  const { summary, comparison, movers, categories, trend, loading, refresh } = useAnalytics(
    period,
    startOfWeek
  );
  const colors = useTheme();
  const { t } = useI18n();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const saved = summary.income - summary.expense;
  const overspent = saved < 0;
  const savedColor = overspent ? colors.destructive : saved > 0 ? colors.success : undefined;
  const periodKey =
    period === 'week' ? 'an.thisWeek' : period === 'month' ? 'an.thisMonth' : 'an.thisYear';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <SegmentedControl
          values={PERIOD_OPTIONS.map((o) => t(o.labelKey))}
          selectedIndex={PERIOD_OPTIONS.findIndex((o) => o.value === period)}
          onValueChange={(label) => {
            const next = PERIOD_OPTIONS.find((o) => t(o.labelKey) === label)?.value;
            if (next) setPeriod(next);
          }}
        />
      </View>

      {loading && summary.income === 0 && summary.expense === 0 ? (
        <View style={{ paddingTop: 24 }}>
          <LoadingView label={t('common.loading')} />
        </View>
      ) : (
        <>
          <SectionLabel>{t(periodKey)}</SectionLabel>
          <View>
            <NativeBlock matchContents={false}>
              <ListItem
                children={t('an.income')}
                supportingText={comparison?.currentRangeLabel}
                trailing={
                  <Text textStyle={{ fontSize: 16, fontWeight: '600', color: colors.success }}>
                    {formatAmount(summary.income, currency)}
                  </Text>
                }
              />
            </NativeBlock>
            <NativeBlock matchContents={false}>
              <ListItem
                children={t('an.expenses')}
                supportingText={comparison?.currentRangeLabel}
                trailing={
                  <Text textStyle={{ fontSize: 16, fontWeight: '600', color: colors.destructive }}>
                    {formatAmount(summary.expense, currency)}
                  </Text>
                }
              />
            </NativeBlock>
            <NativeBlock matchContents={false}>
              <ListItem
                children={overspent ? t('an.overspent') : t('an.saved')}
                trailing={
                  <Text textStyle={{ fontSize: 16, fontWeight: '600', color: savedColor }}>
                    {formatAmount(Math.abs(saved), currency)}
                  </Text>
                }
              />
            </NativeBlock>
          </View>
        </>
      )}

      {comparison ? (
        <>
          <SectionLabel>{t('an.vs', { label: t(periodKey) })}</SectionLabel>
          <ComparisonCard period={period} currency={currency} comparison={comparison} />
        </>
      ) : null}

      <SectionLabel>{t('an.incomeVsSpending')}</SectionLabel>
      <View style={{ paddingHorizontal: 20 }}>
        <SpendingTrend period={period} currency={currency} trend={trend} loading={loading} />
      </View>

      <SectionLabel>{t('an.biggestChanges')}</SectionLabel>
      <MoversCard currency={currency} movers={movers} loading={loading} />

      <SectionLabel>{t('an.byCategory')}</SectionLabel>
      <CategoryBreakdown period={period} currency={currency} categories={categories} loading={loading} />
    </ScrollView>
  );
}

export type { AnalyticsComparison };