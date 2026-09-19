import { SegmentedControl } from '@/components/segmented-control';
import { Host, FieldGroup } from '@expo/ui';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CATEGORY_ICONS, categoryIcon } from '@/lib/category-icons';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import type { NewCategory, TransactionType } from '@/types';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

const INPUT_CLASS =
  'h-12 rounded-md border border-input bg-background px-3 text-base text-foreground';

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
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];

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
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-8"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SegmentedControl options={typeOptions} value={type} onChange={handleTypeChange} />

        {/* Host must directly wrap FieldGroup (Android Compose contract). */}
        <Host>
        <FieldGroup>
          <FieldGroup.Section title={t('cat.formName')}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('cat.formNamePh')}
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel={t('cat.formNameLabel')}
              className={INPUT_CLASS}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title={t('cat.formIcon')}>
            <View className="flex-row flex-wrap gap-2">
            {CATEGORY_ICONS.map((iconName) => {
              const selected = icon === iconName;
              const IconComponent = categoryIcon(iconName);
              return (
                <Pressable
                  key={iconName}
                  onPress={() => setIcon(selected ? undefined : iconName)}
                  accessibilityLabel={iconName}
                  className={cn(
                    'h-11 w-11 items-center justify-center rounded-full border active:opacity-70',
                    selected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card active:bg-muted'
                  )}
                >
                  <Icon
                    as={IconComponent}
                    size={18}
                    className={cn(selected ? 'text-primary' : 'text-muted-foreground')}
                  />
                </Pressable>
              );
            })}
          </View>
          </FieldGroup.Section>
        </FieldGroup>
        </Host>

        {error ? <Text selectable className="text-destructive text-sm">{error}</Text> : null}

        {footer}
      </ScrollView>

      <View className="border-border border-t bg-background px-4 py-3">
        <Button onPress={handleSubmit} disabled={submitting || !name.trim()}>
          <Text className="text-primary-foreground font-medium">
            {submitting ? t('common.saving') : submitLabel}
          </Text>
        </Button>
      </View>
    </View>
  );
}
