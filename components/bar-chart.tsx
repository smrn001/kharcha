import { Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useTheme } from '@/lib/theme';
import { View } from 'react-native';

export interface BarChartDatum {
  label: string;
  income: number;
  expense: number;
}

export type BarChartSeries = 'income' | 'expense';

function niceCeil(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  for (const mult of [1, 2, 5, 10]) {
    if (value <= mult * magnitude) return mult * magnitude;
  }
  return 10 * magnitude;
}

const CHART_HEIGHT = 128;

/**
 * Minimal single-series bar chart: y-axis ticks, faint gridlines, one bar per
 * period. The series is chosen by the caller's `series` prop; the other series
 * is not drawn and does not affect the scale.
 */
export function BarChart({
  data,
  series,
  formatValue,
}: {
  data: BarChartDatum[];
  series: BarChartSeries;
  formatValue?: (value: number) => string;
}) {
  const colors = useTheme();
  const valueOf = (datum: BarChartDatum): number =>
    series === 'income' ? datum.income : datum.expense;
  const max = niceCeil(Math.max(...data.map(valueOf), 1));
  const barHeight = (value: number) =>
    Math.max(Math.round((value / max) * CHART_HEIGHT), value > 0 ? 4 : 0);
  const ticks = [1, 0.5, 0];
  const barColor = series === 'income' ? colors.success : colors.primary;

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
                {formatValue
                  ? formatValue(Math.round(max * fraction))
                  : `${Math.round(max * fraction)}`}
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
                    height: CHART_HEIGHT,
                    justifyContent: 'flex-end',
                  }}
                  accessibilityLabel={`${datum.label}: ${valueOf(datum)}`}
                >
                  <View
                    style={{
                      width: '100%',
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 2,
                      backgroundColor: barColor,
                      height: barHeight(valueOf(datum)),
                    }}
                  />
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
