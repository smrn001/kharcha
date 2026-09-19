import { NativeBlock } from '@/components/native-block';
import { Text } from '@expo/ui';
import { useTheme } from '@/lib/theme';
import { ActivityIndicator, View } from 'react-native';

/**
 * Styled loading state: a themed spinner (optionally with a caption), centered
 * in the space it stands in. Replaces bare "Loading…" Text placeholders.
 */
export function LoadingView({ label }: { label?: string }) {
  const colors = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 24 }}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? (
        <NativeBlock>
          <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>{label}</Text>
        </NativeBlock>
      ) : null}
    </View>
  );
}