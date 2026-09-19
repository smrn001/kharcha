import { Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useAppColors } from '@/lib/colors';
import { useI18n } from '@/hooks/use-i18n';
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
  const { t } = useI18n();
  const colors = useAppColors();
  const max = niceCeil(Math.max(...data.flatMap((d) => [d.income, d.expense]), 1));
  const barHeight = (value: number) =>
    Math.max(Math.round((value / max) * CHART_HEIGHT), value > 0 ? 4 : 0);
  const ticks = [1, 0.5, 0];
  const hasIncome = data.some((d) => d.income > 0);

  return (
    <View style={{ width: '100%' }}>
      {hasIncome ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.positive }}
            />
            <NativeBlock>
              <Text textStyle={{ fontSize: 12, color: colors.mutedForeground }}>
                {t('an.income')}
              </Text>
            </NativeBlock>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.destructiveError }}
            />
            <NativeBlock>
              <Text textStyle={{ fontSize: 12, color: colors.mutedForeground }}>
                {t('an.expenses')}
              </Text>
            </NativeBlock>
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ justifyContent: 'space-between', height: CHART_HEIGHT }}>
          {ticks.map((fraction) => (
            <NativeBlock key={fraction}>
              <Text
                textStyle={{ fontSize: 9, color: colors.mutedForeground, textAlign: 'right' }}
                numberOfLines={1}
              >
                {formatValue ? formatValue(Math.round(max * fraction)) : `${Math.round(max * fraction)}`}
              </Text>
            </NativeBlock>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ height: 16, flexDirection: 'row', gap: 4 }}>
            {data.map((datum, index) => (
              <View key={`value-${datum.label}-${index}`} style={{ flex: 1, alignItems: 'center' }}>
                <NativeBlock>
                  <Text
                    textStyle={{ fontSize: 9, color: colors.mutedForeground, textAlign: 'center' }}
                    numberOfLines={1}
                  >
                    {datum.expense > 0
                      ? formatValue
                        ? formatValue(datum.expense)
                        : `${datum.expense}`
                      : datum.income > 0
                        ? formatValue
                          ? formatValue(datum.income)
                          : `${datum.income}`
                        : ''}
                  </Text>
                </NativeBlock>
              </View>
            ))}
          </View>

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
                  borderTopColor: colors.separator,
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
                          backgroundColor: colors.positive,
                          height: barHeight(datum.income),
                        }}
                      />
                      <View
                        style={{
                          width: '50%',
                          borderTopRightRadius: 2,
                          backgroundColor: colors.destructiveError,
                          height: barHeight(datum.expense),
                        }}
                      />
                    </>
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        backgroundColor: colors.destructiveError,
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
                    textStyle={{ fontSize: 10, color: colors.mutedForeground, textAlign: 'center' }}
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