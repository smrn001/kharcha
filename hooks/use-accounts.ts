import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { getAccounts } from '@/lib/db/accounts';
import { useQuery } from '@/hooks/use-query';
import type { Account } from '@/types';

export function useAccounts() {
  const db = useSQLiteContext();
  const fetchAccounts = useCallback(() => getAccounts(db), [db]);
  const { data: accounts, loading, refresh } = useQuery<Account[]>(
    fetchAccounts,
    [fetchAccounts],
    []
  );
  return { accounts, loading, refresh };
}
