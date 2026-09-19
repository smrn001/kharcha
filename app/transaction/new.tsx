import { CategoryPicker } from '@/components/category-picker';
import { DateTimeField } from '@/components/date-time-field';
import { LoadingView } from '@/components/loading-view';
import { NativeBlock } from '@/components/native-block';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Button, FieldGroup, Host, Text, TextInput } from '@expo/ui';
import { useCategories } from '@/hooks/use-categories';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { getTransactionById, createTransaction, updateTransaction } from '@/lib/db/transactions';
import { ensureDefaultAccount } from '@/lib/db/accounts';
import { minorUnitsToInput, parseAmountToMinorUnits } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { useSQLiteContext } from 'expo-sqlite';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import type { TransactionType } from '@/types';

export default function NewTransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ?? null;

  const db = useSQLiteContext();
  const colors = useTheme();
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
      style={{ flex: 1 }}
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
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 20, paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SegmentedControl
          values={[t('add.expense'), t('add.income')]}
          selectedIndex={type === 'income' ? 1 : 0}
          onValueChange={(label) => {
            handleTypeChange(label === t('add.income') ? 'income' : 'expense');
          }}
        />

        {/* Host must directly wrap FieldGroup (Android Compose contract). */}
        {loadingEdit ? (
          <LoadingView label={t('common.loading')} />
        ) : (
          <Host>
            <FieldGroup>
              <FieldGroup.Section title={t('add.amount')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <NativeBlock>
                    <Text textStyle={{ fontSize: 24, fontWeight: '600', color: colors.primary }}>
                      {settings.currency}
                    </Text>
                  </NativeBlock>
                  <NativeBlock matchContents={false} style={{ flex: 1 }}>
                    <TextInput
                      keyboardType="decimal-pad"
                      defaultValue={amountInput}
                      onChangeText={handleAmountChange}
                      placeholder="0.00"
                      placeholderTextColor={colors.textSecondary}
                      textStyle={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}
                      style={{ height: 64 }}
                    />
                  </NativeBlock>
                </View>
              </FieldGroup.Section>

              <FieldGroup.Section title={t('add.category')}>
                <CategoryPicker categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
              </FieldGroup.Section>

              <FieldGroup.Section title={t('add.dateTime')}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <DateTimeField mode="date" value={date} onChange={setDate} style={{ flex: 1 }} />
                  <DateTimeField mode="time" value={date} onChange={setDate} style={{ flex: 1 }} />
                </View>
              </FieldGroup.Section>

              <FieldGroup.Section title={t('add.details')}>
                <TextInput
                  defaultValue={title}
                  onChangeText={setTitle}
                  placeholder={t('add.titlePh')}
                  placeholderTextColor={colors.textSecondary}
                  textStyle={{ fontSize: 16, color: colors.text }}
                  style={{ height: 56 }}
                />
                <TextInput
                  defaultValue={note}
                  onChangeText={setNote}
                  placeholder={t('add.notePh')}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  textStyle={{ fontSize: 16, color: colors.text }}
                  style={{ height: 96 }}
                />
              </FieldGroup.Section>
            </FieldGroup>
          </Host>
        )}

        {error ? (
          <NativeBlock>
            <Text textStyle={{ fontSize: 14, color: colors.destructive }}>{error}</Text>
          </NativeBlock>
        ) : null}

        <NativeBlock matchContents={false}>
          <Button
            label={saving ? t('common.saving') : editingId ? t('common.saveChanges') : t('add.save')}
            onPress={handleSave}
            disabled={saving || loadingEdit}
            style={{ borderRadius: 12, height: 52 }}
          />
        </NativeBlock>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}