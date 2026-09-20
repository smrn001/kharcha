import { LoadingView } from '@/components/loading-view';
import { PageHeader } from '@/components/page-header';
import { ComparisonRow, comparisonInsight, unitLabelKey } from './components/comparison-rows';
import { MoverRow } from './components/mover-row';
import { SpendingTrend } from './components/spending-trend';
import { CategoryBreakdownRow } from './components/category-breakdown-row';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Column, FieldGroup, Host, ListItem, Text } from '@expo/ui';
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
import { View, useColorScheme } from 'react-native';

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
      <AnalyticsContent
        period={period}
        currency={settings.currency}
        startOfWeek={settings.startOfWeek}
      />
    </View>
  );
}

// NOTE: rows live in each Section's FOOTER slot, not as direct row children.
// Reason: on Android the library wraps every direct row in a Material ListItem
// tinted surfaceContainer, and that tint has no opt-out. The footer slot
// renders as a plain unstyled column, so rows sit flat on the group
// background. If a future @expo/ui version styles footers, move the rows back
// to direct Section children (and accept the tinted cards).
function AnalyticsContent({
  period,
  currency,
  startOfWeek,
}: {
  period: AnalyticsPeriod;
  currency: string;
  startOfWeek: number;
}) {
  const { summary, comparison, movers, categories, trend, loading, refresh } = useAnalytics(
    period,
    startOfWeek
  );
  const colors = useTheme();
  const scheme = useColorScheme();
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
  const visibleMovers = movers.filter((mover) => mover.diff !== 0);
  const hasHistory =
    comparison != null &&
    (comparison.previous.income !== 0 || comparison.previous.expense !== 0);
  const prevLabel = t(unitLabelKey(period));
  const insight = comparison ? comparisonInsight(t, period, comparison, currency) : '';

  return (
    <Host style={{ flex: 1 }} colorScheme={scheme ?? undefined}>
      <FieldGroup>
        <FieldGroup.Section title={t(periodKey)}>
          <FieldGroup.SectionFooter>
            <Column spacing={0}>
              {loading && summary.income === 0 && summary.expense === 0 ? (
                <LoadingView label={t('common.loading')} />
              ) : (
                <>
                  <ListItem
                    children={t('an.income')}
                    supportingText={comparison?.currentRangeLabel}
                    trailing={
                      <Text textStyle={{ fontSize: 16, fontWeight: '600', color: colors.success }}>
                        {formatAmount(summary.income, currency)}
                      </Text>
                    }
                  />
                  <ListItem
                    children={t('an.expenses')}
                    supportingText={comparison?.currentRangeLabel}
                    trailing={
                      <Text textStyle={{ fontSize: 16, fontWeight: '600', color: colors.destructive }}>
                        {formatAmount(summary.expense, currency)}
                      </Text>
                    }
                  />
                  <ListItem
                    children={overspent ? t('an.overspent') : t('an.saved')}
                    trailing={
                      <Text textStyle={{ fontSize: 16, fontWeight: '600', color: savedColor }}>
                        {formatAmount(Math.abs(saved), currency)}
                      </Text>
                    }
                  />
                </>
              )}
            </Column>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        {comparison ? (
          <FieldGroup.Section title={t('an.vs', { label: t(periodKey) })}>
            <FieldGroup.SectionFooter>
              <Column spacing={0}>
                <ListItem
                  children={t('an.vs', { label: prevLabel })}
                  supportingText={hasHistory ? insight : undefined}
                />
                {hasHistory ? (
                  <>
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
                  </>
                ) : null}
              </Column>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        ) : null}

        <FieldGroup.Section title={t('an.incomeVsSpending')}>
          <FieldGroup.SectionFooter>
            <SpendingTrend period={period} currency={currency} trend={trend} loading={loading} />
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title={t('an.biggestChanges')}>
          <FieldGroup.SectionFooter>
            <Column spacing={0}>
              {loading && movers.length === 0
                ? null
                : visibleMovers.map((mover) => (
                    <MoverRow key={mover.categoryId} currency={currency} mover={mover} />
                  ))}
            </Column>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title={t('an.byCategory')}>
          <FieldGroup.SectionFooter>
            <Column spacing={0}>
              {loading && categories.length === 0 ? (
                <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
                  {t('common.loading')}
                </Text>
              ) : categories.length === 0 ? (
                <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
                  {t(period === 'week' ? 'an.noCatWeek' : period === 'month' ? 'an.noCatMonth' : 'an.noCatYear')}
                </Text>
              ) : (
                categories.map((category) => (
                  <CategoryBreakdownRow
                    key={category.categoryId}
                    currency={currency}
                    category={category}
                  />
                ))
              )}
            </Column>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}

export type { AnalyticsComparison };