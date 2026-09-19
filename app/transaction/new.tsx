import { CategoryPicker } from '@/components/category-picker';
import { Host, FieldGroup } from '@expo/ui';
import { DateTimeField } from '@/components/date-time-field';
import { SegmentedControl } from '@/components/segmented-control';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { getTransactionById, createTransaction, updateTransaction } from '@/lib/db/transactions';
import { ensureDefaultAccount } from '@/lib/db/accounts';
import { minorUnitsToInput, parseAmountToMinorUnits } from '@/lib/format';
import { THEME } from '@/lib/theme';
import { useSQLiteContext } from 'expo-sqlite';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import type { TransactionType } from '@/types';

const INPUT_CLASS =
  'h-12 rounded-md border border-input bg-background px-3 text-base text-foreground';

export default function NewTransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ?? null;

  const db = useSQLiteContext();
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const { settings } = useSettings();
  const { t } = useI18n();

  const [type, setType] = useState<TransactionType>(settings.defaultTransactionType);
  const [amountInput, setAmountInput] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { categories } = useCategories(type);

  useEffect(() => {
    if (!editingId) {
      let active = true;
      ensureDefaultAccount(db)
        .then((account) => {
          if (active) setAccountId(account.id);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }
    let active = true;
    getTransactionById(db, editingId).then((transaction) => {
      if (!active || !transaction) return;
      setType(transaction.type);
      setAmountInput(minorUnitsToInput(transaction.amount));
      setCategoryId(transaction.categoryId ?? null);
      setAccountId(transaction.accountId);
      setTitle(transaction.title ?? '');
      setNote(transaction.note ?? '');
      setDate(new Date(transaction.date));
      setLoadingEdit(false);
    });
    return () => {
      active = false;
    };
  }, [db, editingId]);

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    setCategoryId(null);
  };

  const handleAmountChange = (input: string) => {
    const sanitized = input.replace(/[^0-9.]/g, '');
    setAmountInput(sanitized);
  };

  const handleSave = async () => {
    const amount = parseAmountToMinorUnits(amountInput);
    if (amount === null || amount <= 0) {
      setError(t('add.errAmount'));
      return;
    }
    if (!categoryId) {
      setError(t('add.errCategory'));
      return;
    }
    if (!accountId) {
      setError(t('add.errAccounts'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        type,
        amount,
        accountId,
        categoryId,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        date: date.toISOString(),
      };
      if (editingId) {
        await updateTransaction(db, editingId, payload);
      } else {
        await createTransaction(db, payload);
      }
      void hapticSuccess();
      router.back();
    } catch {
      void hapticError();
      setError(t('add.errSave'));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: editingId ? t('add.editTitle') : t('add.addTitle'),
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-8"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SegmentedControl
          options={[
            { value: 'expense', label: t('add.expense') },
            { value: 'income', label: t('add.income') },
          ]}
          value={type}
          onChange={handleTypeChange}
        />

        {/* Host must directly wrap FieldGroup (Android Compose contract). */}
        <Host>
          <FieldGroup>
            <FieldGroup.Section title={t('add.amount')}>
            <View className="flex-row items-center gap-2">
              <Text className="text-3xl font-bold">{settings.currency}</Text>
              <TextInput
                keyboardType="decimal-pad"
                value={amountInput}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                accessibilityLabel={t('add.amount')}
                className="text-foreground h-16 flex-1 text-3xl font-bold"
              />
            </View>
          </FieldGroup.Section>
          <FieldGroup.Section title={t('add.category')}>
            {loadingEdit ? (
              <Text variant="muted">{t('common.loading')}</Text>
            ) : (
              <CategoryPicker categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
            )}
          </FieldGroup.Section>
          <FieldGroup.Section title={t('add.dateTime')}>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DateTimeField mode="date" value={date} onChange={setDate} />
              </View>
              <View className="flex-1">
                <DateTimeField mode="time" value={date} onChange={setDate} />
              </View>
            </View>
          </FieldGroup.Section>
          <FieldGroup.Section title={t('add.details')}>
            <View className="gap-3">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t('add.titlePh')}
                placeholderTextColor={colors.mutedForeground}
                accessibilityLabel={t('add.titleLabel')}
                className={INPUT_CLASS}
              />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t('add.notePh')}
                placeholderTextColor={colors.mutedForeground}
                accessibilityLabel={t('add.noteLabel')}
                className={INPUT_CLASS}
              />
            </View>
          </FieldGroup.Section>
          </FieldGroup>
        </Host>

        {error ? <Text selectable className="text-destructive text-sm">{error}</Text> : null}

        <Button onPress={handleSave} disabled={saving} className="mt-2">
          <Text className="text-primary-foreground font-medium">
            {saving ? t('common.saving') : editingId ? t('common.saveChanges') : t('add.save')}
          </Text>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
