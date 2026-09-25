import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { getTransactions, type TransactionFilters } from '@/lib/db/transactions';
import { useQuery } from '@/hooks/use-query';
import type { Transaction } from '@/types';

export const NO_FILTERS: TransactionFilters = {};

export function useTransactions(filters: TransactionFilters = NO_FILTERS) {
  const db = useSQLiteContext();
  const fetchTransactions = useCallback(() => getTransactions(db, filters), [db, filters]);
  const { data: transactions, loading, refresh } = useQuery<Transaction[]>(
    fetchTransactions,
    [fetchTransactions],
    []
  );
  return { transactions, loading, refresh };
}
