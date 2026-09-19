import { TabBar } from '@/components/tab-bar';
import { useI18n } from '@/hooks/use-i18n';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

function IoSTabs() {
  const { t } = useI18n();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Icon sf="receipt" md="receipt" />
        <NativeTabs.Trigger.Label>{t('tabs.transactions')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="analytics">
        <NativeTabs.Trigger.Icon sf="chart.pie" md="pie_chart" />
        <NativeTabs.Trigger.Label>{t('tabs.analytics')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gear" md="settings" />
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

/**
 * Android uses the Jetpack Compose `NavigationBar` (Material 3) from
 * `@expo/ui` as its bottom navigation, rendered as the `Tabs` navigator's
 * custom `tabBar`. Using a real tab navigator (instead of a Stack) keeps all
 * four screens mounted once visited, so switching tabs reuses the rendered
 * screen instead of unmounting/remounting it (fresh `Host` inflation + queries)
 * — which made tab changes slow. iOS keeps native tab bars via `NativeTabs`.
 */
function AndroidTabs() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => <TabBar />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'android') {
    return <AndroidTabs />;
  }
  return <IoSTabs />;
}