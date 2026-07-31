import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatFullDate, formatTime } from '@/lib/dates';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

export interface DateTimeFieldProps {
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function DateTimeField({
  mode,
  value,
  onChange,
  label,
  placeholder,
  className,
}: DateTimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

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
    <View className={className}>
      <Pressable
        onPress={openPicker}
        className="border-input h-12 justify-center rounded-md border px-3"
      >
        {label ? (
          <Text variant="muted" className="text-xs">
            {label}
          </Text>
        ) : null}
        <Text className={value ? 'text-sm' : 'text-muted-foreground text-sm'}>{display}</Text>
      </Pressable>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowPicker(false)}>
          <Pressable className="border-border bg-card rounded-t-xl border p-4">
            <DateTimePicker
              value={value ?? new Date()}
              mode={mode}
              display="spinner"
              onValueChange={(_event, selected) => {
                if (selected) onChange(selected);
              }}
            />
            <Button onPress={() => setShowPicker(false)}>
              <Text className="text-primary-foreground font-medium">Done</Text>
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
