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
import { BackupError, useBackup, type ImportSummary } from '@/hooks/use-backup';
import { hapticError, hapticMediumImpact, hapticSuccess } from '@/lib/haptics';
import { useI18n } from '@/hooks/use-i18n';
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
import type {
  CalendarPreference,
  LanguagePreference,
  NumeralsPreference,
  ThemePreference,
  TransactionType,
} from '@/types';
import type { DictionaryKey } from '@/lib/i18n/en';

const THEME_OPTIONS: { value: ThemePreference; labelKey: DictionaryKey }[] = [
  { value: 'system', labelKey: 'set.system' },
  { value: 'light', labelKey: 'set.light' },
  { value: 'dark', labelKey: 'set.dark' },
];

const TYPE_OPTIONS: { value: TransactionType; labelKey: DictionaryKey }[] = [
  { value: 'expense', labelKey: 'set.expense' },
  { value: 'income', labelKey: 'set.income' },
];

const WEEKDAY_OPTIONS: { value: number; labelKey: DictionaryKey }[] = [
  { value: 0, labelKey: 'set.sun' },
  { value: 1, labelKey: 'set.mon' },
  { value: 2, labelKey: 'set.tue' },
  { value: 3, labelKey: 'set.wed' },
  { value: 4, labelKey: 'set.thu' },
  { value: 5, labelKey: 'set.fri' },
  { value: 6, labelKey: 'set.sat' },
];

const LANGUAGE_OPTIONS: { value: LanguagePreference; labelKey: DictionaryKey }[] = [
  { value: 'en', labelKey: 'set.english' },
  { value: 'ne', labelKey: 'set.nepali' },
];

const CALENDAR_OPTIONS: { value: CalendarPreference; labelKey: DictionaryKey }[] = [
  { value: 'ad', labelKey: 'set.calAd' },
  { value: 'bs', labelKey: 'set.calBs' },
  { value: 'both', labelKey: 'set.calBoth' },
];

const NUMERALS_OPTIONS: { value: NumeralsPreference; labelKey: DictionaryKey }[] = [
  { value: 'latin', labelKey: 'set.latin' },
  { value: 'devanagari', labelKey: 'set.devanagari' },
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
      className="flex-row items-center justify-between gap-3 px-4 py-3.5 active:bg-muted/60"
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
  const { t, plural } = useI18n();
  const { state: updateState, isChecking, checkNow } = useUpdateChecker();
  const { busy: backupBusy, exportJson, exportCsv, importFile } = useBackup();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [numeralsOpen, setNumeralsOpen] = useState(false);
  const [startOfWeekOpen, setStartOfWeekOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null
  );

  const selectedCurrency =
    SUPPORTED_CURRENCIES.find((currency) => currency.code === settings.currency) ??
    SUPPORTED_CURRENCIES[0];

  const selectedStartOfWeek =
    WEEKDAY_OPTIONS.find((option) => option.value === settings.startOfWeek) ?? WEEKDAY_OPTIONS[1];
  const selectedLanguage =
    LANGUAGE_OPTIONS.find((option) => option.value === settings.language) ?? LANGUAGE_OPTIONS[0];
  const selectedCalendar =
    CALENDAR_OPTIONS.find((option) => option.value === settings.calendar) ?? CALENDAR_OPTIONS[0];
  const selectedNumerals =
    NUMERALS_OPTIONS.find((option) => option.value === settings.numerals) ?? NUMERALS_OPTIONS[0];

  const handleThemeChange = async (theme: ThemePreference) => {
    await updateSetting('theme', theme);
  };

  const handleTypeChange = async (type: TransactionType) => {
    await updateSetting('defaultTransactionType', type);
  };

  const handleHapticsChange = async (value: 'on' | 'off') => {
    await updateSetting('haptics', value === 'on' ? 'true' : 'false');
  };

  const handleReset = async () => {
    try {
      setBusy(true);
      await resetAllTransactions(db);
      void hapticMediumImpact();
      setResetOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const backupDisabled = busy || backupBusy !== null;

  const handleExportJson = async () => {
    setBackupMsg(null);
    try {
      await exportJson();
      void hapticSuccess();
      setBackupMsg({ kind: 'success', text: t('set.exportDone') });
    } catch (error) {
      void hapticError();
      setBackupMsg({ kind: 'error', text: messageFor(error) });
    }
  };

  const handleExportCsv = async () => {
    setBackupMsg(null);
    try {
      await exportCsv();
      void hapticSuccess();
      setBackupMsg({ kind: 'success', text: t('set.exportDone') });
    } catch (error) {
      void hapticError();
      setBackupMsg({ kind: 'error', text: messageFor(error) });
    }
  };

  const messageFor = (error: unknown): string => {
    if (error instanceof BackupError) {
      return t(error.code === 'empty-csv' ? 'set.csvNoRows' : 'set.jsonInvalid');
    }
    return error instanceof Error ? error.message : t('set.fallbackError');
  };

  const summarizeImport = (summary: ImportSummary): string => {
    if (summary.kind === 'csv') {
      const unmapped =
        summary.unmapped > 0
          ? t('set.csvUnmapped', { count: summary.unmapped, plural: plural(summary.unmapped) })
          : '';
      const invalid =
        summary.invalid > 0
          ? t('set.csvInvalid', { count: summary.invalid, plural: plural(summary.invalid) })
          : '';
      return t('set.csvSummary', {
        imported: summary.imported,
        plural: plural(summary.imported),
        unmapped,
        invalid,
      });
    }
    const accounts =
      summary.accountsAdded > 0
        ? t('set.importAccounts', {
            count: summary.accountsAdded,
            plural: plural(summary.accountsAdded),
          })
        : '';
    return t('set.importSummary', {
      imported: summary.imported,
      importedPlural: plural(summary.imported),
      skipped: summary.skipped,
      skippedPlural: plural(summary.skipped),
      categories: summary.categoriesAdded,
      categoriesPlural: plural(summary.categoriesAdded),
      accounts,
    });
  };

  const handleImport = async () => {
    setBackupMsg(null);
    try {
      const summary = await importFile();
      if (summary) {
        void hapticSuccess();
        setBackupMsg({ kind: 'success', text: summarizeImport(summary) });
      }
    } catch (error) {
      void hapticError();
      setBackupMsg({ kind: 'error', text: messageFor(error) });
    }
  };

  return (
    <View className="bg-background flex-1">
      <PageHeader title={t('set.title')} />

      <ScrollView contentContainerClassName="gap-6 pb-28" showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <Section title={t('set.general')}>
          <Row
            label={t('set.currency')}
            value={`${selectedCurrency.code} (${selectedCurrency.symbol})`}
            onPress={() => setCurrencyOpen(true)}
          />
          <View className="bg-border mx-4 h-px" />
          <Row
            label={t('set.language')}
            value={t(selectedLanguage.labelKey)}
            onPress={() => setLanguageOpen(true)}
          />
          <View className="bg-border mx-4 h-px" />
          <Row
            label={t('set.calendar')}
            value={t(selectedCalendar.labelKey)}
            onPress={() => setCalendarOpen(true)}
          />
          <View className="bg-border mx-4 h-px" />
          <Row
            label={t('set.numerals')}
            value={t(selectedNumerals.labelKey)}
            onPress={() => setNumeralsOpen(true)}
          />
          <View className="bg-border mx-4 h-px" />
          <View className="gap-2 px-4 py-3.5">
            <Text className="text-sm">{t('set.theme')}</Text>
            <SegmentedControl
              options={THEME_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
              }))}
              value={settings.theme}
              onChange={handleThemeChange}
            />
          </View>
        </Section>

        <Section title={t('set.preferences')}>
          <View className="gap-2 px-4 py-3.5">
            <Text className="text-sm">{t('set.defaultType')}</Text>
            <SegmentedControl
              options={TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
              }))}
              value={settings.defaultTransactionType}
              onChange={handleTypeChange}
            />
          </View>
          <View className="bg-border mx-4 h-px" />
          <Row
            label={t('set.startWeek')}
            value={t(selectedStartOfWeek.labelKey)}
            onPress={() => setStartOfWeekOpen(true)}
          />
          <View className="bg-border mx-4 h-px" />
          <View className="gap-2 px-4 py-3.5">
            <Text className="text-sm">{t('set.haptics')}</Text>
            <SegmentedControl
              options={[
                { value: 'on' as const, label: t('set.on') },
                { value: 'off' as const, label: t('set.off') },
              ]}
              value={settings.haptics ? 'on' : 'off'}
              onChange={handleHapticsChange}
            />
          </View>
        </Section>

        <Section title={t('set.categories')}>
          <Row
            label={t('set.manageCategories')}
            value={t('set.manageDesc')}
            onPress={() => router.push('/categories')}
          />
        </Section>

        <Section title={t('set.data')}>
          <Row
            label={t('set.exportBackup')}
            value={backupBusy === 'export-json' ? t('common.working') : t('set.jsonFile')}
            onPress={backupDisabled ? undefined : handleExportJson}
          />
          <View className="bg-border mx-4 h-px" />
          <Row
            label={t('set.exportTx')}
            value={backupBusy === 'export-csv' ? t('common.working') : t('set.csvFile')}
            onPress={backupDisabled ? undefined : handleExportCsv}
          />
          <View className="bg-border mx-4 h-px" />
          <Row
            label={t('set.importData')}
            value={backupBusy === 'import' ? t('common.working') : t('set.jsonOrCsv')}
            onPress={backupDisabled ? undefined : handleImport}
          />
          <View className="bg-border mx-4 h-px" />
          <Row label={t('set.resetData')} destructive onPress={() => setResetOpen(true)} />
          {backupMsg ? (
            <>
              <View className="bg-border mx-4 h-px" />
              <View className="px-4 py-3">
                <Text
                  selectable
                  className={
                    backupMsg.kind === 'success'
                      ? 'text-sm text-positive'
                      : 'text-sm text-destructive'
                  }
                >
                  {backupMsg.text}
                </Text>
              </View>
            </>
          ) : null}
        </Section>

        <Section title={t('set.about')}>
          <View className="gap-1 px-4 py-3.5">
            <Text className="text-sm font-semibold">{t('set.aboutName')}</Text>
            <Text variant="muted" className="text-sm">
              {t('set.aboutDesc')}
            </Text>
            <Text variant="muted" className="text-xs">
              {t('set.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
            </Text>
          </View>
          {Platform.OS === 'android' ? (
            <>
              <View className="bg-border mx-4 h-px" />
              <Row label={t('set.checkUpdates')} onPress={checkNow}>
                {isChecking ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" />
                    <Text variant="muted" className="text-sm">
                      {t('set.checking')}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1">
                    {updateState.status === 'available' ? (
                      <Text className="text-primary text-sm font-medium">
                        {t('set.available', { version: updateState.latestVersion })}
                      </Text>
                    ) : updateState.status === 'error' ? (
                      <Text variant="muted" className="text-sm">
                        {t('set.checkFailed')}
                      </Text>
                    ) : (
                      <Text variant="muted" className="text-sm">
                        {t('set.upToDate')}
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

      <OptionDialog
        open={currencyOpen}
        onOpenChange={setCurrencyOpen}
        title={t('set.chooseCurrency')}
        description={t('set.currencyDesc')}
      >
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
                {selected ? <Icon as={Check} size={16} className="text-primary" /> : null}
              </Pressable>
            </View>
          );
        })}
      </OptionDialog>

      <OptionDialog
        open={languageOpen}
        onOpenChange={setLanguageOpen}
        title={t('set.chooseLanguage')}
      >
        {LANGUAGE_OPTIONS.map((option, index) => {
          const selected = option.value === settings.language;
          return (
            <View key={option.value}>
              {index > 0 ? <View className="bg-border h-px" /> : null}
              <Pressable
                onPress={async () => {
                  await updateSetting('language', option.value);
                  setLanguageOpen(false);
                }}
                className="flex-row items-center justify-between py-3"
              >
                <Text className="text-sm font-medium">{t(option.labelKey)}</Text>
                {selected ? <Icon as={Check} size={16} className="text-primary" /> : null}
              </Pressable>
            </View>
          );
        })}
      </OptionDialog>

      <OptionDialog
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        title={t('set.chooseCalendar')}
        description={t('set.calendarDesc')}
      >
        {CALENDAR_OPTIONS.map((option, index) => {
          const selected = option.value === settings.calendar;
          return (
            <View key={option.value}>
              {index > 0 ? <View className="bg-border h-px" /> : null}
              <Pressable
                onPress={async () => {
                  await updateSetting('calendar', option.value);
                  setCalendarOpen(false);
                }}
                className="flex-row items-center justify-between py-3"
              >
                <Text className="text-sm font-medium">{t(option.labelKey)}</Text>
                {selected ? <Icon as={Check} size={16} className="text-primary" /> : null}
              </Pressable>
            </View>
          );
        })}
      </OptionDialog>

      <OptionDialog
        open={numeralsOpen}
        onOpenChange={setNumeralsOpen}
        title={t('set.chooseNumerals')}
      >
        {NUMERALS_OPTIONS.map((option, index) => {
          const selected = option.value === settings.numerals;
          return (
            <View key={option.value}>
              {index > 0 ? <View className="bg-border h-px" /> : null}
              <Pressable
                onPress={async () => {
                  await updateSetting('numerals', option.value);
                  setNumeralsOpen(false);
                }}
                className="flex-row items-center justify-between py-3"
              >
                <Text className="text-sm font-medium">{t(option.labelKey)}</Text>
                {selected ? <Icon as={Check} size={16} className="text-primary" /> : null}
              </Pressable>
            </View>
          );
        })}
      </OptionDialog>

      <OptionDialog
        open={startOfWeekOpen}
        onOpenChange={setStartOfWeekOpen}
        title={t('set.weekTitle')}
        description={t('set.weekDesc')}
      >
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
                <Text className="text-sm font-medium">{t(option.labelKey)}</Text>
                {selected ? <Icon as={Check} size={16} className="text-primary" /> : null}
              </Pressable>
            </View>
          );
        })}
      </OptionDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('set.resetTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('set.resetDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>{t('common.cancel')}</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={handleReset}
              disabled={busy}
              className="bg-destructive dark:bg-destructive/60"
            >
              <Text className="text-white font-medium">{t('set.reset')}</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

function OptionDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>{t('common.cancel')}</Text>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
