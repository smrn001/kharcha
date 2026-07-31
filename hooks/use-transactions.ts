import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { getTransactions, type TransactionFilters } from '@/lib/db/transactions';
import type { Transaction } from '@/types';

export const NO_FILTERS: TransactionFilters = {};

export function useTransactions(filters: TransactionFilters = NO_FILTERS) {
  const db = useSQLiteContext();
  const [state, setState] = useState<{ transactions: Transaction[]; loading: boolean }>({
    transactions: [],
    loading: true,
  });

  useEffect(() => {
    let active = true;
    getTransactions(db, filters)
      .then((rows) => {
        if (active) {
          setState({ transactions: rows, loading: false });
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
  }, [db, filters]);

  const refresh = useCallback(async () => {
    try {
      const rows = await getTransactions(db, filters);
      setState({ transactions: rows, loading: false });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [db, filters]);

  return { ...state, refresh };
}
