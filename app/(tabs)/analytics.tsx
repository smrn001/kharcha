import { BarChart } from '@/components/bar-chart';
import { PageHeader } from '@/components/page-header';
import { SegmentedControl } from '@/components/segmented-control';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAnalytics, type AnalyticsPeriod } from '@/hooks/use-analytics';
import { useSettings } from '@/hooks/use-settings';
import { categoryIcon } from '@/lib/category-icons';
import { formatAmount, formatAmountCompact } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useFocusEffect } from 'expo-router';
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
  const { summary, categories, trend, loading, refresh } = useAnalytics(period, startOfWeek);

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
        loading={loading}
      />

      <SpendingTrend
        period={period}
        currency={currency}
        trend={trend}
        loading={loading}
      />

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
  loading,
}: {
  period: AnalyticsPeriod;
  currency: string;
  summary: ReturnType<typeof useAnalytics>['summary'];
  loading: boolean;
}) {
  if (loading && summary.income === 0 && summary.expense === 0) {
    return (
      <View className="border-border rounded-xl border bg-card p-5">
        <Text variant="muted">Loading…</Text>
      </View>
    );
  }

  const savedColor =
    summary.saved > 0
      ? 'text-positive'
      : summary.saved < 0
        ? 'text-destructive'
        : 'text-foreground';

  return (
    <View className="border-border rounded-xl border bg-card p-5">
      <Text variant="muted" className="text-xs font-semibold uppercase">
        {PERIOD_TITLES[period]}
      </Text>

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
          Saved
        </Text>
        <Text className={cn('text-base font-semibold', savedColor)}>
          {formatAmount(summary.saved, currency)}
        </Text>
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
