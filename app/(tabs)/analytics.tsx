import { BarChart } from '@/components/bar-chart';
import { PageHeader } from '@/components/page-header';
import { SegmentedControl } from '@/components/segmented-control';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  previousPeriodLabel,
  useAnalytics,
  type AnalyticsComparison,
  type AnalyticsPeriod,
  type CategoryMover,
} from '@/hooks/use-analytics';
import { useSettings } from '@/hooks/use-settings';
import { categoryIcon } from '@/lib/category-icons';
import { formatAmount, formatAmountCompact } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useFocusEffect } from 'expo-router';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const PERIOD_TITLES: Record<AnalyticsPeriod, string> = {
  week: 'This week',
  month: 'This month',
  year: 'This year',
};

export default function AnalyticsScreen() {
  const { settings } = useSettings();

  return (
    <View className="bg-background flex-1">
      <PageHeader title="Analytics" />
      <AnalyticsContent currency={settings.currency} startOfWeek={settings.startOfWeek} />
    </View>
  );
}

function AnalyticsContent({ currency, startOfWeek }: { currency: string; startOfWeek: number }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
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
  if (loading && summary.income === 0 && summary.expense === 0) {
    return (
      <View className="border-border rounded-xl border bg-card p-5">
        <Text variant="muted">Loading…</Text>
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
          {PERIOD_TITLES[period]}
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
            Income
          </Text>
          <Text className="text-positive mt-1 text-lg font-semibold">
            {formatAmount(summary.income, currency)}
          </Text>
        </View>
        <View>
          <Text variant="muted" className="text-right text-xs">
            Expenses
          </Text>
          <Text className="text-destructive mt-1 text-right text-lg font-semibold">
            {formatAmount(summary.expense, currency)}
          </Text>
        </View>
      </View>

      <View className="bg-border my-4 h-px" />

      <View className="flex-row items-center justify-between">
        <Text variant="muted" className="text-xs">
          {overspent ? 'Overspent' : 'Saved'}
        </Text>
        <Text className={cn('text-base font-semibold', savedColor)}>
          {formatAmount(overspent ? Math.abs(summary.saved) : summary.saved, currency)}
        </Text>
      </View>
    </View>
  );
}

function buildInsight(
  period: AnalyticsPeriod,
  comparison: AnalyticsComparison,
  currency: string
): string {
  const unit = previousPeriodLabel(period).toLowerCase();
  const prev = comparison.previous;

  if (prev.income === 0 && prev.expense === 0) {
    return 'No data from ' + unit + ' to compare yet.';
  }

  const parts: string[] = [];
  if (comparison.expense.diff !== 0 && comparison.expense.pct !== null) {
    const direction = comparison.expense.diff < 0 ? 'less' : 'more';
    parts.push(
      `You spent ${Math.abs(Math.round(comparison.expense.pct))}% ${direction} than ${unit} (${formatAmount(Math.abs(comparison.expense.diff), currency)} ${comparison.expense.diff < 0 ? 'less' : 'more'}).`
    );
  } else if (comparison.expense.diff !== 0) {
    parts.push(
      `Spending is new this period (${formatAmount(Math.abs(comparison.expense.diff), currency)}).`
    );
  }

  if (comparison.saved.diff !== 0) {
    parts.push(
      comparison.saved.diff > 0
        ? `You kept ${formatAmount(comparison.saved.diff, currency)} more.`
        : `You kept ${formatAmount(Math.abs(comparison.saved.diff), currency)} less.`
    );
  }

  return parts.length > 0 ? parts.join(' ') : `Same as ${unit}.`;
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
  if (loading && !comparison) {
    return (
      <View className="border-border rounded-xl border bg-card p-5">
        <Text variant="muted">Loading…</Text>
      </View>
    );
  }
  if (!comparison) return null;

  const hasHistory =
    comparison.previous.income !== 0 || comparison.previous.expense !== 0;
  if (!hasHistory) {
    return (
      <View className="border-border rounded-xl border bg-card p-5">
        <Text className="text-base font-semibold">vs {comparison.previousLabel}</Text>
        <Text variant="muted" className="mt-2 text-sm">
          {buildInsight(period, comparison, currency)}
        </Text>
      </View>
    );
  }

  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-base font-semibold">vs {comparison.previousLabel}</Text>
        <Text variant="muted" className="text-xs">
          {comparison.previousRangeLabel}
        </Text>
      </View>

      <Text className="mt-2 text-sm">{buildInsight(period, comparison, currency)}</Text>

      <View className="mt-4 gap-4">
        <ComparisonRow
          label="Spending"
          current={comparison.previous.expense + comparison.expense.diff}
          previous={comparison.previous.expense}
          delta={comparison.expense}
          goodWhenDown
          currency={currency}
        />
        <ComparisonRow
          label="Income"
          current={comparison.previous.income + comparison.income.diff}
          previous={comparison.previous.income}
          delta={comparison.income}
          goodWhenDown={false}
          currency={currency}
        />
        <ComparisonRow
          label={comparison.previous.saved + comparison.saved.diff < 0 ? 'Overspent' : 'Saved'}
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
  const up = delta.diff > 0;
  const flat = delta.diff === 0;
  const good = flat ? null : goodWhenDown ? !up : up;

  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1">
        <Text className="text-sm font-medium">{label}</Text>
        <Text variant="muted" className="mt-0.5 text-xs">
          {formatAmount(current, currency)} · was {formatAmount(previous, currency)}
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
  const visible = movers.filter((mover) => mover.diff !== 0);
  if (loading && movers.length === 0) return null;
  if (visible.length === 0) return null;

  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <Text className="text-base font-semibold">Biggest changes</Text>
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
                  {mover.name}
                </Text>
                <Text variant="muted" className="text-xs">
                  was {formatAmount(mover.previous, currency)}
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
  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold">Income vs Spending</Text>
        <Text variant="muted" className="text-xs">
          {PERIOD_TITLES[period]}
        </Text>
      </View>

      {loading && trend.length === 0 ? (
        <Text variant="muted" className="mt-4">
          Loading…
        </Text>
      ) : trend.every((point) => point.income === 0 && point.expense === 0) ? (
        <Text variant="muted" className="mt-4">
          No transactions recorded{' '}
          {period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this year'}.
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
  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <Text className="text-base font-semibold">By category</Text>

      {loading && categories.length === 0 ? (
        <Text variant="muted" className="mt-4">
          Loading…
        </Text>
      ) : categories.length === 0 ? (
        <Text variant="muted" className="mt-4">
          No expenses recorded{' '}
          {period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this year'}.
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
                    {category.name}
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
