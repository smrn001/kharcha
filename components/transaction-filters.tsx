import { DateTimeField } from '@/components/date-time-field';
import { FilterChips } from '@/components/filter-chips';
import { FilterSheet, FilterSheetFooter } from '@/components/filter-sheet';
import { FilterSheetRow } from '@/components/filter-sheet-row';
import { NativeBlock } from '@/components/native-block';
import { SearchField } from '@/components/search-field';
import { Column, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { categoryDisplayName } from '@/lib/i18n';
import { hapticSelection } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import type { Account, Category } from '@/types';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

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

function SheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useTheme();
  return (
    <Column spacing={8}>
      <Text textStyle={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
        {title}
      </Text>
      {children}
    </Column>
  );
}

function AmountBound({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const colors = useTheme();
  return (
    <NativeBlock matchContents={false} style={{ flex: 1 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
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
  );
}

/**
 * Transactions header: a pill search field and a horizontally scrollable row
 * of quick Material 3 filter chips (All / Income / Expenses / Today /
 * Filters). Filters opens a bottom sheet with date, category, account and
 * amount-range filters.
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
      <SearchField value={query} onChangeText={onQueryChange} placeholder={t('txns.searchPh')} />

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

      <FilterSheet
        title={t('txns.filters')}
        open={open}
        onDismiss={() => setOpen(false)}
        footer={
          <FilterSheetFooter
            resetLabel={hasActiveFilters ? t('txns.reset') : undefined}
            onReset={hasActiveFilters ? onClearAll : undefined}
            actionLabel={t('txns.showResults', { count: String(resultCount) })}
            onAction={() => setOpen(false)}
          />
        }
      >
        <SheetSection title={t('txns.period')}>
          {dateOptions.map((option) => (
            <FilterSheetRow
              key={option.value}
              label={option.label}
              selected={dateFilter === option.value}
              onPress={() => onDateFilterChange(option.value)}
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
        </SheetSection>

        <SheetSection title={t('txns.categories')}>
          <FilterSheetRow
            label={t('txns.allCategories')}
            selected={categoryIds.length === 0}
            onPress={onClearCategories}
          />
          {categories.map((category) => (
            <FilterSheetRow
              key={category.id}
              label={categoryDisplayName(category, lang)}
              selected={categoryIds.includes(category.id)}
              onPress={() => onToggleCategory(category.id)}
            />
          ))}
        </SheetSection>

        <SheetSection title={t('txns.account')}>
          <FilterSheetRow
            label={t('txns.allAccounts')}
            selected={accountId == null}
            onPress={() => onAccountChange(null)}
          />
          {accounts.map((account) => (
            <FilterSheetRow
              key={account.id}
              label={account.name}
              selected={accountId === account.id}
              onPress={() => onAccountChange(account.id)}
            />
          ))}
        </SheetSection>

        <SheetSection title={t('txns.amount')}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <AmountBound value={minAmount} onChange={onMinAmountChange} placeholder={t('txns.min')} />
            <AmountBound value={maxAmount} onChange={onMaxAmountChange} placeholder={t('txns.max')} />
          </View>
        </SheetSection>
      </FilterSheet>
    </View>
  );
}
