import { BottomSheet, Button, Column, Icon, Row, ScrollView, Spacer, Text } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { CHECK_ICON } from '@/lib/icons';
import { hapticSelection } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import type { ReactNode } from 'react';

export interface SelectionOption<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * Single-select list inside the universal `BottomSheet`, used whenever a
 * setting needs a popup choice (theme, currency, calendar, …). Selected option
 * gets a primary check. Swipe down or `footer` (e.g. a Done button) dismisses.
 *
 * Everything inside the sheet is a universal (Compose) component — an RN `View`
 * between the `Host` and these would break the Compose composition boundary.
 */
export function SelectionSheet<T extends string | number>({
  open,
  onOpenChange,
  title,
  options,
  selected,
  onSelect,
  closeOnSelect = true,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: readonly SelectionOption<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  closeOnSelect?: boolean;
  footer?: ReactNode;
}) {
  const colors = useTheme();

  return (
    <BottomSheet
      isPresented={open}
      onDismiss={() => onOpenChange(false)}
      contentPadding={{ left: 24, right: 24, top: 8, bottom: 20 }}
    >
      <Column spacing={4}>
        <Text style={{ paddingTop: 8, paddingBottom: 2 }} textStyle={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
          {title}
        </Text>
        <ScrollView>
          <Column spacing={2}>
            {options.map((option) => {
              const isSelected = option.value === selected;
              return (
                <Button
                  key={`${option.value}`}
                  variant="text"
                  onPress={() => {
                    if (!isSelected) void hapticSelection();
                    onSelect(option.value);
                    if (closeOnSelect) onOpenChange(false);
                  }}
                  modifiers={[fillMaxWidth()]}
                  style={{ paddingHorizontal: 0, paddingVertical: 4, borderRadius: 12 }}
                >
                  <Row alignment="center" spacing={12}>
                    <Column spacing={2}>
                      <Text
                        textStyle={{
                          fontSize: 16,
                          fontWeight: isSelected ? '600' : '400',
                          color: colors.text,
                        }}
                      >
                        {option.label}
                      </Text>
                      {option.hint ? (
                        <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>{option.hint}</Text>
                      ) : null}
                    </Column>
                    <Spacer flexible />
                    {isSelected ? <Icon name={CHECK_ICON} size={20} color={colors.primary} /> : null}
                  </Row>
                </Button>
              );
            })}
          </Column>
        </ScrollView>
        {footer}
      </Column>
    </BottomSheet>
  );
}