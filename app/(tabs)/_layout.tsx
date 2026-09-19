import { TabBar } from '@/components/tab-bar';
import { useI18n } from '@/hooks/use-i18n';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';

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

function AndroidTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <TabBar />
    </View>
  );
}

/**
 * Android uses the Jetpack Compose `NavigationBar` (Material 3) from
 * `@expo/ui` as its bottom navigation; iOS keeps native tab bars via
 * `NativeTabs` (SF Symbols).
 */
export default function TabLayout() {
  if (Platform.OS === 'android') {
    return <AndroidTabs />;
  }
  return <IoSTabs />;
}