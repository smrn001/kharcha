import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { getDashboardSummary, type DashboardSummary } from '@/lib/db/transactions';

const EMPTY_SUMMARY: DashboardSummary = {
  balance: 0,
  income: 0,
  expense: 0,
  spentToday: 0,
  spentWeek: 0,
  spentMonth: 0,
};

export function useDashboardSummary() {
  const db = useSQLiteContext();
  const [state, setState] = useState<{ summary: DashboardSummary; loading: boolean }>({
    summary: EMPTY_SUMMARY,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    getDashboardSummary(db)
      .then((summary) => {
        if (active) {
          setState({ summary, loading: false });
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
  }, [db]);

  const refresh = useCallback(async () => {
    try {
      const summary = await getDashboardSummary(db);
      setState({ summary, loading: false });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [db]);

  return { ...state, refresh };
}
