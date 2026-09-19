import { DateTimeField } from '@/components/date-time-field';
import { FilterChips } from '@/components/filter-chips';
import { NativeBlock } from '@/components/native-block';
import { BottomSheet, Button, Column, Icon, Row, ScrollView, Spacer, Text } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { useI18n } from '@/hooks/use-i18n';
import { categoryDisplayName } from '@/lib/i18n';
import { hapticSelection } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import type { Account, Category } from '@/types';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

const SEARCH_ICON = Icon.select({
  ios: 'magnifyingglass',
  android: import('@expo/material-symbols/search.xml'),
});

const X_ICON = Icon.select({
  ios: 'xmark',
  android: import('@expo/material-symbols/close.xml'),
});

const CHECK_ICON = Icon.select({
  ios: 'checkmark',
  android: import('@expo/material-symbols/check.xml'),
});

export type TypeFilter = 'all' | 'expense' | 'income';
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
  accountId: string | null;
  onAccountChange: (id: string | null) => void;
  accounts: Account[];
  minAmount: string;
  maxAmount: string;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;
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
 * Transactions header: a pill search field (search + clear) and a horizontally
 * scrollable row of quick Material 3 filter chips (All / Income / Expenses /
 * Today / Filters). Filters opens a bottom sheet with date, category, account
 * and amount-range filters.
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
  accountId,
  onAccountChange,
  accounts,
  minAmount,
  maxAmount,
  onMinAmountChange,
  onMaxAmountChange,
  resultCount,
  hasActiveFilters,
  onClearAll,
}: TransactionFiltersProps) {
  const { t, lang } = useI18n();
  const colors = useTheme();
  const [open, setOpen] = useState(false);

  const dateOptions: { value: DateFilter; label: string }[] = [
    { value: 'all', label: t('txns.all') },
    { value: 'today', label: t('txns.today') },
    { value: 'week', label: t('txns.week') },
    { value: 'month', label: t('txns.month') },
    { value: 'custom', label: t('txns.custom') },
  ];

  const dateAdvanced = dateFilter === 'week' || dateFilter === 'month' || dateFilter === 'custom';
  const amountActive = minAmount.trim().length > 0 || maxAmount.trim().length > 0;
  const advancedCount =
    (dateAdvanced ? 1 : 0) +
    (categoryIds.length > 0 ? 1 : 0) +
    (accountId != null ? 1 : 0) +
    (amountActive ? 1 : 0);

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: 22,
          backgroundColor: colors.surfaceContainer,
          paddingHorizontal: 16,
        }}
      >
        <NativeBlock>
          <Icon name={SEARCH_ICON} size={16} color={colors.textSecondary} />
        </NativeBlock>
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={t('txns.searchPh')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          textAlignVertical="center"
          style={{
            flex: 1,
            height: 44,
            paddingVertical: 0,
            fontSize: 15,
            color: colors.text,
          }}
        />
        {query ? (
          <Pressable onPress={() => onQueryChange('')} hitSlop={8}>
            <NativeBlock>
              <Icon name={X_ICON} size={16} color={colors.textSecondary} />
            </NativeBlock>
          </Pressable>
        ) : null}
      </View>

      <FilterChips
        chips={[
          {
            key: 'all',
            label: t('txns.all'),
            selected: type === 'all' && dateFilter === 'all',
            onPress: () => {
              void hapticSelection();
              onTypeChange('all');
              onDateFilterChange('all');
            },
          },
          {
            key: 'income',
            label: t('txns.income'),
            selected: type === 'income',
            onPress: () => {
              void hapticSelection();
              onTypeChange('income');
            },
          },
          {
            key: 'expense',
            label: t('txns.expense'),
            selected: type === 'expense',
            onPress: () => {
              void hapticSelection();
              onTypeChange('expense');
            },
          },
          {
            key: 'today',
            label: t('txns.today'),
            selected: dateFilter === 'today',
            onPress: () => {
              void hapticSelection();
              onDateFilterChange('today');
            },
          },
          {
            key: 'filters',
            label: t('txns.filters'),
            selected: advancedCount > 0,
            badgeCount: advancedCount,
            onPress: () => {
              void hapticSelection();
              setOpen(true);
            },
          },
        ]}
      />

      <BottomSheet
        isPresented={open}
        onDismiss={() => setOpen(false)}
        contentPadding={{ left: 24, right: 24, top: 8, bottom: 20 }}
      >
        <Column spacing={16}>
          <Text textStyle={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
            {t('txns.filters')}
          </Text>

          <ScrollView>
            <Column spacing={20}>
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

              <Column spacing={8}>
                <Text textStyle={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                  {t('txns.account')}
                </Text>
                <SelectableRow
                  label={t('txns.allAccounts')}
                  selected={accountId == null}
                  onPress={() => {
                    void hapticSelection();
                    onAccountChange(null);
                  }}
                />
                {accounts.map((account) => (
                  <SelectableRow
                    key={account.id}
                    label={account.name}
                    selected={accountId === account.id}
                    onPress={() => {
                      void hapticSelection();
                      onAccountChange(account.id);
                    }}
                  />
                ))}
              </Column>

              <Column spacing={8}>
                <Text textStyle={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                  {t('txns.amount')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <NativeBlock matchContents={false} style={{ flex: 1 }}>
                    <TextInput
                      value={minAmount}
                      onChangeText={onMinAmountChange}
                      placeholder={t('txns.min')}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      textAlignVertical="center"
                      style={{
                        height: 48,
                        borderRadius: 10,
                        backgroundColor: colors.surfaceContainer,
                        paddingVertical: 0,
                        fontSize: 15,
                        color: colors.text,
                      }}
                    />
                  </NativeBlock>
                  <NativeBlock matchContents={false} style={{ flex: 1 }}>
                    <TextInput
                      value={maxAmount}
                      onChangeText={onMaxAmountChange}
                      placeholder={t('txns.max')}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      textAlignVertical="center"
                      style={{
                        height: 48,
                        borderRadius: 10,
                        backgroundColor: colors.surfaceContainer,
                        paddingVertical: 0,
                        fontSize: 15,
                        color: colors.text,
                      }}
                    />
                  </NativeBlock>
                </View>
              </Column>
            </Column>
          </ScrollView>

          <Row alignment="center" spacing={8}>
            {hasActiveFilters ? (
              <Button variant="text" label={t('txns.reset')} onPress={onClearAll} />
            ) : null}
            <Spacer flexible />
            <Button
              variant="filled"
              label={t('txns.showResults', { count: String(resultCount) })}
              onPress={() => setOpen(false)}
              style={{ height: 48, borderRadius: 12 }}
            />
          </Row>
        </Column>
      </BottomSheet>
    </View>
  );
}