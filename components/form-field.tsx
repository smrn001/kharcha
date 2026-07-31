import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { View } from 'react-native';

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('gap-2', className)}>
      <Text className="text-sm font-medium">{label}</Text>
      {children}
    </View>
  );
}
