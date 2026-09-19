import { DateTimeField } from '@/components/date-time-field';
import { NativeBlock } from '@/components/native-block';
import { BottomSheet, Button, Column, Icon, Row, ScrollView, Spacer, Text, TextInput } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { useI18n } from '@/hooks/use-i18n';
import { categoryDisplayName } from '@/lib/i18n';
import { hapticSelection } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import type { Category, TransactionType } from '@/types';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

const SEARCH_ICON = Icon.select({
  ios: 'magnifyingglass',
  android: import('@expo/material-symbols/search.xml'),
});

const X_ICON = Icon.select({
  ios: 'xmark',
  android: import('@expo/material-symbols/close.xml'),
});

const FUNNEL_ICON = Icon.select({
  ios: 'line.3.horizontal.decrease',
  android: import('@expo/material-symbols/filter_alt.xml'),
});

const CHECK_ICON = Icon.select({
  ios: 'checkmark',
  android: import('@expo/material-symbols/check.xml'),
});

export type TypeFilter = 'all' | TransactionType;
export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

interface TransactionFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  type: TypeFilter;
  onTypeChange: (type: TypeFilter) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  customFrom: Date | null;
  customTo: Date | null;
  onCustomFrom: (date: Date) => void;
  onCustomTo: (date: Date) => void;
  categoryIds: string[];
  onToggleCategory: (id: string) => void;
  onClearCategories: () => void;
  categories: Category[];
  resultCount: number;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

/**
 * Option row rendered inside the filter sheet. A `Button` (universal/Compose)
 * kept as a direct child of the sheet's Compose content; `fillMaxWidth` makes
 * it span the sheet.
 */
function SelectableRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Button
      variant="text"
      onPress={onPress}
      modifiers={[fillMaxWidth()]}
      style={{ paddingHorizontal: 0, paddingVertical: 2, borderRadius: 12 }}
    >
      <Row alignment="center" spacing={12}>
        <Text textStyle={{ fontSize: 16, fontWeight: selected ? '600' : '400', color: colors.text }}>
          {label}
        </Text>
        <Spacer flexible />
        {selected ? <Icon name={CHECK_ICON} size={20} color={colors.primary} /> : null}
      </Row>
    </Button>
  );
}

/**
 * Transaction list header: an improved search field (icon + clear) and a
 * Filters button that opens a bottom sheet grouping type/period/category
 * filters (instead of unbounded horizontal chip rows).
 *
 * The toolbar lives in RN layout, so every universal component is bridged via
 * `NativeBlock` (a `Host`) to keep the Compose composition intact.
 */
export function TransactionFilters({
  query,
  onQueryChange,
  type,
  onTypeChange,
  dateFilter,
  onDateFilterChange,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  categoryIds,
  onToggleCategory,
  onClearCategories,
  categories,
  resultCount,
  hasActiveFilters,
  onClearAll,
}: TransactionFiltersProps) {
  const { t, lang } = useI18n();
  const colors = useTheme();
  const [open, setOpen] = useState(false);

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: t('txns.all') },
    { value: 'expense', label: t('txns.expense') },
    { value: 'income', label: t('txns.income') },
  ];

  const dateOptions: { value: DateFilter; label: string }[] = [
    { value: 'all', label: t('txns.all') },
    { value: 'today', label: t('txns.today') },
    { value: 'week', label: t('txns.week') },
    { value: 'month', label: t('txns.month') },
    { value: 'custom', label: t('txns.custom') },
  ];

  const activeFilterCount =
    (type !== 'all' ? 1 : 0) +
    (dateFilter !== 'all' || customFrom || customTo ? 1 : 0) +
    (categoryIds.length > 0 ? 1 : 0);

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: 12,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
        }}
      >
        <NativeBlock>
          <Icon name={SEARCH_ICON} size={16} color={colors.textSecondary} />
        </NativeBlock>
        <NativeBlock matchContents={false} style={{ flex: 1 }}>
          <TextInput
            onChangeText={onQueryChange}
            placeholder={t('txns.searchPh')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            textStyle={{ fontSize: 15, color: colors.text }}
            style={{ height: 44 }}
          />
        </NativeBlock>
        {query ? (
          <Pressable onPress={() => onQueryChange('')} hitSlop={8}>
            <NativeBlock>
              <Icon name={X_ICON} size={16} color={colors.textSecondary} />
            </NativeBlock>
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <NativeBlock>
          <Button
            variant={activeFilterCount > 0 ? 'filled' : 'outlined'}
            onPress={() => setOpen(true)}
            style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 }}
          >
            <Icon name={FUNNEL_ICON} size={16} />
            <Text textStyle={{ fontSize: 14, fontWeight: '500' }}>{t('txns.filters')}</Text>
            {activeFilterCount > 0 ? (
              <Text textStyle={{ fontSize: 14, fontWeight: '700' }}>
                {` (${activeFilterCount})`}
              </Text>
            ) : null}
          </Button>
        </NativeBlock>
        {hasActiveFilters ? (
          <Pressable onPress={onClearAll} hitSlop={8}>
            <NativeBlock>
              <Text textStyle={{ fontSize: 14, color: colors.destructive }}>
                {t('txns.clearFilters')}
              </Text>
            </NativeBlock>
          </Pressable>
        ) : null}
      </View>

      <BottomSheet
        isPresented={open}
        onDismiss={() => setOpen(false)}
        contentPadding={{ left: 24, right: 24, top: 8, bottom: 20 }}
      >
        <Column spacing={16}>
          <Row alignment="center" spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
              {t('txns.filters')}
            </Text>
            <Spacer flexible />
            {hasActiveFilters ? (
              <Button variant="text" label={t('txns.clearFilters')} onPress={onClearAll} />
            ) : null}
          </Row>

          <ScrollView>
            <Column spacing={20}>
              <Column spacing={8}>
                <Text textStyle={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                  {t('txns.type')}
                </Text>
                {typeOptions.map((option) => (
                  <SelectableRow
                    key={option.value}
                    label={option.label}
                    selected={type === option.value}
                    onPress={() => {
                      void hapticSelection();
                      onTypeChange(option.value);
                    }}
                  />
                ))}
              </Column>

              <Column spacing={8}>
                <Text textStyle={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                  {t('txns.period')}
                </Text>
                {dateOptions.map((option) => (
                  <SelectableRow
                    key={option.value}
                    label={option.label}
                    selected={dateFilter === option.value}
                    onPress={() => {
                      void hapticSelection();
                      onDateFilterChange(option.value);
                    }}
                  />
                ))}
                {dateFilter === 'custom' ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <DateTimeField
                      mode="date"
                      value={customFrom}
                      onChange={onCustomFrom}
                      label={t('common.from')}
                      placeholder={t('common.selectDate')}
                      style={{ flex: 1 }}
                    />
                    <DateTimeField
                      mode="date"
                      value={customTo}
                      onChange={onCustomTo}
                      label={t('common.to')}
                      placeholder={t('common.selectDate')}
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : null}
              </Column>

              <Column spacing={8}>
                <Text textStyle={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                  {t('txns.categories')}
                </Text>
                <SelectableRow
                  label={t('txns.allCategories')}
                  selected={categoryIds.length === 0}
                  onPress={() => {
                    void hapticSelection();
                    onClearCategories();
                  }}
                />
                {categories.map((category) => (
                  <SelectableRow
                    key={category.id}
                    label={categoryDisplayName(category, lang)}
                    selected={categoryIds.includes(category.id)}
                    onPress={() => {
                      void hapticSelection();
                      onToggleCategory(category.id);
                    }}
                  />
                ))}
              </Column>
            </Column>
          </ScrollView>

          <Button
            variant="filled"
            label={t('txns.showResults', { count: String(resultCount) })}
            onPress={() => setOpen(false)}
            modifiers={[fillMaxWidth()]}
            style={{ height: 52, borderRadius: 12 }}
          />
        </Column>
      </BottomSheet>
    </View>
  );
}