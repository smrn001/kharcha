import { FilterChip } from '@/components/filter-chip';
import { DateTimeField } from '@/components/date-time-field';
import { FloatingAddButton } from '@/components/floating-add-button';
import { PageHeader } from '@/components/page-header';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { TransactionRow } from '@/components/transaction-row';
import { Button, Icon, Text, TextInput } from '@expo/ui';
import { useCategories } from '@/hooks/use-categories';
import { useDayHeading } from '@/hooks/use-day-heading';
import { useI18n } from '@/hooks/use-i18n';
import { categoryDisplayName } from '@/lib/i18n';
import { useSettings } from '@/hooks/use-settings';
import { useTransactions } from '@/hooks/use-transactions';
import { endOfDay, startOfDay, startOfMonth, startOfWeek, toDateKey } from '@/lib/dates';
import { useAppColors } from '@/lib/colors';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, View } from 'react-native';
import type { Transaction, TransactionType } from '@/types';
import type { TransactionFilters } from '@/lib/db/transactions';

const SEARCH_ICON = Icon.select({
  ios: 'magnifyingglass',
  android: import('@expo/material-symbols/search.xml'),
});

const X_ICON = Icon.select({
  ios: 'xmark',
  android: import('@expo/material-symbols/close.xml'),
});

type TypeFilter = 'all' | TransactionType;
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

function useFilterOptions(): {
  types: { value: TypeFilter; label: string }[];
  dates: { value: DateFilter; label: string }[];
} {
  const { t } = useI18n();
  return {
    types: [
      { value: 'all', label: t('txns.all') },
      { value: 'expense', label: t('txns.expense') },
      { value: 'income', label: t('txns.income') },
    ],
    dates: [
      { value: 'all', label: t('txns.all') },
      { value: 'today', label: t('txns.today') },
      { value: 'week', label: t('txns.week') },
      { value: 'month', label: t('txns.month') },
      { value: 'custom', label: t('txns.custom') },
    ],
  };
}

interface Section {
  key: string;
  title: string;
  data: Transaction[];
}

export default function TransactionsScreen() {
  const colors = useAppColors();
  const { settings } = useSettings();

  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const { t, lang } = useI18n();
  const dayHeading = useDayHeading();
  const { types: TYPE_OPTS, dates: DATE_OPTS } = useFilterOptions();
  const { categories } = useCategories(type === 'all' ? undefined : type);
  const filters = useMemo<TransactionFilters>(() => {
    const next: TransactionFilters = {};
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
    return next;
  }, [query, type, dateFilter, customFrom, customTo, categoryIds, settings.startOfWeek]);

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
    !!query.trim() || type !== 'all' || dateFilter !== 'all' || categoryIds.length > 0;

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
  };

  return (
    <View style={{ flex: 1 }}>
      <PageHeader title={t('txns.title')} />

      <View style={{ gap: 12, paddingHorizontal: 16, paddingBottom: 4 }}>
        <View
          style={{
            height: 40,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderRadius: 10,
            backgroundColor: colors.mutedBackground,
            paddingHorizontal: 12,
          }}
        >
          <Icon name={SEARCH_ICON} size={16} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <TextInput
              onChangeText={setQuery}
              placeholder={t('txns.searchPh')}
              autoCapitalize="none"
              textStyle={{ fontSize: 15 }}
              style={{ height: '100%' }}
            />
          </View>
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel={t('txns.searchClear')} hitSlop={8}>
              <Icon name={X_ICON} size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        <SegmentedControl
          values={TYPE_OPTS.map((o) => o.label)}
          selectedIndex={TYPE_OPTS.findIndex((o) => o.value === type)}
          onValueChange={(label) => {
            const next = TYPE_OPTS.find((o) => o.label === label)?.value;
            if (next) handleTypeChange(next);
          }}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {DATE_OPTS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={dateFilter === option.value}
              onPress={() => setDateFilter(option.value)}
            />
          ))}
        </ScrollView>

        {dateFilter === 'custom' ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <DateTimeField
              mode="date"
              value={customFrom}
              onChange={setCustomFrom}
              label={t('common.from')}
              placeholder={t('common.selectDate')}
              style={{ flex: 1 }}
            />
            <DateTimeField
              mode="date"
              value={customTo}
              onChange={setCustomTo}
              label={t('common.to')}
              placeholder={t('common.selectDate')}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <FilterChip
            label={t('txns.allCategories')}
            selected={categoryIds.length === 0}
            onPress={() => setCategoryIds([])}
          />
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              label={categoryDisplayName(category, lang)}
              selected={categoryIds.includes(category.id)}
              onPress={() => toggleCategory(category.id)}
            />
          ))}
        </ScrollView>

        {hasActiveFilters ? (
          <Pressable onPress={clearFilters} style={{ alignSelf: 'flex-start' }} hitSlop={8}>
            <Text textStyle={{ fontSize: 14, color: colors.destructiveError }}>
              {t('txns.clearFilters')}
            </Text>
          </Pressable>
        ) : null}
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
            <Text
              textStyle={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.mutedForeground,
              }}
            >
              {section.title}
            </Text>
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
          <View style={{ height: 1, backgroundColor: colors.separator, marginLeft: 72, marginRight: 20 }} />
        )}
        ListEmptyComponent={
          loading ? (
            <Text textStyle={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
              {t('common.loading')}
            </Text>
          ) : hasActiveFilters ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 64, paddingHorizontal: 20 }}>
              <Icon name={SEARCH_ICON} size={40} color={colors.mutedForeground} />
              <Text textStyle={{ fontSize: 16, fontWeight: '600' }}>{t('txns.noMatchTitle')}</Text>
              <Text textStyle={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                {t('txns.noMatchMsg')}
              </Text>
              <Button label={t('txns.clearFilters')} variant="text" onPress={clearFilters} />
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 64, paddingHorizontal: 20 }}>
              <Icon name={SEARCH_ICON} size={40} color={colors.mutedForeground} />
              <Text textStyle={{ fontSize: 16, fontWeight: '600' }}>{t('txns.emptyTitle')}</Text>
              <Text textStyle={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                {t('txns.emptyMsg')}
              </Text>
            </View>
          )
        }
      />

      <FloatingAddButton />
    </View>
  );
}