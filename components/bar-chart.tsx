import { Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useTheme } from '@/lib/theme';
import { View } from 'react-native';

export interface BarChartDatum {
  label: string;
  income: number;
  expense: number;
}

function niceCeil(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  for (const mult of [1, 2, 5, 10]) {
    if (value <= mult * magnitude) return mult * magnitude;
  }
  return 10 * magnitude;
}

const CHART_HEIGHT = 128;

export function BarChart({
  data,
  formatValue,
  mode = 'both',
}: {
  data: BarChartDatum[];
  formatValue?: (value: number) => string;
  /** Show one series full-width (mockup toggle) instead of grouped pairs. */
  mode?: 'both' | 'income' | 'expense';
}) {
  const colors = useTheme();
  const showIncome = mode !== 'expense';
  const showExpense = mode !== 'income';
  const max = niceCeil(
    Math.max(
      ...data.flatMap((d) => [
        showIncome ? d.income : 0,
        showExpense ? d.expense : 0,
      ]),
      1
    )
  );
  const barHeight = (value: number) =>
    Math.max(Math.round((value / max) * CHART_HEIGHT), value > 0 ? 4 : 0);
  const ticks = [1, 0.5, 0];
  const hasIncome = mode === 'both' && data.some((d) => d.income > 0);

  return (
    <View style={{ width: '100%' }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ justifyContent: 'space-between', height: CHART_HEIGHT }}>
          {ticks.map((fraction) => (
            <NativeBlock key={fraction}>
              <Text
                textStyle={{ fontSize: 9, color: colors.textSecondary, textAlign: 'right' }}
                numberOfLines={1}
              >
                {formatValue ? formatValue(Math.round(max * fraction)) : `${Math.round(max * fraction)}`}
              </Text>
            </NativeBlock>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ height: CHART_HEIGHT }}>
            {ticks.map((fraction) => (
              <View
                key={`tick-${fraction}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: Math.round(fraction * CHART_HEIGHT),
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              />
            ))}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 4,
                height: CHART_HEIGHT,
              }}
            >
              {data.map((datum, index) => (
                <View
                  key={`bar-${datum.label}-${index}`}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: 1,
                    height: CHART_HEIGHT,
                  }}
                  accessibilityLabel={`${datum.label} — income: ${datum.income}, spending: ${datum.expense}`}
                >
                  {hasIncome ? (
                    <>
                      <View
                        style={{
                          width: '50%',
                          borderTopLeftRadius: 2,
                          backgroundColor: colors.success,
                          height: barHeight(datum.income),
                        }}
                      />
                      <View
                        style={{
                          width: '50%',
                          borderTopRightRadius: 2,
                          backgroundColor: colors.destructive,
                          height: barHeight(datum.expense),
                        }}
                      />
                    </>
                  ) : mode === 'income' ? (
                    <View
                      style={{
                        width: '100%',
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        backgroundColor: colors.success,
                        height: barHeight(datum.income),
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        backgroundColor: mode === 'both' ? colors.destructive : colors.primary,
                        height: barHeight(datum.expense),
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
            {data.map((datum, index) => (
              <View key={`label-${datum.label}-${index}`} style={{ flex: 1, alignItems: 'center' }}>
                <NativeBlock>
                  <Text
                    textStyle={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center' }}
                    numberOfLines={1}
                  >
                    {datum.label}
                  </Text>
                </NativeBlock>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}