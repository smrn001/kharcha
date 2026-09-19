import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAnalyticsSummary,
  getCategorySpending,
  getSpendingTrend,
  type AnalyticsSummary,
  type CategorySpending,
} from '@/lib/db/transactions';
import { endOfDay, endOfMonth, startOfDay, startOfMonth, startOfWeek, startOfYear, toDateKey } from '@/lib/dates';

export type AnalyticsPeriod = 'week' | 'month' | 'year';

export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
}

export interface PeriodDelta {
  /** Current minus previous, in minor units. */
  diff: number;
  /** Percentage change vs previous, or null when previous was 0 and current is not. */
  pct: number | null;
}

export interface AnalyticsComparison {
  previous: AnalyticsSummary;
  /** e.g. "Last month" */
  previousLabel: string;
  /** e.g. "Aug 1 – Aug 31" */
  previousRangeLabel: string;
  /** e.g. "Sep 1 – Sep 19" */
  currentRangeLabel: string;
  income: PeriodDelta;
  expense: PeriodDelta;
  saved: PeriodDelta;
}

export interface CategoryMover {
  categoryId: string;
  name: string;
  icon: string | undefined;
  slug: string | undefined;
  current: number;
  previous: number;
  /** Current minus previous, in minor units. */
  diff: number;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shortDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function rangeLabel(from: Date, to: Date): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();
  if (sameMonth) {
    return `${shortDate(from)} – ${to.getDate()}`;
  }
  if (sameYear) {
    return `${shortDate(from)} – ${shortDate(to)}`;
  }
  return `${shortDate(from)}, ${from.getFullYear()} – ${shortDate(to)}, ${to.getFullYear()}`;
}

export function previousPeriodLabel(period: AnalyticsPeriod): string {
  return period === 'week' ? 'Last week' : period === 'month' ? 'Last month' : 'Last year';
}

function currentRange(period: AnalyticsPeriod, startOfWeekDay: number): { from: Date; to: Date } {
  const now = new Date();
  const from =
    period === 'week'
      ? startOfWeek(now, startOfWeekDay)
      : period === 'month'
        ? startOfMonth(now)
        : startOfYear(now);
  return { from: startOfDay(from), to: endOfDay(now) };
}

/**
 * Calendar-aligned previous period: full last week / full last month / full
 * last year. Compared against the current (possibly partial) period and
 * labelled clearly so the comparison is easy to interpret.
 */
function previousRange(
  period: AnalyticsPeriod,
  currentFrom: Date
): { from: Date; to: Date } {
  if (period === 'week') {
    const to = endOfDay(new Date(currentFrom.getTime() - 1));
    const from = startOfDay(new Date(to.getTime() - 6 * 86_400_000));
    return { from, to };
  }
  if (period === 'month') {
    const prevMonth = new Date(currentFrom.getFullYear(), currentFrom.getMonth() - 1, 1);
    return { from: startOfDay(prevMonth), to: endOfDay(endOfMonth(prevMonth)) };
  }
  const prevYear = currentFrom.getFullYear() - 1;
  return { from: new Date(prevYear, 0, 1), to: endOfDay(new Date(prevYear, 11, 31)) };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function delta(current: number, previous: number): PeriodDelta {
  return { diff: current - previous, pct: pctChange(current, previous) };
}

function buildComparison(
  summary: AnalyticsSummary,
  previous: AnalyticsSummary,
  period: AnalyticsPeriod,
  currentRangeLabelText: string,
  previousRangeLabelText: string
): AnalyticsComparison {
  return {
    previous,
    previousLabel: previousPeriodLabel(period),
    previousRangeLabel: previousRangeLabelText,
    currentRangeLabel: currentRangeLabelText,
    income: delta(summary.income, previous.income),
    expense: delta(summary.expense, previous.expense),
    saved: delta(summary.saved, previous.saved),
  };
}

function buildMovers(current: CategorySpending[], previous: CategorySpending[]): CategoryMover[] {
  const prevMap = new Map(previous.map((category) => [category.categoryId, category]));
  const seen = new Set<string>();
  const movers: CategoryMover[] = [];

  for (const category of current) {
    const prev = prevMap.get(category.categoryId);
    const prevAmount = prev?.amount ?? 0;
    movers.push({
      categoryId: category.categoryId,
      name: category.name,
      icon: category.icon,
      slug: category.slug,
      current: category.amount,
      previous: prevAmount,
      diff: category.amount - prevAmount,
    });
    seen.add(category.categoryId);
  }
  for (const prev of previous) {
    if (!seen.has(prev.categoryId)) {
      movers.push({
        categoryId: prev.categoryId,
        name: prev.name,
        icon: prev.icon,
        slug: prev.slug,
        current: 0,
        previous: prev.amount,
        diff: -prev.amount,
      });
    }
  }

  return movers
    .filter((mover) => mover.current > 0 || mover.previous > 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);
}

interface AnalyticsState {
  summary: AnalyticsSummary;
  comparison: AnalyticsComparison | null;
  movers: CategoryMover[];
  categories: CategorySpending[];
  trend: TrendPoint[];
  loading: boolean;
}

const EMPTY_SUMMARY: AnalyticsSummary = { income: 0, expense: 0, saved: 0 };

export function useAnalytics(period: AnalyticsPeriod, startOfWeekDay = 1) {
  const db = useSQLiteContext();
  const [state, setState] = useState<AnalyticsState>({
    summary: EMPTY_SUMMARY,
    comparison: null,
    movers: [],
    categories: [],
    trend: [],
    loading: true,
  });

  const rangeKeys = useMemo(() => {
    const current = currentRange(period, startOfWeekDay);
    const previous = previousRange(period, current.from);
    return {
      from: current.from.toISOString(),
      to: current.to.toISOString(),
      fromKey: toDateKey(current.from),
      toKey: toDateKey(current.to),
      prevFromKey: toDateKey(previous.from),
      prevToKey: toDateKey(previous.to),
      currentLabel: rangeLabel(current.from, current.to),
      previousLabel: rangeLabel(previous.from, previous.to),
    };
  }, [period, startOfWeekDay]);

  useEffect(() => {
    let active = true;
    const { from, to, fromKey, toKey, prevFromKey, prevToKey, currentLabel, previousLabel } =
      rangeKeys;
    Promise.all([
      getAnalyticsSummary(db, fromKey, toKey),
      getCategorySpending(db, fromKey, toKey),
      getSpendingTrend(db, fromKey, toKey),
      getAnalyticsSummary(db, prevFromKey, prevToKey),
      getCategorySpending(db, prevFromKey, prevToKey),
    ])
      .then(([summary, categories, points, prevSummary, prevCategories]) => {
        if (active) {
          setState({
            summary,
            comparison: buildComparison(summary, prevSummary, period, currentLabel, previousLabel),
            movers: buildMovers(categories, prevCategories),
            categories,
            trend: buildTrend(points, new Date(from), new Date(to), period),
            loading: false,
          });
        }
      })
      .catch(() => {
        if (active) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      });
    return () => {
      active = false;
    };
  }, [db, rangeKeys, period, startOfWeekDay]);

  const refresh = useCallback(async () => {
    try {
      const { from, to, fromKey, toKey, prevFromKey, prevToKey, currentLabel, previousLabel } =
        rangeKeys;
      const [summary, categories, points, prevSummary, prevCategories] = await Promise.all([
        getAnalyticsSummary(db, fromKey, toKey),
        getCategorySpending(db, fromKey, toKey),
        getSpendingTrend(db, fromKey, toKey),
        getAnalyticsSummary(db, prevFromKey, prevToKey),
        getCategorySpending(db, prevFromKey, prevToKey),
      ]);
      setState({
        summary,
        comparison: buildComparison(summary, prevSummary, period, currentLabel, previousLabel),
        movers: buildMovers(categories, prevCategories),
        categories,
        trend: buildTrend(points, new Date(from), new Date(to), period),
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [db, rangeKeys, period]);

  return { ...state, refresh };
}

function buildTrend(
  points: { date: string; income: number; expense: number }[],
  from: Date,
  to: Date,
  period: AnalyticsPeriod
): TrendPoint[] {
  const trend: TrendPoint[] = [];

  if (period === 'year') {
    const incomeByMonth = new Map<string, number>();
    const expenseByMonth = new Map<string, number>();
    for (const point of points) {
      const key = point.date.slice(0, 7);
      incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + point.income);
      expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + point.expense);
    }
    for (let month = 0; month < 12; month++) {
      const date = new Date(from.getFullYear(), month, 1);
      const key = dateKey(date).slice(0, 7);
      trend.push({
        label: MONTHS[month],
        income: incomeByMonth.get(key) ?? 0,
        expense: expenseByMonth.get(key) ?? 0,
      });
    }
    return trend;
  }

  const incomeByKey = new Map(points.map((point) => [point.date, point.income]));
  const expenseByKey = new Map(points.map((point) => [point.date, point.expense]));
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = dateKey(cursor);
    trend.push({
      label: period === 'week' ? WEEKDAYS[cursor.getDay()] : String(cursor.getDate()),
      income: incomeByKey.get(key) ?? 0,
      expense: expenseByKey.get(key) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return trend;
}
