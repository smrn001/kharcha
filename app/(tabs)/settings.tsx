import { SegmentedControl } from '@/components/segmented-control';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useSettings } from '@/hooks/use-settings';
import { resetAllTransactions } from '@/lib/db/transactions';
import { SUPPORTED_CURRENCIES } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import { Check, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { ThemePreference } from '@/types';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2 px-5">
      <Text variant="muted" className="text-xs font-semibold uppercase">
        {title}
      </Text>
      <View className="border-border bg-card rounded-xl border">{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  destructive,
  children,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between gap-3 px-4 py-3.5"
      disabled={!onPress}
    >
      <Text className={cn('text-sm', destructive && 'text-destructive font-medium')}>{label}</Text>
      {children ?? (
        <View className="flex-row items-center gap-1">
          {value ? <Text variant="muted" className="text-sm">{value}</Text> : null}
          {onPress ? <Icon as={ChevronRight} size={16} className="text-muted-foreground" /> : null}
        </View>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { settings, updateSetting } = useSettings();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedCurrency =
    SUPPORTED_CURRENCIES.find((currency) => currency.code === settings.currency) ??
    SUPPORTED_CURRENCIES[0];

  const handleThemeChange = async (theme: ThemePreference) => {
    await updateSetting('theme', theme);
  };

  const handleReset = async () => {
    try {
      setBusy(true);
      await resetAllTransactions(db);
      setResetOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="bg-background flex-1">
      <View className="px-5 pb-2 pt-4">
        <Text className="text-2xl font-bold">Settings</Text>
      </View>

      <ScrollView contentContainerClassName="gap-6 pb-28" showsVerticalScrollIndicator={false}>
        <Section title="General">
          <Row
            label="Currency"
            value={`${selectedCurrency.code} (${selectedCurrency.symbol})`}
            onPress={() => setCurrencyOpen(true)}
          />
          <View className="bg-border mx-4 h-px" />
          <View className="gap-2 px-4 py-3.5">
            <Text className="text-sm">Theme</Text>
            <SegmentedControl options={THEME_OPTIONS} value={settings.theme} onChange={handleThemeChange} />
          </View>
        </Section>

        <Section title="Data">
          <Row label="Reset all data" destructive onPress={() => setResetOpen(true)} />
        </Section>

        <Section title="About">
          <View className="gap-1 px-4 py-3.5">
            <Text className="text-sm font-semibold">Kharcha</Text>
            <Text variant="muted" className="text-sm">
              Offline-first personal expense tracker.
            </Text>
            <Text variant="muted" className="text-xs">
              Version {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>
        </Section>
      </ScrollView>

      <AlertDialog open={currencyOpen} onOpenChange={setCurrencyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Choose currency</AlertDialogTitle>
            <AlertDialogDescription>
              This currency is used for formatting amounts across the app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {SUPPORTED_CURRENCIES.map((currency, index) => {
            const selected = currency.code === settings.currency;
            return (
              <View key={currency.code}>
                {index > 0 ? <View className="bg-border h-px" /> : null}
                <Pressable
                  onPress={async () => {
                    await updateSetting('currency', currency.code);
                    setCurrencyOpen(false);
                  }}
                  className="flex-row items-center justify-between py-3"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium">{currency.name}</Text>
                    <Text variant="muted" className="text-xs">
                      {currency.code} · {currency.symbol}
                    </Text>
                  </View>
                  {selected ? (
                    <Icon as={Check} size={16} className="text-primary" />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={handleReset}
              disabled={busy}
              className="bg-destructive dark:bg-destructive/60"
            >
              <Text className="text-white font-medium">Reset</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
