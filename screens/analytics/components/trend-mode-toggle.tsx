import { NativeBlock } from '@/components/native-block';
import { useI18n } from '@/hooks/use-i18n';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { View } from 'react-native';
import type { BarChartSeries } from '@/components/bar-chart';

const TOGGLE_WIDTH = 190;

/**
 * Expenses / Income switch for the spending trend.
 *
 * The `Host` gets an explicit width instead of a `maxWidth` on an RN parent:
 * `matchContents` is off, so the host measures itself from the Compose child and
 * an unbounded intrinsic width pushed the control off the card. Pinning the
 * width on the host gives the segmented control a fixed box to lay out in and a
 * stable, tappable hit area.
 */
export function TrendModeToggle({
  mode,
  onChange,
}: {
  mode: BarChartSeries;
  onChange: (mode: BarChartSeries) => void;
}) {
  const { t } = useI18n();
  const options: { value: BarChartSeries; label: string }[] = [
    { value: 'expense', label: t('an.expenses') },
    { value: 'income', label: t('an.income') },
  ];
  return (
    <View style={{ width: TOGGLE_WIDTH }}>
      <NativeBlock matchContents={false} style={{ width: TOGGLE_WIDTH }}>
        <SegmentedControl
          values={options.map((o) => o.label)}
          selectedIndex={options.findIndex((o) => o.value === mode)}
          onValueChange={(label) => {
            const next = options.find((o) => o.label === label)?.value;
            if (next) onChange(next);
          }}
        />
      </NativeBlock>
    </View>
  );
}
