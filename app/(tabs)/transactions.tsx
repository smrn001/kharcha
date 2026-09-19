import { FilterChip } from '@/components/filter-chip';
import { DateTimeField } from '@/components/date-time-field';
import { FloatingAddButton } from '@/components/floating-add-button';
import { PageHeader } from '@/components/page-header';
import { SegmentedControl } from '@/components/segmented-control';
import { TransactionRow } from '@/components/transaction-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { useDayHeading } from '@/hooks/use-day-heading';
import { useI18n } from '@/hooks/use-i18n';
import { categoryDisplayName } from '@/lib/i18n';
import { useSettings } from '@/hooks/use-settings';
import { useTransactions } from '@/hooks/use-transactions';
import { endOfDay, startOfDay, startOfMonth, startOfWeek, toDateKey } from '@/lib/dates';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import { router, useFocusEffect } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, TextInput, View } from 'react-native';
import type { Transaction, TransactionType } from '@/types';
import type { TransactionFilters } from '@/lib/db/transactions';

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
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
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
    <View className="bg-background flex-1">
      <PageHeader title={t('txns.title')} />

      <View className="gap-3 px-5 pb-3">
        <View className="border-border bg-card h-10 flex-row items-center gap-2 rounded-md border px-3">
          <Icon as={Search} size={16} className="text-muted-foreground" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('txns.searchPh')}
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel={t('txns.searchPh')}
            className="text-foreground flex-1 text-sm"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel={t('txns.searchClear')} hitSlop={8}>
              <Icon as={X} size={16} className="text-muted-foreground" />
            </Pressable>
          ) : null}
        </View>

        <SegmentedControl options={TYPE_OPTS} value={type} onChange={handleTypeChange} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
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
          <View className="flex-row gap-3">
            <DateTimeField
              mode="date"
              value={customFrom}
              onChange={setCustomFrom}
              label={t('common.from')}
              placeholder={t('common.selectDate')}
              className="flex-1"
            />
            <DateTimeField
              mode="date"
              value={customTo}
              onChange={setCustomTo}
              label={t('common.to')}
              placeholder={t('common.selectDate')}
              className="flex-1"
            />
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
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
          <Pressable onPress={clearFilters} className="self-start" hitSlop={8}>
            <Text className="text-destructive text-sm">{t('txns.clearFilters')}</Text>
          </Pressable>
        ) : null}
      </View>

      <SectionList<Transaction, Section>
        sections={sections}
        keyExtractor={(item) => item.id}
        className="flex-1"
        contentContainerClassName="pb-28"
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => (
          <Text variant="muted" className="bg-background px-5 pb-2 pt-6 text-xs font-semibold uppercase">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="px-5">
            <Pressable onPress={() => router.push(`/transaction/${item.id}`)}>
              <TransactionRow
                transaction={item}
                category={item.categoryId ? categoryMap.get(item.categoryId) : undefined}
                currency={settings.currency}
              />
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View className="bg-border mx-5 h-px" />}
        ListEmptyComponent={
          loading ? (
            <Text variant="muted" className="px-5 py-16 text-center">
              {t('common.loading')}
            </Text>
          ) : hasActiveFilters ? (
            <View className="items-center gap-2 px-5 py-16">
              <Icon as={Search} size={40} className="text-muted-foreground" />
              <Text className="text-base font-semibold">{t('txns.noMatchTitle')}</Text>
              <Text variant="muted" className="text-center">
                {t('txns.noMatchMsg')}
              </Text>
              <Button variant="outline" onPress={clearFilters} className="mt-2">
                <Text>{t('txns.clearFilters')}</Text>
              </Button>
            </View>
          ) : (
            <View className="items-center gap-2 px-5 py-16">
              <Icon as={Search} size={40} className="text-muted-foreground" />
              <Text className="text-base font-semibold">{t('txns.emptyTitle')}</Text>
              <Text variant="muted" className="text-center">
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
