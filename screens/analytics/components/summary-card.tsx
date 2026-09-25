import { NativeBlock } from '@/components/native-block';
import { useTheme } from '@/lib/theme';
import { Icon, Text } from '@expo/ui';
import { View } from 'react-native';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Icon>['name'];

/**
 * One of the three bare summary stats (income / expenses / net). No container —
 * the coloured icon and amount carry the emphasis, which keeps the most
 * contrast possible against the screen background.
 */
export function SummaryCard({
  icon,
  tintColor,
  label,
  amount,
  sub,
  subColor,
}: {
  icon: IconName;
  tintColor: string;
  label: string;
  amount: string;
  sub: string;
  subColor?: string;
}) {
  const colors = useTheme();
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <NativeBlock>
        <Icon name={icon} size={22} color={tintColor} />
      </NativeBlock>
      <View style={{ gap: 2 }}>
        <NativeBlock>
          <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>{label}</Text>
        </NativeBlock>
        <NativeBlock>
          <Text textStyle={{ fontSize: 20, fontWeight: '700', color: tintColor }}>
            {amount}
          </Text>
        </NativeBlock>
        <NativeBlock>
          <Text textStyle={{ fontSize: 12, color: subColor ?? colors.textSecondary }}>
            {sub}
          </Text>
        </NativeBlock>
      </View>
    </View>
  );
}
