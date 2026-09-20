import { ListItem, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { formatAmount } from '@/lib/format';
import type { AnalyticsComparison, AnalyticsPeriod, PeriodDelta } from '@/lib/analytics';
import type { DictionaryKey } from '@/lib/i18n';

const UNIT_KEYS: Record<AnalyticsPeriod, DictionaryKey> = {
  week: 'an.lastWeek',
  month: 'an.lastMonth',
  year: 'an.lastYear',
};

type TFn = (key: DictionaryKey, params?: Record<string, string | number>) => string;

export function comparisonInsight(
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

export function unitLabelKey(period: AnalyticsPeriod): DictionaryKey {
  return UNIT_KEYS[period];
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

// Single section row — use directly under FieldGroup.Section.
export function ComparisonRow({
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
    <ListItem
      children={label}
      supportingText={`${formatAmount(current, currency)} · ${trow('an.was', { amount: formatAmount(previous, currency) })}`}
      trailing={<DeltaBadge delta={delta} goodWhenDown={goodWhenDown} />}
    />
  );
}