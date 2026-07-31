import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAnalyticsSummary,
  getCategorySpending,
  getSpendingTrend,
  type AnalyticsSummary,
  type CategorySpending,
} from '@/lib/db/transactions';
import { endOfDay, startOfDay, startOfMonth, startOfWeek, startOfYear } from '@/lib/dates';

export type AnalyticsPeriod = 'week' | 'month' | 'year';

export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
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

interface AnalyticsState {
  summary: AnalyticsSummary;
  categories: CategorySpending[];
  trend: TrendPoint[];
  loading: boolean;
}

const EMPTY_SUMMARY: AnalyticsSummary = { income: 0, expense: 0, saved: 0 };

export function useAnalytics(period: AnalyticsPeriod) {
  const db = useSQLiteContext();
  const [state, setState] = useState<AnalyticsState>({
    summary: EMPTY_SUMMARY,
    categories: [],
    trend: [],
    loading: true,
  });

  const range = useMemo(() => {
    const now = new Date();
    const from =
      period === 'week'
        ? startOfWeek(now)
        : period === 'month'
          ? startOfMonth(now)
          : startOfYear(now);
    return { from: startOfDay(from), to: endOfDay(now) };
  }, [period]);

  useEffect(() => {
    let active = true;
    const from = range.from.toISOString();
    const to = range.to.toISOString();
    Promise.all([
      getAnalyticsSummary(db, from, to),
      getCategorySpending(db, from, to),
      getSpendingTrend(db, from, to),
    ])
      .then(([summary, categories, points]) => {
        if (active) {
          setState({
            summary,
            categories,
            trend: buildTrend(points, range.from, range.to, period),
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
  }, [db, range, period]);

  const refresh = useCallback(async () => {
    try {
      const from = range.from.toISOString();
      const to = range.to.toISOString();
      const [summary, categories, points] = await Promise.all([
        getAnalyticsSummary(db, from, to),
        getCategorySpending(db, from, to),
        getSpendingTrend(db, from, to),
      ]);
      setState({
        summary,
        categories,
        trend: buildTrend(points, range.from, range.to, period),
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [db, range, period]);

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
