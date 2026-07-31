import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CalendarClock, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import type { ChangeEvent } from 'react';

export interface DateTimeFieldProps {
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

function toInputValue(value: Date, mode: 'date' | 'time'): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  const h = String(value.getHours()).padStart(2, '0');
  const min = String(value.getMinutes()).padStart(2, '0');
  return mode === 'date' ? `${y}-${m}-${d}` : `${h}:${min}`;
}

function fromInputValue(raw: string, base: Date, mode: 'date' | 'time'): Date {
  const next = new Date(base);
  if (mode === 'date') {
    const [y, m, d] = raw.split('-').map(Number);
    next.setFullYear(y, m - 1, d);
  } else {
    const [h, min] = raw.split(':').map(Number);
    next.setHours(h, min, 0, 0);
  }
  return next;
}

export function DateTimeField({
  mode,
  value,
  onChange,
  label,
  placeholder,
  className,
}: DateTimeFieldProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (!raw) return;
    onChange(fromInputValue(raw, value ?? new Date(), mode));
  };

  return (
    <View className={className}>
      {label ? (
        <Text variant="muted" className="mb-1.5 text-xs">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          'border-border bg-background flex-row items-center rounded-md border px-3',
          focused && 'border-ring'
        )}
        style={{ height: 48 }}
      >
        <Icon
          as={mode === 'date' ? CalendarClock : Clock}
          size={16}
          className="text-muted-foreground"
        />
        <input
          type={mode}
          value={value ? toInputValue(value, mode) : ''}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? (mode === 'date' ? 'Select date' : 'Select time')}
          aria-label={label ?? (mode === 'date' ? 'Select date' : 'Select time')}
          style={{
            flex: 1,
            minWidth: 0,
            marginLeft: 8,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: value ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
            fontSize: 14,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        />
      </View>
    </View>
  );
}
