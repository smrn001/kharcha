import { NativeBlock } from '@/components/native-block';
import { ListItem, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { formatAmount } from '@/lib/format';
import type { AnalyticsComparison, AnalyticsPeriod, PeriodDelta } from '@/lib/analytics';
import type { DictionaryKey } from '@/lib/i18n';
import { View } from 'react-native';

const UNIT_KEYS: Record<AnalyticsPeriod, DictionaryKey> = {
  week: 'an.lastWeek',
  month: 'an.lastMonth',
  year: 'an.lastYear',
};

type TFn = (key: DictionaryKey, params?: Record<string, string | number>) => string;

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

function DeltaBadge({ delta, goodWhenDown }: { delta: PeriodDelta; goodWhenDown: boolean }) {
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
  delta: PeriodDelta;
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

export function ComparisonCard({
  period,
  currency,
  comparison,
}: {
  period: AnalyticsPeriod;
  currency: string;
  comparison: AnalyticsComparison;
}) {
  const { t } = useI18n();
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