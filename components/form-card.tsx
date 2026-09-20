import { Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useTheme } from '@/lib/theme';
import type { ReactNode } from 'react';
import { View } from 'react-native';

/** Card with a small bold label and stacked content, used across forms. */
export function FormCard({ title, children }: { title: string; children: ReactNode }) {
  const colors = useTheme();
  return (
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
          {title}
        </Text>
      </NativeBlock>
      {children}
    </View>
  );
}