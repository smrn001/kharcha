import { NativeBlock } from '@/components/native-block';
import { useTheme } from '@/lib/theme';
import { Text } from '@expo/ui';
import { View } from 'react-native';

/**
 * One row of the income-vs-expense comparison: label, proportional bar, amount.
 * `fraction` is the share of the total flow (income + expense), so the two bars
 * together always fill the track.
 */
export function CompareBar({
  label,
  amount,
  fraction,
  barColor,
}: {
  label: string;
  amount: string;
  fraction: number;
  barColor: string;
}) {
  const colors = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 64 }}>
        <NativeBlock>
          <Text textStyle={{ fontSize: 14, color: colors.text }}>{label}</Text>
        </NativeBlock>
      </View>
      <View
        style={{
          flex: 1,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: 10,
            borderRadius: 5,
            width: `${Math.round(Math.min(Math.max(fraction, 0), 1) * 100)}%`,
            backgroundColor: barColor,
          }}
        />
      </View>
      <View style={{ minWidth: 88, alignItems: 'flex-end' }}>
        <NativeBlock>
          <Text textStyle={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            {amount}
          </Text>
        </NativeBlock>
      </View>
    </View>
  );
}
