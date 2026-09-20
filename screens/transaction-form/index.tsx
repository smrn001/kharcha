import { CategoryPicker } from '@/components/category-picker';
import { DateTimeField } from '@/components/date-time-field';
import { FormCard } from '@/components/form-card';
import { LoadingView } from '@/components/loading-view';
import { NativeBlock } from '@/components/native-block';
import { AmountInput } from '@/screens/transaction-form/components/amount-input';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Button, Text, TextInput } from '@expo/ui';
import { useTransactionForm } from '@/hooks/use-transaction-form';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { Stack } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

export default function TransactionFormScreen({ editingId }: { editingId: string | null }) {
  const { t } = useI18n();
  const colors = useTheme();
  const form = useTransactionForm(editingId);

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
        contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SegmentedControl
          values={[t('add.expense'), t('add.income')]}
          selectedIndex={form.type === 'income' ? 1 : 0}
          onValueChange={(label) => {
            form.handleTypeChange(label === t('add.income') ? 'income' : 'expense');
          }}
        />

        {form.loadingEdit ? (
          <LoadingView label={t('common.loading')} />
        ) : (
          <>
            <AmountInput
              title={t('add.amount')}
              currency={form.currency}
              value={form.amountInput}
              onValueChange={form.handleAmountChange}
            />

            <FormCard title={t('add.category')}>
              <CategoryPicker
                categories={form.categories}
                selectedId={form.categoryId}
                onSelect={form.setCategoryId}
              />
            </FormCard>

            <FormCard title={t('add.dateTime')}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <DateTimeField mode="date" value={form.date} onChange={form.setDate} style={{ flex: 1 }} />
                <DateTimeField mode="time" value={form.date} onChange={form.setDate} style={{ flex: 1 }} />
              </View>
            </FormCard>

            <FormCard title={t('add.details')}>
              <NativeBlock matchContents={false} style={{ flex: 1 }}>
                <TextInput
                  defaultValue={form.title}
                  onChangeText={form.setTitle}
                  placeholder={t('add.titlePh')}
                  placeholderTextColor={colors.textSecondary}
                  textStyle={{ fontSize: 16, color: colors.text }}
                  style={{ height: 56 }}
                />
              </NativeBlock>
              <NativeBlock matchContents={false} style={{ flex: 1 }}>
                <TextInput
                  defaultValue={form.note}
                  onChangeText={form.setNote}
                  placeholder={t('add.notePh')}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  textStyle={{ fontSize: 16, color: colors.text }}
                  style={{ height: 96 }}
                />
              </NativeBlock>
            </FormCard>
          </>
        )}

        {form.error ? (
          <NativeBlock>
            <Text textStyle={{ fontSize: 14, color: colors.destructive }}>{form.error}</Text>
          </NativeBlock>
        ) : null}

        <NativeBlock matchContents={false}>
          <Button
            label={
              form.saving
                ? t('common.saving')
                : editingId
                  ? t('common.saveChanges')
                  : t('add.save')
            }
            onPress={form.handleSave}
            disabled={form.saving || form.loadingEdit}
            style={{ borderRadius: 12, height: 52 }}
          />
        </NativeBlock>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}