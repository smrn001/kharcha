import { FloatingAddButton } from '@/components/floating-add-button';
import { LoadingView } from '@/components/loading-view';
import { NativeBlock } from '@/components/native-block';
import { PageHeader } from '@/components/page-header';
import {
  TransactionFilters,
  type DateFilter,
  type TypeFilter,
} from '@/components/transaction-filters';
import { TransactionRow } from '@/components/transaction-row';
import { Button, Icon, Text } from '@expo/ui';
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
import { RefreshControl, SectionList, View } from 'react-native';
import type { Transaction } from '@/types';
import type { TransactionFilters as QueryFilters } from '@/lib/db/transactions';

const SEARCH_ICON = Icon.select({
  ios: 'magnifyingglass',
  android: import('@expo/material-symbols/search.xml'),
});

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
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

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
    <View style={{ flex: 1 }}>
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

      <SectionList<Transaction, Section>
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        sections={sections}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 112 }}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => (
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
            <NativeBlock>
              <Text
                textStyle={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.textSecondary,
                }}
              >
                {section.title}
              </Text>
            </NativeBlock>
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            category={item.categoryId ? categoryMap.get(item.categoryId) : undefined}
            currency={settings.currency}
            onPress={() => router.push(`/transaction/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 72, marginRight: 20 }} />
        )}
        ListEmptyComponent={
          loading ? (
            <LoadingView label={t('common.loading')} />
          ) : (
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 64, paddingHorizontal: 20 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <NativeBlock>
                  <Icon name={SEARCH_ICON} size={24} color={colors.textSecondary} />
                </NativeBlock>
              </View>
              <NativeBlock>
                <Text textStyle={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {hasActiveFilters ? t('txns.noMatchTitle') : t('txns.emptyTitle')}
                </Text>
              </NativeBlock>
              <NativeBlock>
                <Text textStyle={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                  {hasActiveFilters ? t('txns.noMatchMsg') : t('txns.emptyMsg')}
                </Text>
              </NativeBlock>
              {query.trim() && !loading ? (
                <NativeBlock>
                  <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>
                    {t('txns.found', { count: String(transactions.length) })}
                  </Text>
                </NativeBlock>
              ) : null}
              {hasActiveFilters ? (
                <NativeBlock>
                  <Button label={t('txns.clearFilters')} variant="text" onPress={clearFilters} />
                </NativeBlock>
              ) : null}
            </View>
          )
        }
      />

      <FloatingAddButton />
    </View>
  );
}
