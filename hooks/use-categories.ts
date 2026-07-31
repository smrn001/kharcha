import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { getCategories } from '@/lib/db/categories';
import type { Category, TransactionType } from '@/types';

export function useCategories(type?: TransactionType) {
  const db = useSQLiteContext();
  const [state, setState] = useState<{ categories: Category[]; loading: boolean }>({
    categories: [],
    loading: true,
  });

  useEffect(() => {
    let active = true;
    getCategories(db, type)
      .then((rows) => {
        if (active) {
          setState({ categories: rows, loading: false });
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
  }, [db, type]);

  const refresh = useCallback(async () => {
    try {
      const rows = await getCategories(db, type);
      setState({ categories: rows, loading: false });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [db, type]);

  return { ...state, refresh };
}
