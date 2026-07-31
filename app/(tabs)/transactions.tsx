import { FilterChip } from '@/components/filter-chip';
import { FloatingAddButton } from '@/components/floating-add-button';
import { SegmentedControl } from '@/components/segmented-control';
import { TransactionRow } from '@/components/transaction-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { useSettings } from '@/hooks/use-settings';
import { useTransactions } from '@/hooks/use-transactions';
import { endOfDay, formatDateLabel, formatFullDate, startOfDay, startOfMonth, startOfWeek, toDateKey } from '@/lib/dates';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, SectionList, TextInput, View } from 'react-native';
import type { Transaction, TransactionType } from '@/types';
import type { TransactionFilters } from '@/lib/db/transactions';

type TypeFilter = 'all' | TransactionType;
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

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
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const { categories } = useCategories(type === 'all' ? undefined : type);
  const filters = useMemo<TransactionFilters>(() => {
    const next: TransactionFilters = {};
    const trimmed = query.trim();
    if (trimmed) next.search = trimmed;
    if (type !== 'all') next.type = type;
    if (dateFilter === 'today') {
      next.from = startOfDay(new Date()).toISOString();
    } else if (dateFilter === 'week') {
      next.from = startOfWeek(new Date()).toISOString();
    } else if (dateFilter === 'month') {
      next.from = startOfMonth(new Date()).toISOString();
    } else if (dateFilter === 'custom') {
      if (customFrom) next.from = startOfDay(customFrom).toISOString();
      if (customTo) next.to = endOfDay(customTo).toISOString();
    }
    if (categoryIds.length > 0) next.categoryIds = categoryIds;
    return next;
  }, [query, type, dateFilter, customFrom, customTo, categoryIds]);

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
      const key = toDateKey(new Date(transaction.date));
      const group = grouped.get(key) ?? [];
      group.push(transaction);
      grouped.set(key, group);
    }
    return [...grouped.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]): Section => ({ key, title: formatDateLabel(data[0].date), data }));
  }, [transactions]);

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

  const openFromPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: customFrom ?? new Date(),
        mode: 'date',
        onValueChange: (_event, selected) => {
          if (selected) setCustomFrom(selected);
        },
      });
    } else {
      setShowFromPicker(true);
    }
  };

  const openToPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: customTo ?? new Date(),
        mode: 'date',
        onValueChange: (_event, selected) => {
          if (selected) setCustomTo(selected);
        },
      });
    } else {
      setShowToPicker(true);
    }
  };

  return (
    <View className="bg-background flex-1">
      <View className="px-5 pb-2 pt-4">
        <Text className="text-2xl font-bold">Transactions</Text>
      </View>

      <View className="gap-3 px-5 pb-3">
        <View className="border-border bg-card h-10 flex-row items-center gap-2 rounded-md border px-3">
          <Icon as={Search} size={16} className="text-muted-foreground" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search title, note, or category"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Search transactions"
            className="text-foreground flex-1 text-sm"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
              <Icon as={X} size={16} className="text-muted-foreground" />
            </Pressable>
          ) : null}
        </View>

        <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={handleTypeChange} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {DATE_OPTIONS.map((option) => (
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
            <Pressable
              onPress={openFromPicker}
              className="border-border h-12 flex-1 justify-center rounded-md border px-3"
            >
              <Text variant="muted" className="text-xs">
                From
              </Text>
              <Text className="text-sm">
                {customFrom ? formatFullDate(customFrom.toISOString()) : 'Select date'}
              </Text>
            </Pressable>
            <Pressable
              onPress={openToPicker}
              className="border-border h-12 flex-1 justify-center rounded-md border px-3"
            >
              <Text variant="muted" className="text-xs">
                To
              </Text>
              <Text className="text-sm">
                {customTo ? formatFullDate(customTo.toISOString()) : 'Select date'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          <FilterChip
            label="All categories"
            selected={categoryIds.length === 0}
            onPress={() => setCategoryIds([])}
          />
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              selected={categoryIds.includes(category.id)}
              onPress={() => toggleCategory(category.id)}
            />
          ))}
        </ScrollView>

        {hasActiveFilters ? (
          <Pressable onPress={clearFilters} className="self-start" hitSlop={8}>
            <Text className="text-destructive text-sm">Clear filters</Text>
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
                category={categoryMap.get(item.categoryId)}
                currency={settings.currency}
              />
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View className="bg-border px-5 h-px" />}
        ListEmptyComponent={
          loading ? (
            <Text variant="muted" className="px-5 py-16 text-center">
              Loading…
            </Text>
          ) : hasActiveFilters ? (
            <View className="items-center gap-2 px-5 py-16">
              <Icon as={Search} size={40} className="text-muted-foreground" />
              <Text className="text-base font-semibold">No matching transactions</Text>
              <Text variant="muted" className="text-center">
                Try adjusting your search or filters.
              </Text>
              <Button variant="outline" onPress={clearFilters} className="mt-2">
                <Text>Clear filters</Text>
              </Button>
            </View>
          ) : (
            <View className="items-center gap-2 px-5 py-16">
              <Icon as={Search} size={40} className="text-muted-foreground" />
              <Text className="text-base font-semibold">No transactions yet</Text>
              <Text variant="muted" className="text-center">
                Tap the + button to add your first expense or income.
              </Text>
            </View>
          )
        }
      />

      {showFromPicker && Platform.OS === 'ios' ? (
        <View className="border-border bg-card rounded-t-xl border p-4">
          <DateTimePicker
            value={customFrom ?? new Date()}
            mode="date"
            display="spinner"
            onValueChange={(_event, selected) => setCustomFrom(selected)}
          />
          <Button onPress={() => setShowFromPicker(false)}>
            <Text className="text-primary-foreground font-medium">Done</Text>
          </Button>
        </View>
      ) : null}

      {showToPicker && Platform.OS === 'ios' ? (
        <View className="border-border bg-card rounded-t-xl border p-4">
          <DateTimePicker
            value={customTo ?? new Date()}
            mode="date"
            display="spinner"
            onValueChange={(_event, selected) => setCustomTo(selected)}
          />
          <Button onPress={() => setShowToPicker(false)}>
            <Text className="text-primary-foreground font-medium">Done</Text>
          </Button>
        </View>
      ) : null}

      <FloatingAddButton />
    </View>
  );
}
