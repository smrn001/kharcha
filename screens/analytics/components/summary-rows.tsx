import { NativeBlock } from '@/components/native-block';
import { ConnectedRow } from '@/components/recent-transactions';
import { Column, Icon, ListItem, Row, Spacer, Text } from '@expo/ui';
import { useTheme } from '@/lib/theme';
import { View } from 'react-native';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Icon>['name'];

export interface SummaryStat {
  key: string;
  icon: IconName;
  label: string;
  amount: string;
  /** Secondary line: transaction count, or the vs-previous delta. */
  sub: string;
  /** Colour for the icon and amount — the theme's success/error/primary roles. */
  accent: string;
  /** Colour for the secondary line, when it should differ from the default. */
  subColor?: string;
}

/**
 * Income / expenses / net balance as a native grouped list.
 *
 * These three were the only block on the page not built from either the
 * `Card` treatment (charts) or the `ConnectedRow` + `ListItem` treatment
 * (categories, recent transactions), which made them read as foreign. Reusing
 * the row group also makes them match the Transactions and Settings tabs.
 */
export function SummaryRows({ stats }: { stats: SummaryStat[] }) {
  const colors = useTheme();
  return (
    <View style={{ gap: 2 }}>
      {stats.map((stat, index) => (
        <ConnectedRow
          key={stat.key}
          first={index === 0}
          last={index === stats.length - 1}
        >
          <NativeBlock matchContents={false}>
            <ListItem colors={{ containerColor: colors.surfaceContainer }}>
              <Row alignment="center" spacing={12}>
                <Icon name={stat.icon} size={20} color={stat.accent} />
                <Column spacing={2}>
                  <Text textStyle={{ fontSize: 16, color: colors.text }}>{stat.label}</Text>
                  <Text
                    textStyle={{ fontSize: 13, color: stat.subColor ?? colors.textSecondary }}
                  >
                    {stat.sub}
                  </Text>
                </Column>
                <Spacer flexible />
                <Text textStyle={{ fontSize: 16, fontWeight: '600', color: stat.accent }}>
                  {stat.amount}
                </Text>
              </Row>
            </ListItem>
          </NativeBlock>
        </ConnectedRow>
      ))}
    </View>
  );
}
