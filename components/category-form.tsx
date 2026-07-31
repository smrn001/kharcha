import { SegmentedControl } from '@/components/segmented-control';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CATEGORY_ICONS, categoryIcon } from '@/lib/category-icons';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { NewCategory, TransactionType } from '@/types';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

const INPUT_CLASS =
  'h-12 rounded-md border border-input bg-background px-3 text-base text-foreground';

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

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
      >
        <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={handleTypeChange} />

        <View className="gap-2">
          <Text className="text-sm font-medium">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Coffee"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Category name"
            className={INPUT_CLASS}
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium">Icon</Text>
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
                    'h-11 w-11 items-center justify-center rounded-full border',
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
        </View>

        {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

        {footer}
      </ScrollView>

      <View className="border-border border-t bg-background px-4 py-3">
        <Button onPress={handleSubmit} disabled={submitting || !name.trim()}>
          <Text className="text-primary-foreground font-medium">
            {submitting ? 'Saving…' : submitLabel}
          </Text>
        </Button>
      </View>
    </View>
  );
}
