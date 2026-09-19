import { BottomSheet, Button, Text } from '@expo/ui';
import { formatFullDate, formatTime } from '@/lib/dates';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useAppColors } from '@/lib/colors';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

export interface DateTimeFieldProps {
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
}

export function DateTimeField({
  mode,
  value,
  onChange,
  label,
  placeholder,
}: DateTimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const colors = useAppColors();

  const display = value
    ? mode === 'date'
      ? formatFullDate(value.toISOString())
      : formatTime(value.toISOString())
    : (placeholder ?? 'Select');

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode,
        onValueChange: (_event, selected) => {
          if (selected) onChange(selected);
        },
      });
    } else {
      setShowPicker(true);
    }
  };

  return (
    <View>
      <Pressable
        onPress={openPicker}
        style={{
          minHeight: 48,
          justifyContent: 'center',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.separator,
          paddingHorizontal: 12,
          gap: 2,
        }}
      >
        {label ? (
          <Text textStyle={{ fontSize: 12, color: colors.mutedForeground }}>{label}</Text>
        ) : null}
        <Text
          textStyle={{
            fontSize: 14,
            color: value ? undefined : colors.mutedForeground,
          }}
        >
          {display}
        </Text>
      </Pressable>

      <BottomSheet isPresented={showPicker} onDismiss={() => setShowPicker(false)}>
        <View style={{ gap: 16 }}>
          <DateTimePicker
            value={value ?? new Date()}
            mode={mode}
            display="spinner"
            onChange={(_event, selected) => {
              if (selected) onChange(selected);
            }}
          />
          <Button label="Done" onPress={() => setShowPicker(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}