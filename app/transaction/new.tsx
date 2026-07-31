import { CategoryPicker } from '@/components/category-picker';
import { DateTimeField } from '@/components/date-time-field';
import { Field } from '@/components/form-field';
import { ScreenHeader } from '@/components/screen-header';
import { SegmentedControl } from '@/components/segmented-control';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/hooks/use-categories';
import { useSettings } from '@/hooks/use-settings';
import { getTransactionById, createTransaction, updateTransaction } from '@/lib/db/transactions';
import { minorUnitsToInput, parseAmountToMinorUnits } from '@/lib/format';
import { THEME } from '@/lib/theme';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
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

  const [type, setType] = useState<TransactionType>('expense');
  const [amountInput, setAmountInput] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { categories } = useCategories(type);

  useEffect(() => {
    if (!editingId) return;
    let active = true;
    getTransactionById(db, editingId).then((transaction) => {
      if (!active || !transaction) return;
      setType(transaction.type);
      setAmountInput(minorUnitsToInput(transaction.amount));
      setCategoryId(transaction.categoryId);
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
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!categoryId) {
      setError('Select a category.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        type,
        amount,
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
      router.back();
    } catch {
      setError('Could not save the transaction. Please try again.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title={editingId ? 'Edit Transaction' : 'Add Transaction'} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <SegmentedControl
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
          value={type}
          onChange={handleTypeChange}
        />

        <View className="flex-row items-center gap-2">
          <Text className="text-3xl font-bold">{settings.currency}</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={amountInput}
            onChangeText={handleAmountChange}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Amount"
            className="text-foreground h-16 flex-1 text-3xl font-bold"
          />
        </View>

        {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

        <Field label="Category">
          {loadingEdit ? (
            <Text variant="muted">Loading…</Text>
          ) : (
            <CategoryPicker categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
          )}
        </Field>

        <View className="flex-row gap-3">
          <Field label="Date" className="flex-1">
            <DateTimeField mode="date" value={date} onChange={setDate} />
          </Field>
          <Field label="Time" className="flex-1">
            <DateTimeField mode="time" value={date} onChange={setDate} />
          </Field>
        </View>

        <Field label="Title (optional)">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Lunch"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Title"
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Note (optional)">
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Lunch with friends"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Note"
            className={INPUT_CLASS}
          />
        </Field>

        <Button onPress={handleSave} disabled={saving} className="mt-2">
          <Text className="text-primary-foreground font-medium">
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Save Transaction'}
          </Text>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
