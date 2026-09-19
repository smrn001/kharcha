import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Button, FieldGroup, Host, Icon, Text, TextInput } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { CATEGORY_ICONS, categoryIcon } from '@/lib/category-icons';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/hooks/use-i18n';
import type { NewCategory, TransactionType } from '@/types';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

function useTypeOptions(): { value: TransactionType; label: string }[] {
  const { t } = useI18n();
  return [
    { value: 'expense', label: t('cat.formTypeExpense') },
    { value: 'income', label: t('cat.formTypeIncome') },
  ];
}

export function CategoryForm({
  initial,
  submitLabel,
  submitting,
  error,
  onSubmit,
  footer,
}: {
  initial?: { name: string; icon?: string; type: TransactionType };
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: NewCategory) => void;
  footer?: React.ReactNode;
}) {
  const colors = useTheme();
  const { t } = useI18n();
  const typeOptions = useTypeOptions();
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState<string | undefined>(initial?.icon);
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    if (icon) setIcon(undefined);
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, icon, type });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 20, paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SegmentedControl
          values={typeOptions.map((o) => o.label)}
          selectedIndex={type === 'income' ? 1 : 0}
          onValueChange={(label) => {
            const next = typeOptions.find((o) => o.label === label)?.value;
            if (next) handleTypeChange(next);
          }}
        />

        <Host>
          <FieldGroup>
            <FieldGroup.Section title={t('cat.formName')}>
              <TextInput
                defaultValue={initial?.name ?? ''}
                onChangeText={setName}
                placeholder={t('cat.formNamePh')}
                autoCapitalize="words"
                textStyle={{ fontSize: 16 }}
              />
            </FieldGroup.Section>

            <FieldGroup.Section title={t('cat.formIcon')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 }}>
                {CATEGORY_ICONS.map((iconName) => {
                  const selected = icon === iconName;
                  return (
                    <NativeBlock key={iconName}>
                      <Button
                        variant={selected ? 'filled' : 'text'}
                        onPress={() => setIcon(selected ? undefined : iconName)}
                        style={{ width: 44, height: 44, borderRadius: 22, padding: 0 }}
                      >
                        <Icon name={categoryIcon(iconName)} size={18} />
                      </Button>
                    </NativeBlock>
                  );
                })}
              </View>
            </FieldGroup.Section>
          </FieldGroup>
        </Host>

        {error ? (
          <NativeBlock>
            <Text textStyle={{ fontSize: 14, color: colors.destructive }}>{error}</Text>
          </NativeBlock>
        ) : null}

        {footer}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <NativeBlock matchContents={false}>
          <Button
            label={submitting ? t('common.saving') : submitLabel}
            onPress={handleSubmit}
            disabled={submitting || !name.trim()}
          />
        </NativeBlock>
      </View>
    </View>
  );
}