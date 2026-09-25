import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { getDashboardSummary, type DashboardSummary } from '@/lib/db/transactions';
import { useQuery } from '@/hooks/use-query';

const EMPTY_SUMMARY: DashboardSummary = {
  balance: 0,
  income: 0,
  expense: 0,
  spentToday: 0,
  spentWeek: 0,
  spentMonth: 0,
};

export function useDashboardSummary(startOfWeekDay = 1) {
  const db = useSQLiteContext();
  const fetchSummary = useCallback(
    () => getDashboardSummary(db, startOfWeekDay),
    [db, startOfWeekDay]
  );
  const { data: summary, loading, refresh } = useQuery<DashboardSummary>(
    fetchSummary,
    [fetchSummary],
    EMPTY_SUMMARY
  );
  return { summary, loading, refresh };
}
