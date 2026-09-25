import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { getCategories } from '@/lib/db/categories';
import { useQuery } from '@/hooks/use-query';
import type { Category, TransactionType } from '@/types';

export function useCategories(type?: TransactionType) {
  const db = useSQLiteContext();
  const fetchCategories = useCallback(() => getCategories(db, type), [db, type]);
  const { data: categories, loading, refresh } = useQuery<Category[]>(
    fetchCategories,
    [fetchCategories],
    []
  );
  return { categories, loading, refresh };
}
