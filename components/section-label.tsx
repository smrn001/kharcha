import { Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useTheme } from '@/lib/theme';
import { View } from 'react-native';

/** Taller label above a group of related rows. */
export function SectionLabel({ children }: { children: string }) {
  const colors = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
      <NativeBlock>
        <Text
          textStyle={{
            fontSize: 12,
            fontWeight: '600',
            color: colors.textSecondary,
          }}
        >
          {children}
        </Text>
      </NativeBlock>
    </View>
  );
}