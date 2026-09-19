import { NativeBlock } from '@/components/native-block';
import { useI18n } from '@/hooks/use-i18n';
import { hapticSelection } from '@/lib/haptics';
import type { DictionaryKey } from '@/lib/i18n/en';
import { Icon } from '@expo/ui';
import { useTheme } from '@/lib/theme';
import { router, usePathname } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICONS = {
  home: Icon.select({
    ios: 'house.fill',
    android: import('@expo/material-symbols/home.xml'),
  }),
  transactions: Icon.select({
    ios: 'receipt',
    android: import('@expo/material-symbols/receipt_long.xml'),
  }),
  analytics: Icon.select({
    ios: 'chart.pie',
    android: import('@expo/material-symbols/pie_chart.xml'),
  }),
  settings: Icon.select({
    ios: 'gear',
    android: import('@expo/material-symbols/settings.xml'),
  }),
} as const;

const TAB_ITEMS: {
  name: 'index' | 'transactions' | 'analytics' | 'settings';
  href: '/' | '/transactions' | '/analytics' | '/settings';
  iconKey: keyof typeof TAB_ICONS;
  labelKey: DictionaryKey;
}[] = [
  { name: 'index', href: '/', iconKey: 'home', labelKey: 'tabs.home' },
  { name: 'transactions', href: '/transactions', iconKey: 'transactions', labelKey: 'tabs.transactions' },
  { name: 'analytics', href: '/analytics', iconKey: 'analytics', labelKey: 'tabs.analytics' },
  { name: 'settings', href: '/settings', iconKey: 'settings', labelKey: 'tabs.settings' },
];

/**
 * Compact bottom navigation bar for Android. The Compose `NavigationBar` is
 * fixed at 80dp (unshrinkable), so this custom React Native bar gives a slim,
 * Google-app-style look: a ~56dp content row riding on the bottom inset, with
 * the active tab wearing the Material 3 tonal pill. iOS keeps `NativeTabs`.
 */
export function TabBar() {
  const { t } = useI18n();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  if (Platform.OS !== 'android') {
    return null;
  }

  let selectedName: (typeof TAB_ITEMS)[number]['name'] = 'index';
  if (pathname === '/transactions') selectedName = 'transactions';
  else if (pathname === '/analytics') selectedName = 'analytics';
  else if (pathname === '/settings') selectedName = 'settings';

  return (
    <View
      style={{
        backgroundColor: colors.surfaceContainer,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={{ height: 64, flexDirection: 'row', alignItems: 'stretch' }}>
        {TAB_ITEMS.map((tab) => {
          const selected = selectedName === tab.name;
          const color = selected ? colors.onSecondaryContainer : colors.textSecondary;
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                void hapticSelection();
                router.navigate(tab.href);
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <View
                style={{
                  height: 34,
                  width: 56,
                  borderRadius: 17,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.secondaryContainer : 'transparent',
                }}
              >
                <NativeBlock>
                  <Icon name={TAB_ICONS[tab.iconKey]} size={21} color={color} />
                </NativeBlock>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: selected ? '600' : '500',
                  color,
                }}
              >
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}