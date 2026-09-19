import { BarChart } from '@/components/bar-chart';
import { PageHeader } from '@/components/page-header';
import { SegmentedControl } from '@/components/segmented-control';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  useAnalytics,
  type AnalyticsComparison,
  type AnalyticsPeriod,
  type CategoryMover,
} from '@/hooks/use-analytics';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { categoryDisplayName, type DictionaryKey } from '@/lib/i18n';
import { categoryIcon } from '@/lib/category-icons';
import { formatAmount, formatAmountCompact } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useFocusEffect } from 'expo-router';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

function usePeriodOptions(): {
  options: { value: AnalyticsPeriod; label: string }[];
  titles: Record<AnalyticsPeriod, string>;
} {
  const { t } = useI18n();
  return {
    options: [
      { value: 'week', label: t('an.week') },
      { value: 'month', label: t('an.month') },
      { value: 'year', label: t('an.year') },
    ],
    titles: {
      week: t('an.thisWeek'),
      month: t('an.thisMonth'),
      year: t('an.thisYear'),
    },
  };
}

export default function AnalyticsScreen() {
  const { settings } = useSettings();
  const { t } = useI18n();

  return (
    <View className="bg-background flex-1">
      <PageHeader title={t('tabs.analytics')} />
      <AnalyticsContent currency={settings.currency} startOfWeek={settings.startOfWeek} />
    </View>
  );
}

function AnalyticsContent({ currency, startOfWeek }: { currency: string; startOfWeek: number }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const { options: PERIOD_OPTIONS } = usePeriodOptions();
  const { summary, comparison, movers, categories, trend, loading, refresh } = useAnalytics(
    period,
    startOfWeek
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-5 px-5 pb-28"
      showsVerticalScrollIndicator={false}
    >
      <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />

      <PeriodCards
        period={period}
        currency={currency}
        summary={summary}
        currentRangeLabel={comparison?.currentRangeLabel}
        loading={loading}
      />

      <ComparisonCard period={period} currency={currency} comparison={comparison} loading={loading} />

      <SpendingTrend
        period={period}
        currency={currency}
        trend={trend}
        loading={loading}
      />

      <MoversCard currency={currency} movers={movers} loading={loading} />

      <CategoryBreakdown
        period={period}
        currency={currency}
        categories={categories}
        loading={loading}
      />
    </ScrollView>
  );
}

function PeriodCards({
  period,
  currency,
  summary,
  currentRangeLabel,
  loading,
}: {
  period: AnalyticsPeriod;
  currency: string;
  summary: ReturnType<typeof useAnalytics>['summary'];
  currentRangeLabel: string | undefined;
  loading: boolean;
}) {
  const { t: tcards } = useI18n();
  const { titles: cardTitles } = usePeriodOptions();
  if (loading && summary.income === 0 && summary.expense === 0) {
    return (
      <View className="border-border rounded-xl border bg-card p-5">
        <Text variant="muted">{tcards('common.loading')}</Text>
      </View>
    );
  }

  const overspent = summary.saved < 0;
  const savedColor = overspent
    ? 'text-destructive'
    : summary.saved > 0
      ? 'text-positive'
      : 'text-foreground';

  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <View className="flex-row items-baseline justify-between">
        <Text variant="muted" className="text-xs font-semibold uppercase">
          {cardTitles[period]}
        </Text>
        {currentRangeLabel ? (
          <Text variant="muted" className="text-xs">
            {currentRangeLabel}
          </Text>
        ) : null}
      </View>

      <View className="mt-4 flex-row justify-between">
        <View>
          <Text variant="muted" className="text-xs">
            {tcards('an.income')}
          </Text>
          <Text className="text-positive mt-1 text-lg font-semibold">
            {formatAmount(summary.income, currency)}
          </Text>
        </View>
        <View>
          <Text variant="muted" className="text-right text-xs">
            {tcards('an.expenses')}
          </Text>
          <Text className="text-destructive mt-1 text-right text-lg font-semibold">
            {formatAmount(summary.expense, currency)}
          </Text>
        </View>
      </View>

      <View className="bg-border my-4 h-px" />

      <View className="flex-row items-center justify-between">
        <Text variant="muted" className="text-xs">
          {overspent ? tcards('an.overspent') : tcards('an.saved')}
        </Text>
        <Text className={cn('text-base font-semibold', savedColor)}>
          {formatAmount(overspent ? Math.abs(summary.saved) : summary.saved, currency)}
        </Text>
      </View>
    </View>
  );
}

type TFn = (key: DictionaryKey, params?: Record<string, string | number>) => string;

const UNIT_KEYS: Record<AnalyticsPeriod, DictionaryKey> = {
  week: 'an.lastWeek',
  month: 'an.lastMonth',
  year: 'an.lastYear',
};

const PREV_KEYS: Record<AnalyticsPeriod, DictionaryKey> = {
  week: 'an.prevWeek',
  month: 'an.prevMonth',
  year: 'an.prevYear',
};

function buildInsight(
  t: TFn,
  period: AnalyticsPeriod,
  comparison: AnalyticsComparison,
  currency: string
): string {
  const unit = t(UNIT_KEYS[period]);
  const prev = comparison.previous;

  if (prev.income === 0 && prev.expense === 0) {
    return t('an.insightNoData', { unit });
  }

  const parts: string[] = [];
  if (comparison.expense.diff !== 0 && comparison.expense.pct !== null) {
    const less = comparison.expense.diff < 0;
    parts.push(
      t('an.insightSpent', {
        pct: Math.abs(Math.round(comparison.expense.pct)),
        direction: t(less ? 'an.less' : 'an.more'),
        unit,
        amount: formatAmount(Math.abs(comparison.expense.diff), currency),
        moreLess: t(less ? 'an.less' : 'an.more'),
      })
    );
  } else if (comparison.expense.diff !== 0) {
    parts.push(
      t('an.insightNew', {
        amount: formatAmount(Math.abs(comparison.expense.diff), currency),
      })
    );
  }

  if (comparison.saved.diff !== 0) {
    parts.push(
      t(comparison.saved.diff > 0 ? 'an.insightKeptMore' : 'an.insightKeptLess', {
        amount: formatAmount(Math.abs(comparison.saved.diff), currency),
      })
    );
  }

  return parts.length > 0 ? parts.join(' ') : t('an.insightSame', { unit });
}

function ComparisonCard({
  period,
  currency,
  comparison,
  loading,
}: {
  period: AnalyticsPeriod;
  currency: string;
  comparison: AnalyticsComparison | null;
  loading: boolean;
}) {
  const { t } = useI18n();
  if (loading && !comparison) {
    return (
      <View className="border-border rounded-xl border bg-card p-5">
        <Text variant="muted">{t('common.loading')}</Text>
      </View>
    );
  }
  if (!comparison) return null;

  const prevLabel = t(PREV_KEYS[period]);
  const hasHistory =
    comparison.previous.income !== 0 || comparison.previous.expense !== 0;
  if (!hasHistory) {
    return (
      <View className="border-border rounded-xl border bg-card p-5">
        <Text className="text-base font-semibold">{t('an.vs', { label: prevLabel })}</Text>
        <Text variant="muted" className="mt-2 text-sm">
          {buildInsight(t, period, comparison, currency)}
        </Text>
      </View>
    );
  }

  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-base font-semibold">{t('an.vs', { label: prevLabel })}</Text>
        <Text variant="muted" className="text-xs">
          {comparison.previousRangeLabel}
        </Text>
      </View>

      <Text className="mt-2 text-sm">{buildInsight(t, period, comparison, currency)}</Text>

      <View className="mt-4 gap-4">
        <ComparisonRow
          label={t('an.expenses')}
          current={comparison.previous.expense + comparison.expense.diff}
          previous={comparison.previous.expense}
          delta={comparison.expense}
          goodWhenDown
          currency={currency}
        />
        <ComparisonRow
          label={t('an.income')}
          current={comparison.previous.income + comparison.income.diff}
          previous={comparison.previous.income}
          delta={comparison.income}
          goodWhenDown={false}
          currency={currency}
        />
        <ComparisonRow
          label={
            comparison.previous.saved + comparison.saved.diff < 0
              ? t('an.overspent')
              : t('an.saved')
          }
          current={Math.abs(comparison.previous.saved + comparison.saved.diff)}
          previous={Math.abs(comparison.previous.saved)}
          delta={comparison.saved}
          goodWhenDown={false}
          currency={currency}
        />
      </View>
    </View>
  );
}

function ComparisonRow({
  label,
  current,
  previous,
  delta,
  goodWhenDown,
  currency,
}: {
  label: string;
  current: number;
  previous: number;
  delta: AnalyticsComparison['expense'];
  goodWhenDown: boolean;
  currency: string;
}) {
  const { t: trow } = useI18n();
  const up = delta.diff > 0;
  const flat = delta.diff === 0;
  const good = flat ? null : goodWhenDown ? !up : up;

  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1">
        <Text className="text-sm font-medium">{label}</Text>
        <Text variant="muted" className="mt-0.5 text-xs">
          {formatAmount(current, currency)} · {trow('an.was', { amount: formatAmount(previous, currency) })}
        </Text>
      </View>
      <View
        className={cn(
          'flex-row items-center gap-1 rounded-full border px-2.5 py-1',
          flat
            ? 'border-border'
            : good
              ? 'border-positive/30 bg-positive/10'
              : 'border-destructive/30 bg-destructive/10'
        )}
      >
        <Icon
          as={flat ? Minus : up ? TrendingUp : TrendingDown}
          size={12}
          className={flat ? 'text-muted-foreground' : good ? 'text-positive' : 'text-destructive'}
        />
        <Text
          className={cn(
            'text-xs font-semibold',
            flat ? 'text-muted-foreground' : good ? 'text-positive' : 'text-destructive'
          )}
        >
          {flat ? '0%' : delta.pct === null ? 'new' : `${up ? '+' : '−'}${Math.abs(Math.round(delta.pct))}%`}
        </Text>
      </View>
    </View>
  );
}

function MoversCard({
  currency,
  movers,
  loading,
}: {
  currency: string;
  movers: CategoryMover[];
  loading: boolean;
}) {
  const { t: tmovers, lang: mlang } = useI18n();
  const visible = movers.filter((mover) => mover.diff !== 0);
  if (loading && movers.length === 0) return null;
  if (visible.length === 0) return null;

  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <Text className="text-base font-semibold">{tmovers('an.biggestChanges')}</Text>
      <View className="mt-2">
        {visible.map((mover) => {
          const IconComponent = categoryIcon(mover.icon);
          const up = mover.diff > 0;
          return (
            <View
              key={mover.categoryId}
              className="flex-row items-center gap-2 border-b border-border/50 py-3 last:border-b-0"
            >
              <Icon as={IconComponent} size={14} className="text-muted-foreground" />
              <View className="flex-1">
                <Text className="text-sm font-medium" numberOfLines={1}>
                  {categoryDisplayName(mover, mlang)}
                </Text>
                <Text variant="muted" className="text-xs">
                  {tmovers('an.was', { amount: formatAmount(mover.previous, currency) })}
                </Text>
              </View>
              <Text className={cn('text-sm font-semibold', up ? 'text-destructive' : 'text-positive')}>
                {up ? '+' : '−'}
                {formatAmount(Math.abs(mover.diff), currency)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SpendingTrend({
  period,
  currency,
  trend,
  loading,
}: {
  period: AnalyticsPeriod;
  currency: string;
  trend: ReturnType<typeof useAnalytics>['trend'];
  loading: boolean;
}) {
  const { t: ttrend } = useI18n();
  const { titles: trendTitles } = usePeriodOptions();
  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold">{ttrend('an.incomeVsSpending')}</Text>
        <Text variant="muted" className="text-xs">
          {trendTitles[period]}
        </Text>
      </View>

      {loading && trend.length === 0 ? (
        <Text variant="muted" className="mt-4">
          {ttrend('common.loading')}
        </Text>
      ) : trend.every((point) => point.income === 0 && point.expense === 0) ? (
        <Text variant="muted" className="mt-4">
          {ttrend(period === 'week' ? 'an.noTrendWeek' : period === 'month' ? 'an.noTrendMonth' : 'an.noTrendYear')}
        </Text>
      ) : (
        <View className="mt-4">
          <BarChart
            data={trend}
            formatValue={(value) => formatAmountCompact(value, currency)}
          />
        </View>
      )}
    </View>
  );
}

function CategoryBreakdown({
  period,
  currency,
  categories,
  loading,
}: {
  period: AnalyticsPeriod;
  currency: string;
  categories: ReturnType<typeof useAnalytics>['categories'];
  loading: boolean;
}) {
  const { t: tcat, lang: clang } = useI18n();
  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <Text className="text-base font-semibold">{tcat('an.byCategory')}</Text>

      {loading && categories.length === 0 ? (
        <Text variant="muted" className="mt-4">
          {tcat('common.loading')}
        </Text>
      ) : categories.length === 0 ? (
        <Text variant="muted" className="mt-4">
          {tcat(period === 'week' ? 'an.noCatWeek' : period === 'month' ? 'an.noCatMonth' : 'an.noCatYear')}
        </Text>
      ) : (
        <View className="mt-2">
          {categories.map((category) => {
            const IconComponent = categoryIcon(category.icon);
            return (
              <View
                key={category.categoryId}
                className="gap-1.5 border-b border-border/50 py-3 last:border-b-0"
              >
                <View className="flex-row items-center gap-2">
                  <Icon as={IconComponent} size={14} className="text-muted-foreground" />
                  <Text className="flex-1 text-sm font-medium" numberOfLines={1}>
                    {categoryDisplayName(category, clang)}
                  </Text>
                  <Text className="text-sm">{formatAmount(category.amount, currency)}</Text>
                  <Text variant="muted" className="w-10 text-right text-xs">
                    {category.percentage}%
                  </Text>
                </View>
                <View className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <View
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
