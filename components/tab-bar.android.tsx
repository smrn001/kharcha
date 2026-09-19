import { useI18n } from '@/hooks/use-i18n';
import { hslToHex, THEME } from '@/lib/theme';
import type { DictionaryKey } from '@/lib/i18n/en';
import {
  Host,
  Icon,
  NavigationBar,
  NavigationBarItem,
  Text,
} from '@expo/ui/jetpack-compose';
import { router, usePathname } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ITEMS: {
  name: 'index' | 'transactions' | 'analytics' | 'settings';
  href: '/' | '/transactions' | '/analytics' | '/settings';
  icon: number;
  labelKey: DictionaryKey;
}[] = [
  {
    name: 'index',
    href: '/',
    icon: require('../assets/icons/tab-home.xml'),
    labelKey: 'tabs.home',
  },
  {
    name: 'transactions',
    href: '/transactions',
    icon: require('../assets/icons/tab-receipt.xml'),
    labelKey: 'tabs.transactions',
  },
  {
    name: 'analytics',
    href: '/analytics',
    icon: require('../assets/icons/tab-pie.xml'),
    labelKey: 'tabs.analytics',
  },
  {
    name: 'settings',
    href: '/settings',
    icon: require('../assets/icons/tab-settings.xml'),
    labelKey: 'tabs.settings',
  },
];

/**
 * Material 3 bottom navigation bar for Android (from `@expo/ui/jetpack-compose`).
 * The tabs layout still needs the selected tab derived from the active route;
 * Compose `NavigationBar` is a plain control, so navigation goes through
 * `router.navigate`. iOS uses `NativeTabs`; web uses `_layout.web.tsx`.
 */
export function TabBar() {
  const { t } = useI18n();
  const { colorScheme } = useColorScheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (Platform.OS !== 'android') {
    return null;
  }

  const colors = THEME[colorScheme ?? 'light'];
  const primary = hslToHex(colors.primary);
  const muted = hslToHex(colors.mutedForeground);

  let selectedName: (typeof TAB_ITEMS)[number]['name'] = 'index';
  if (pathname === '/transactions') selectedName = 'transactions';
  else if (pathname === '/analytics') selectedName = 'analytics';
  else if (pathname === '/settings') selectedName = 'settings';

  return (
    <View className="bg-background" style={{ paddingBottom: insets.bottom }}>
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <NavigationBar
          containerColor={hslToHex(colors.background)}
          contentColor={hslToHex(colors.foreground)}
          tonalElevation={0}
        >
          {TAB_ITEMS.map((tab) => {
            const selected = selectedName === tab.name;
            return (
              <NavigationBarItem
                key={tab.name}
                selected={selected}
                onClick={() => router.navigate(tab.href)}
                colors={{
                  selectedIconColor: primary,
                  selectedTextColor: primary,
                  selectedIndicatorColor: primary,
                  unselectedIconColor: muted,
                  unselectedTextColor: muted,
                }}
              >
                <NavigationBarItem.Icon>
                  <Icon source={tab.icon} />
                </NavigationBarItem.Icon>
                <NavigationBarItem.Label>
                  <Text>{t(tab.labelKey)}</Text>
                </NavigationBarItem.Label>
              </NavigationBarItem>
            );
          })}
        </NavigationBar>
      </Host>
    </View>
  );
}