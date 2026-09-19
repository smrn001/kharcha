import { useTheme } from '@/lib/theme';
import { Pressable, ScrollView, Text, View } from 'react-native';

export interface FilterChipItem {
  key: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  /** When > 0, renders a count badge next to the label (e.g. active filter count). */
  badgeCount?: number;
}

/**
 * Horizontally scrollable row of Material 3-flavoured filter chips. React
 * Native + the semantic theme tokens keep a single code path on both
 * platforms; the M3 selected state uses the `secondaryContainer` role (tonal
 * fill) and the resting state a surface-fill + `outline` border.
 *
 * Kept intentionally small so screens can build their own chip sets from app
 * state (quick type filters, "Today", the Filters chip that opens the sheet).
 */
export function FilterChips({ chips }: { chips: FilterChipItem[] }) {
  const colors = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={chip.onPress}
          style={({ pressed }) => [
            {
              height: 32,
              borderRadius: 16,
              borderWidth: 1,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: chip.selected ? colors.secondaryContainer : colors.surfaceContainer,
              borderColor: chip.selected ? colors.secondaryContainer : colors.outline,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: chip.selected ? colors.onSecondaryContainer : colors.textSecondary,
            }}
          >
            {chip.label}
          </Text>
          {chip.badgeCount != null && chip.badgeCount > 0 ? (
            <View
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.destructive,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                {chip.badgeCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}