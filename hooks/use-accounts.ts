import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { getAccounts } from '@/lib/db/accounts';
import type { Account } from '@/types';

export function useAccounts() {
  const db = useSQLiteContext();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    let active = true;
    getAccounts(db)
      .then((rows) => {
        if (active) setAccounts(rows);
      })
      .catch(() => {
        // Account list is purely additive; keep whatever we already have.
      });
    return () => {
      active = false;
    };
  }, [db]);

  const refresh = useCallback(async () => {
    const rows = await getAccounts(db);
    setAccounts(rows);
  }, [db]);

  return { accounts, refresh };
}