import { BarChart, type BarChartSeries } from '@/components/bar-chart';
import { NativeBlock } from '@/components/native-block';
import { Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { formatAmountCompact } from '@/lib/format';
import type { AnalyticsPeriod, TrendPoint } from '@/lib/analytics';

export function SpendingTrend({
  period,
  currency,
  trend,
  loading,
  series,
}: {
  period: AnalyticsPeriod;
  currency: string;
  trend: TrendPoint[];
  loading: boolean;
  series: BarChartSeries;
}) {
  const { t } = useI18n();
  const colors = useTheme();

  // NOTE: Texts are Host-bridged because this renders in plain RN layout
  // (analytics cards), not inside a FieldGroup section.
  if (loading && trend.length === 0) {
    return (
      <NativeBlock>
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
          {t('common.loading')}
        </Text>
      </NativeBlock>
    );
  }
  if (trend.every((point) => point.income === 0 && point.expense === 0)) {
    return (
      <NativeBlock>
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
          {t(period === 'week' ? 'an.noTrendWeek' : period === 'month' ? 'an.noTrendMonth' : 'an.noTrendYear')}
        </Text>
      </NativeBlock>
    );
  }

  return (
    <BarChart
      data={trend}
      series={series}
      formatValue={(value) => formatAmountCompact(value, currency)}
    />
  );
}
