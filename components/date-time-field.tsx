import { BottomSheet, Button, Column, Text } from '@expo/ui';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { NativeBlock } from '@/components/native-block';
import { formatFullDate, formatTime } from '@/lib/dates';
import { useTheme } from '@/lib/theme';
import { useState } from 'react';
import { Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

export interface DateTimeFieldProps {
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

export function DateTimeField({
  mode,
  value,
  onChange,
  label,
  placeholder,
  style,
}: DateTimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const colors = useTheme();

  const display = value
    ? mode === 'date'
      ? formatFullDate(value.toISOString())
      : formatTime(value.toISOString())
    : (placeholder ?? 'Select');

  const openPicker = () => setShowPicker(true);

  return (
    <View style={style}>
      <Pressable
        onPress={openPicker}
        style={{
          minHeight: 48,
          justifyContent: 'center',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          gap: 2,
        }}
      >
        <NativeBlock matchContents={false}>
          <Column spacing={2}>
            {label ? (
              <Text textStyle={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
            ) : null}
            <Text
              textStyle={{
                fontSize: 14,
                color: value ? colors.text : colors.textSecondary,
              }}
            >
              {display}
            </Text>
          </Column>
        </NativeBlock>
      </Pressable>

      {/* Android: a declarative M3 dialog that opens on mount (unmount in
          response to select or dismiss). iOS ignores `presentation` and always
          renders inline, so it lives inside the sheet. */}
      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode={mode}
          presentation="dialog"
          onValueChange={(_event, selected) => {
            setShowPicker(false);
            onChange(selected);
          }}
          onDismiss={() => setShowPicker(false)}
        />
      ) : null}

      {Platform.OS !== 'android' ? (
        <BottomSheet isPresented={showPicker} onDismiss={() => setShowPicker(false)}>
          <View style={{ gap: 16 }}>
            <DateTimePicker
              value={value ?? new Date()}
              mode={mode}
              display="spinner"
              onValueChange={(_event, selected) => {
                onChange(selected);
              }}
            />
            <NativeBlock>
              <Button label="Done" onPress={() => setShowPicker(false)} />
            </NativeBlock>
          </View>
        </BottomSheet>
      ) : null}
    </View>
  );
}