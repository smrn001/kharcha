import { Text } from '@/components/ui/text';
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
}: {
  data: BarChartDatum[];
  formatValue?: (value: number) => string;
}) {
  const max = niceCeil(
    Math.max(...data.flatMap((d) => [d.income, d.expense]), 1)
  );
  const barHeight = (value: number) =>
    Math.max(Math.round((value / max) * CHART_HEIGHT), value > 0 ? 4 : 0);
  const ticks = [1, 0.5, 0];
  const hasIncome = data.some((d) => d.income > 0);

  return (
    <View className="w-full">
      {hasIncome ? (
        <View className="mb-2 flex-row justify-end gap-4">
          <View className="flex-row items-center gap-1.5">
            <View className="bg-positive h-2.5 w-2.5 rounded-sm" />
            <Text variant="muted" className="text-xs">
              Income
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="bg-destructive h-2.5 w-2.5 rounded-sm" />
            <Text variant="muted" className="text-xs">
              Spending
            </Text>
          </View>
        </View>
      ) : null}

      <View className="flex-row gap-2">
        <View className="justify-between py-0.5" style={{ height: CHART_HEIGHT }}>
          {ticks.map((fraction) => (
            <Text
              key={fraction}
              variant="muted"
              className="text-right text-[9px]"
              numberOfLines={1}
            >
              {formatValue ? formatValue(Math.round(max * fraction)) : Math.round(max * fraction)}
            </Text>
          ))}
        </View>

        <View className="flex-1">
          <View className="h-4 flex-row items-end justify-between gap-1">
            {data.map((datum, index) => (
              <Text
                key={`value-${datum.label}-${index}`}
                variant="muted"
                className="flex-1 text-center text-[9px]"
                numberOfLines={1}
              >
                {datum.expense > 0
                  ? formatValue
                    ? formatValue(datum.expense)
                    : datum.expense
                  : datum.income > 0
                    ? formatValue
                      ? formatValue(datum.income)
                      : datum.income
                    : ''}
              </Text>
            ))}
          </View>

          <View className="relative" style={{ height: CHART_HEIGHT }}>
            {ticks.map((fraction) => (
              <View
                key={`tick-${fraction}`}
                className="absolute inset-x-0 border-t border-border/40"
                style={{ bottom: Math.round(fraction * CHART_HEIGHT) }}
              />
            ))}
            <View
              className="flex-row items-end justify-between gap-1"
              style={{ height: CHART_HEIGHT }}
            >
              {data.map((datum, index) => (
                <View
                  key={`bar-${datum.label}-${index}`}
                  className="flex-1 flex-row items-end justify-center gap-px"
                  style={{ height: CHART_HEIGHT }}
                  accessibilityLabel={`${datum.label} — income: ${datum.income}, spending: ${datum.expense}`}
                >
                  {hasIncome ? (
                    <>
                      <View
                        className="bg-positive w-1/2 rounded-tl-sm"
                        style={{ height: barHeight(datum.income) }}
                      />
                      <View
                        className="bg-destructive w-1/2 rounded-tr-sm"
                        style={{ height: barHeight(datum.expense) }}
                      />
                    </>
                  ) : (
                    <View
                      className="bg-destructive w-full rounded-t-sm"
                      style={{ height: barHeight(datum.expense) }}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>

          <View className="mt-1 flex-row justify-between gap-1">
            {data.map((datum, index) => (
              <Text
                key={`label-${datum.label}-${index}`}
                variant="muted"
                className="flex-1 text-center text-[10px]"
                numberOfLines={1}
              >
                {datum.label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
