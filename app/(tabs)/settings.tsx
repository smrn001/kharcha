import { SegmentedControl } from '@/components/segmented-control';
import { PageHeader } from '@/components/page-header';
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
import { useUpdateChecker } from '@/hooks/use-update-checker';
import { resetAllTransactions } from '@/lib/db/transactions';
import { SUPPORTED_CURRENCIES } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Check, ChevronRight, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
import type { ThemePreference, TransactionType } from '@/types';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
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
  const { state: updateState, isChecking, checkNow } = useUpdateChecker();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [startOfWeekOpen, setStartOfWeekOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedCurrency =
    SUPPORTED_CURRENCIES.find((currency) => currency.code === settings.currency) ??
    SUPPORTED_CURRENCIES[0];

  const selectedStartOfWeek =
    WEEKDAY_OPTIONS.find((option) => option.value === settings.startOfWeek) ?? WEEKDAY_OPTIONS[0];

  const handleThemeChange = async (theme: ThemePreference) => {
    await updateSetting('theme', theme);
  };

  const handleTypeChange = async (type: TransactionType) => {
    await updateSetting('defaultTransactionType', type);
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
      <PageHeader title="Settings" />

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

        <Section title="Preferences">
          <View className="gap-2 px-4 py-3.5">
            <Text className="text-sm">Default transaction type</Text>
            <SegmentedControl
              options={TYPE_OPTIONS}
              value={settings.defaultTransactionType}
              onChange={handleTypeChange}
            />
          </View>
          <View className="bg-border mx-4 h-px" />
          <Row
            label="Start of week"
            value={selectedStartOfWeek.label}
            onPress={() => setStartOfWeekOpen(true)}
          />
        </Section>

        <Section title="Categories">
          <Row
            label="Manage categories"
            value="Add, edit, or delete"
            onPress={() => router.push('/categories')}
          />
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
          {Platform.OS === 'android' ? (
            <>
              <View className="bg-border mx-4 h-px" />
              <Row label="Check for updates" onPress={checkNow}>
                {isChecking ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" />
                    <Text variant="muted" className="text-sm">
                      Checking…
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1">
                    {updateState.status === 'available' ? (
                      <Text className="text-primary text-sm font-medium">
                        v{updateState.latestVersion} available
                      </Text>
                    ) : updateState.status === 'error' ? (
                      <Text variant="muted" className="text-sm">
                        Check failed
                      </Text>
                    ) : (
                      <Text variant="muted" className="text-sm">
                        Up to date
                      </Text>
                    )}
                    <Icon as={RefreshCw} size={16} className="text-muted-foreground" />
                  </View>
                )}
              </Row>
            </>
          ) : null}
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

      <AlertDialog open={startOfWeekOpen} onOpenChange={setStartOfWeekOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start of week</AlertDialogTitle>
            <AlertDialogDescription>
              Choose which day begins the week for weekly totals and analytics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {WEEKDAY_OPTIONS.map((option, index) => {
            const selected = option.value === settings.startOfWeek;
            return (
              <View key={option.value}>
                {index > 0 ? <View className="bg-border h-px" /> : null}
                <Pressable
                  onPress={async () => {
                    await updateSetting('startOfWeek', option.value);
                    setStartOfWeekOpen(false);
                  }}
                  className="flex-row items-center justify-between py-3"
                >
                  <Text className="text-sm font-medium">{option.label}</Text>
                  {selected ? <Icon as={Check} size={16} className="text-primary" /> : null}
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
