import { NativeBlock } from '@/components/native-block';
import { useI18n } from '@/hooks/use-i18n';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { View } from 'react-native';
import type { BarChartSeries } from '@/components/bar-chart';

const MAX_WIDTH = 190;

/**
 * Expenses / Income switch for the spending trend. The native
 * `SegmentedControl` has no label-size API, so it is width-capped instead —
 * uncapped it measures itself and overflows the card on narrow screens.
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
    <View style={{ maxWidth: MAX_WIDTH }}>
      <NativeBlock matchContents={false}>
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
