import { FloatingAddButton } from '@/components/floating-add-button';
import { LoadingView } from '@/components/loading-view';
import { PageHeader } from '@/components/page-header';
import {
  TransactionFilters,
  type DateFilter,
  type TypeFilter,
} from '@/components/transaction-filters';
import { TransactionFieldRow } from '@/components/transaction-row';
import { TransactionListEmpty } from '@/components/transaction-list-empty';
import { FieldGroup, Host } from '@expo/ui';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useDayHeading } from '@/hooks/use-day-heading';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useTransactions } from '@/hooks/use-transactions';
import { endOfDay, startOfDay, startOfMonth, startOfWeek, toDateKey } from '@/lib/dates';
import { useTheme } from '@/lib/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import type { Transaction } from '@/types';
import type { TransactionFilters as QueryFilters } from '@/lib/db/transactions';

/** Parse a user-typed amount ("850", "12.50") into minor units, or null. */
function parseAmountMinor(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

interface Section {
  key: string;
  title: string;
  data: Transaction[];
}

export default function TransactionsScreen() {
  const colors = useTheme();
  const scheme = useColorScheme();
  const { settings } = useSettings();

  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const { t } = useI18n();
  const dayHeading = useDayHeading();
  const { categories } = useCategories(type === 'all' ? undefined : type);
  const { accounts } = useAccounts();

  const filters = useMemo<QueryFilters>(() => {
    const next: QueryFilters = {};
    const trimmed = query.trim();
    if (trimmed) next.search = trimmed;
    if (type !== 'all') next.type = type;
    if (dateFilter === 'today') {
      next.from = toDateKey(startOfDay(new Date()));
    } else if (dateFilter === 'week') {
      next.from = toDateKey(startOfWeek(new Date(), settings.startOfWeek));
    } else if (dateFilter === 'month') {
      next.from = toDateKey(startOfMonth(new Date()));
    } else if (dateFilter === 'custom') {
      if (customFrom) next.from = toDateKey(startOfDay(customFrom));
      if (customTo) next.to = toDateKey(endOfDay(customTo));
    }
    if (categoryIds.length > 0) next.categoryIds = categoryIds;
    if (accountId) next.accountIds = [accountId];
    const minMinor = parseAmountMinor(minAmount);
    if (minMinor != null) next.minAmountMinor = minMinor;
    const maxMinor = parseAmountMinor(maxAmount);
    if (maxMinor != null) next.maxAmountMinor = maxMinor;
    return next;
  }, [
    query,
    type,
    dateFilter,
    customFrom,
    customTo,
    categoryIds,
    accountId,
    minAmount,
    maxAmount,
    settings.startOfWeek,
  ]);

  const { transactions, loading, refresh } = useTransactions(filters);

  const hasActiveFilters =
    !!query.trim() ||
    type !== 'all' ||
    dateFilter !== 'all' ||
    categoryIds.length > 0 ||
    accountId != null ||
    minAmount.trim().length > 0 ||
    maxAmount.trim().length > 0;

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    for (const transaction of transactions) {
      const key = transaction.localDate;
      const group = grouped.get(key) ?? [];
      group.push(transaction);
      grouped.set(key, group);
    }
    return [...grouped.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]): Section => ({ key, title: dayHeading(key), data }));
  }, [transactions, dayHeading]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleTypeChange = (next: TypeFilter) => {
    setType(next);
    setCategoryIds([]);
  };

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((categoryId) => categoryId !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setType('all');
    setDateFilter('all');
    setCustomFrom(null);
    setCustomTo(null);
    setCategoryIds([]);
    setAccountId(null);
    setMinAmount('');
    setMaxAmount('');
  };

  return (
    <View style={{ flex: 1 , backgroundColor: colors.background,}} >
      <PageHeader title={t('txns.title')} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <TransactionFilters
          query={query}
          onQueryChange={setQuery}
          type={type}
          onTypeChange={handleTypeChange}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFrom={setCustomFrom}
          onCustomTo={setCustomTo}
          categoryIds={categoryIds}
          onToggleCategory={toggleCategory}
          onClearCategories={() => setCategoryIds([])}
          categories={categories}
          accountId={accountId}
          onAccountChange={setAccountId}
          accounts={accounts}
          minAmount={minAmount}
          maxAmount={maxAmount}
          onMinAmountChange={setMinAmount}
          onMaxAmountChange={setMaxAmount}
          resultCount={transactions.length}
          hasActiveFilters={hasActiveFilters}
          onClearAll={clearFilters}
        />
      </View>

      {loading && transactions.length === 0 ? (
        <View style={{ flex: 1 }}>
          <LoadingView label={t('common.loading')} />
        </View>
      ) : transactions.length === 0 ? (
        <TransactionListEmpty
          hasActiveFilters={hasActiveFilters}
          hasQuery={!!query.trim()}
          resultCount={transactions.length}
          loading={loading}
          onClearFilters={clearFilters}
        />
      ) : (
        <Host style={{ flex: 1 }} colorScheme={scheme ?? undefined}>
          <FieldGroup>
            {sections.map((section) => (
              <FieldGroup.Section key={section.key} title={section.title}>
                {section.data.map((transaction) => (
                  <TransactionFieldRow
                    key={transaction.id}
                    transaction={transaction}
                    category={
                      transaction.categoryId
                        ? categoryMap.get(transaction.categoryId)
                        : undefined
                    }
                    currency={settings.currency}
                    onPress={() => router.push(`/transaction/${transaction.id}`)}
                  />
                ))}
              </FieldGroup.Section>
            ))}
          </FieldGroup>
        </Host>
      )}

      <FloatingAddButton />
    </View>
  );
}
