import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAnalyticsCounts,
  getAnalyticsSummary,
  getCategorySpending,
  getSpendingTrend,
  type AnalyticsCounts,
  type AnalyticsSummary,
  type CategorySpending,
} from '@/lib/db/analytics-queries';
import {
  buildComparison,
  buildMovers,
  buildTrend,
  computeRangeKeys,
  type AnalyticsPeriod,
  type CategoryMover,
  type TrendPoint,
} from '@/lib/analytics';

export type { AnalyticsPeriod, CategoryMover, TrendPoint };
export type { AnalyticsComparison, PeriodDelta } from '@/lib/analytics';

interface AnalyticsState {
  summary: AnalyticsSummary;
  counts: AnalyticsCounts;
  comparison: ReturnType<typeof buildComparison> | null;
  movers: CategoryMover[];
  categories: CategorySpending[];
  trend: TrendPoint[];
  loading: boolean;
}

const EMPTY_SUMMARY: AnalyticsSummary = { income: 0, expense: 0, saved: 0 };
const EMPTY_COUNTS: AnalyticsCounts = { income: 0, expense: 0 };

export function useAnalytics(period: AnalyticsPeriod, startOfWeekDay = 1) {
  const db = useSQLiteContext();
  const [state, setState] = useState<AnalyticsState>({
    summary: EMPTY_SUMMARY,
    counts: EMPTY_COUNTS,
    comparison: null,
    movers: [],
    categories: [],
    trend: [],
    loading: true,
  });

  const rangeKeys = useMemo(() => computeRangeKeys(period, startOfWeekDay), [period, startOfWeekDay]);

  useEffect(() => {
    let active = true;
    const {
      from: fromDate,
      to: toDate,
      fromKey,
      toKey,
      prevFromKey,
      prevToKey,
      currentLabel,
      previousLabel,
    } = rangeKeys;
    const apply = (next: () => AnalyticsState) => {
      if (active) setState(next());
    };
    Promise.all([
      getAnalyticsSummary(db, fromKey, toKey),
      getAnalyticsCounts(db, fromKey, toKey),
      getCategorySpending(db, fromKey, toKey),
      getSpendingTrend(db, fromKey, toKey),
      getAnalyticsSummary(db, prevFromKey, prevToKey),
      getCategorySpending(db, prevFromKey, prevToKey),
    ])
      .then(([summary, counts, categories, points, prevSummary, prevCategories]) => {
        apply(() => ({
          summary,
          counts,
          comparison: buildComparison(summary, prevSummary, period, currentLabel, previousLabel),
          movers: buildMovers(categories, prevCategories),
          categories,
          trend: buildTrend(points, new Date(fromDate), new Date(toDate), period),
          loading: false,
        }));
      })
      .catch(() => {
        if (active) setState((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [db, rangeKeys, period]);

  const refresh = useCallback(async () => {
    try {
      const {
        from: fromDate,
        to: toDate,
        fromKey,
        toKey,
        prevFromKey,
        prevToKey,
        currentLabel,
        previousLabel,
      } = rangeKeys;
      const [summary, counts, categories, points, prevSummary, prevCategories] = await Promise.all([
        getAnalyticsSummary(db, fromKey, toKey),
        getAnalyticsCounts(db, fromKey, toKey),
        getCategorySpending(db, fromKey, toKey),
        getSpendingTrend(db, fromKey, toKey),
        getAnalyticsSummary(db, prevFromKey, prevToKey),
        getCategorySpending(db, prevFromKey, prevToKey),
      ]);
      setState({
        summary,
        counts,
        comparison: buildComparison(summary, prevSummary, period, currentLabel, previousLabel),
        movers: buildMovers(categories, prevCategories),
        categories,
        trend: buildTrend(points, new Date(fromDate), new Date(toDate), period),
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [db, rangeKeys, period]);

  return { ...state, refresh };
}