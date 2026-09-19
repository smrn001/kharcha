import { BarChart } from '@/components/bar-chart';
import { LoadingView } from '@/components/loading-view';
import { NativeBlock } from '@/components/native-block';
import { PageHeader } from '@/components/page-header';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Icon, ListItem, Text } from '@expo/ui';
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
import { useTheme } from '@/lib/theme';
import { formatAmount, formatAmountCompact } from '@/lib/format';
import { useFocusEffect } from 'expo-router';
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
    <View style={{ flex: 1 }}>
      <PageHeader title={t('tabs.analytics')} />
      <AnalyticsContent currency={settings.currency} startOfWeek={settings.startOfWeek} />
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const colors = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
      <NativeBlock>
        <Text
          textStyle={{
            fontSize: 12,
            fontWeight: '600',
            color: colors.textSecondary,
          }}
        >
          {children}
        </Text>
      </NativeBlock>
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
  const colors = useTheme();
  const { t } = useI18n();
  const { titles: sectionTitles } = usePeriodOptions();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const saved = summary.income - summary.expense;
  const overspent = saved < 0;
  const savedColor = overspent ? colors.destructive : saved > 0 ? colors.success : undefined;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <SegmentedControl
          values={PERIOD_OPTIONS.map((o) => o.label)}
          selectedIndex={PERIOD_OPTIONS.findIndex((o) => o.value === period)}
          onValueChange={(label) => {
            const next = PERIOD_OPTIONS.find((o) => o.label === label)?.value;
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
          <SectionLabel>{sectionTitles[period]}</SectionLabel>
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
          <SectionLabel>{t('an.vs', { label: t(PREV_KEYS[period]) })}</SectionLabel>
          <ComparisonCard period={period} currency={currency} comparison={comparison} loading={loading} />
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

type TFn = (key: DictionaryKey, params?: Record<string, string | number>) => string;

const UNIT_KEYS: Record<AnalyticsPeriod, DictionaryKey> = {
  week: 'an.lastWeek',
  month: 'an.lastMonth',
  year: 'an.lastYear',
};

const PREV_KEYS: Record<AnalyticsPeriod, DictionaryKey> = {
  week: 'an.lastWeek',
  month: 'an.lastMonth',
  year: 'an.lastYear',
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
  comparison: AnalyticsComparison;
  loading: boolean;
}) {
  const { t } = useI18n();
  void loading;
  const prevLabel = t(UNIT_KEYS[period]);
  const hasHistory = comparison.previous.income !== 0 || comparison.previous.expense !== 0;
  const insight = buildInsight(t, period, comparison, currency);

  return (
    <View>
      <NativeBlock matchContents={false}>
        <ListItem
          children={t('an.vs', { label: prevLabel })}
          supportingText={hasHistory ? insight : undefined}
        />
      </NativeBlock>
      {hasHistory ? (
        <ComparisonRow
          label={t('an.expenses')}
          current={comparison.previous.expense + comparison.expense.diff}
          previous={comparison.previous.expense}
          delta={comparison.expense}
          goodWhenDown
          currency={currency}
        />
      ) : null}
      {hasHistory ? (
        <ComparisonRow
          label={t('an.income')}
          current={comparison.previous.income + comparison.income.diff}
          previous={comparison.previous.income}
          delta={comparison.income}
          goodWhenDown={false}
          currency={currency}
        />
      ) : null}
      {hasHistory ? (
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
      ) : null}
    </View>
  );
}

function DeltaBadge({
  delta,
  goodWhenDown,
}: {
  delta: AnalyticsComparison['expense'];
  goodWhenDown: boolean;
}) {
  const colors = useTheme();
  const up = delta.diff > 0;
  const flat = delta.diff === 0;
  const good = flat ? null : goodWhenDown ? !up : up;
  const color = flat ? colors.textSecondary : good ? colors.success : colors.destructive;
  const label = flat ? '0%' : delta.pct === null ? 'new' : `${up ? '+' : '−'}${Math.abs(Math.round(delta.pct))}%`;

  return <Text textStyle={{ fontSize: 13, fontWeight: '600', color }}>{label}</Text>;
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
  return (
    <NativeBlock matchContents={false}>
      <ListItem
        children={label}
        supportingText={`${formatAmount(current, currency)} · ${trow('an.was', { amount: formatAmount(previous, currency) })}`}
        trailing={<DeltaBadge delta={delta} goodWhenDown={goodWhenDown} />}
      />
    </NativeBlock>
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
  const colors = useTheme();
  const visible = movers.filter((mover) => mover.diff !== 0);
  if (loading && movers.length === 0) return null;
  if (visible.length === 0) return null;

  return (
    <View>
      {visible.map((mover) => {
        const up = mover.diff > 0;
        return (
          <NativeBlock key={mover.categoryId} matchContents={false}>
            <ListItem
              leading={<Icon name={categoryIcon(mover.icon)} size={18} />}
              children={categoryDisplayName(mover, mlang)}
              supportingText={tmovers('an.was', { amount: formatAmount(mover.previous, currency) })}
              trailing={
                <Text
                  textStyle={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: up ? colors.destructive : colors.success,
                  }}
                >
                  {`${up ? '+' : '−'}${formatAmount(Math.abs(mover.diff), currency)}`}
                </Text>
              }
            />
          </NativeBlock>
        );
      })}
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
  const colors = useTheme();

  if (loading && trend.length === 0) {
    return (
      <NativeBlock>
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
          {ttrend('common.loading')}
        </Text>
      </NativeBlock>
    );
  }
  if (trend.every((point) => point.income === 0 && point.expense === 0)) {
    return (
      <NativeBlock>
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
          {ttrend(period === 'week' ? 'an.noTrendWeek' : period === 'month' ? 'an.noTrendMonth' : 'an.noTrendYear')}
        </Text>
      </NativeBlock>
    );
  }

  return (
    <BarChart data={trend} formatValue={(value) => formatAmountCompact(value, currency)} />
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
  const colors = useTheme();

  if (loading && categories.length === 0) {
    return (
      <NativeBlock>
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
          {tcat('common.loading')}
        </Text>
      </NativeBlock>
    );
  }
  if (categories.length === 0) {
    return (
      <NativeBlock>
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
          {tcat(period === 'week' ? 'an.noCatWeek' : period === 'month' ? 'an.noCatMonth' : 'an.noCatYear')}
        </Text>
      </NativeBlock>
    );
  }

  return (
    <View>
      {categories.map((category) => (
        <NativeBlock key={category.categoryId} matchContents={false}>
          <ListItem
            leading={<Icon name={categoryIcon(category.icon)} size={18} />}
            children={categoryDisplayName(category, clang)}
            supportingText={`${formatAmount(category.amount, currency)} · ${category.percentage}%`}
          />
        </NativeBlock>
      ))}
    </View>
  );
}