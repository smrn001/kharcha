import { useI18n } from '@/hooks/use-i18n';
import type { DictionaryKey } from '@/lib/i18n/en';
import {
  Host,
  Icon,
  NavigationBar,
  NavigationBarItem,
  Text,
} from '@expo/ui/jetpack-compose';
import { router, usePathname } from 'expo-router';
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
    icon: require('@expo/material-symbols/home.xml'),
    labelKey: 'tabs.home',
  },
  {
    name: 'transactions',
    href: '/transactions',
    icon: require('@expo/material-symbols/receipt_long.xml'),
    labelKey: 'tabs.transactions',
  },
  {
    name: 'analytics',
    href: '/analytics',
    icon: require('@expo/material-symbols/pie_chart.xml'),
    labelKey: 'tabs.analytics',
  },
  {
    name: 'settings',
    href: '/settings',
    icon: require('@expo/material-symbols/settings.xml'),
    labelKey: 'tabs.settings',
  },
];

/**
 * Material 3 bottom navigation bar for Android (from `@expo/ui/jetpack-compose`).
 * Colours come from the Material 3 defaults (device-adaptive); navigation goes
 * through `router.navigate`. iOS uses `NativeTabs`.
 */
export function TabBar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (Platform.OS !== 'android') {
    return null;
  }

  let selectedName: (typeof TAB_ITEMS)[number]['name'] = 'index';
  if (pathname === '/transactions') selectedName = 'transactions';
  else if (pathname === '/analytics') selectedName = 'analytics';
  else if (pathname === '/settings') selectedName = 'settings';

  return (
    <View style={{ paddingBottom: insets.bottom }}>
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <NavigationBar tonalElevation={0}>
          {TAB_ITEMS.map((tab) => {
            const selected = selectedName === tab.name;
            return (
              <NavigationBarItem
                key={tab.name}
                selected={selected}
                onClick={() => router.navigate(tab.href)}
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