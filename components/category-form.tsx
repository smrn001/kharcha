import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Button, Icon, Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { CATEGORY_ICONS, categoryIcon } from '@/lib/category-icons';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/hooks/use-i18n';
import type { NewCategory, TransactionType } from '@/types';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

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
        contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
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

        <View
          style={{
            backgroundColor: colors.surfaceContainer,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <NativeBlock>
            <Text textStyle={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
              {t('cat.formName')}
            </Text>
          </NativeBlock>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('cat.formNamePh')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            textAlignVertical="center"
            style={{
              height: 56,
              paddingVertical: 0,
              fontSize: 16,
              color: colors.text,
            }}
          />
        </View>

        <View
          style={{
            backgroundColor: colors.surfaceContainer,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <NativeBlock>
            <Text textStyle={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
              {t('cat.formIcon')}
            </Text>
          </NativeBlock>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORY_ICONS.map((iconName) => {
              const selected = icon === iconName;
              return (
                <Pressable
                  key={iconName}
                  onPress={() => setIcon(selected ? undefined : iconName)}
                  style={({ pressed }) => [
                    {
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      backgroundColor: selected ? colors.secondaryContainer : colors.surfaceContainer,
                      borderColor: selected ? colors.secondaryContainer : colors.outline,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <NativeBlock>
                    <Icon
                      name={categoryIcon(iconName)}
                      size={18}
                      color={selected ? colors.onSecondaryContainer : colors.textSecondary}
                    />
                  </NativeBlock>
                </Pressable>
              );
            })}
          </View>
        </View>

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