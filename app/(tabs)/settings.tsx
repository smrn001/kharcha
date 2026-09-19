import { ConfirmSheet } from '@/components/confirm-sheet';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PageHeader } from '@/components/page-header';
import { BackupError, useBackup, type ImportSummary } from '@/hooks/use-backup';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useUpdateChecker } from '@/hooks/use-update-checker';
import { resetAllTransactions } from '@/lib/db/transactions';
import { SUPPORTED_CURRENCIES } from '@/lib/format';
import { hapticError, hapticMediumImpact, hapticSuccess } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Host, Picker, Switch } from '@expo/ui';
import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ChevronRight, RefreshCw } from 'lucide-react-native';
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

function Divider() {
  return <View className="bg-border mx-4 h-px" />;
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
      <Text className={cn('flex-1 text-sm', destructive && 'text-destructive font-medium')}>
        {label}
      </Text>
      {children ? (
        // Native Compose views (Switch/Picker) need <Host> as their immediate parent.
        Platform.OS === 'web' ? (
          children
        ) : (
          <Host>{children}</Host>
        )
      ) : (
        <View className="flex-row items-center gap-1">
          {value ? (
            <Text variant="muted" className="text-sm">
              {value}
            </Text>
          ) : null}
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
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null
  );

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
      void hapticMediumImpact();
      setResetOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const backupDisabled = busy || backupBusy !== null;

  const handleExportJson = async () => {
    if (backupDisabled) return;
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
    if (backupDisabled) return;
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
    if (backupDisabled) return;
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
          <Row label={t('set.currency')}>
            <Picker
              appearance="menu"
              selectedValue={settings.currency}
              onValueChange={(value) => updateSetting('currency', value)}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <Picker.Item
                  key={currency.code}
                  label={`${currency.name} (${currency.symbol})`}
                  value={currency.code}
                />
              ))}
            </Picker>
          </Row>
          <Divider />
          <Row label={t('set.language')}>
            <Picker
              appearance="menu"
              selectedValue={settings.language}
              onValueChange={(value: LanguagePreference) => updateSetting('language', value)}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
              ))}
            </Picker>
          </Row>
          <Divider />
          <Row label={t('set.calendar')}>
            <Picker
              appearance="menu"
              selectedValue={settings.calendar}
              onValueChange={(value: CalendarPreference) => updateSetting('calendar', value)}
            >
              {CALENDAR_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
              ))}
            </Picker>
          </Row>
          <Divider />
          <Row label={t('set.numerals')}>
            <Picker
              appearance="menu"
              selectedValue={settings.numerals}
              onValueChange={(value: NumeralsPreference) => updateSetting('numerals', value)}
            >
              {NUMERALS_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
              ))}
            </Picker>
          </Row>
          <Divider />
          <Row label={t('set.theme')}>
            <Picker appearance="menu" selectedValue={settings.theme} onValueChange={handleThemeChange}>
              {THEME_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
              ))}
            </Picker>
          </Row>
        </Section>

        <Section title={t('set.preferences')}>
          <Row label={t('set.defaultType')}>
            <Picker
              appearance="menu"
              selectedValue={settings.defaultTransactionType}
              onValueChange={handleTypeChange}
            >
              {TYPE_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
              ))}
            </Picker>
          </Row>
          <Divider />
          <Row label={t('set.startWeek')}>
            <Picker
              appearance="menu"
              selectedValue={settings.startOfWeek}
              onValueChange={(value: number) => updateSetting('startOfWeek', value)}
            >
              {WEEKDAY_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
              ))}
            </Picker>
          </Row>
          <Divider />
          <Row label={t('set.haptics')}>
            <Switch
              value={settings.haptics}
              onValueChange={(value) => updateSetting('haptics', value ? 'true' : 'false')}
            />
          </Row>
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
          <Divider />
          <Row
            label={t('set.exportTx')}
            value={backupBusy === 'export-csv' ? t('common.working') : t('set.csvFile')}
            onPress={backupDisabled ? undefined : handleExportCsv}
          />
          <Divider />
          <Row
            label={t('set.importData')}
            value={backupBusy === 'import' ? t('common.working') : t('set.jsonOrCsv')}
            onPress={backupDisabled ? undefined : handleImport}
          />
          <Divider />
          <Row label={t('set.resetData')} destructive onPress={() => setResetOpen(true)} />
          {backupMsg ? (
            <>
              <Divider />
              <View className="px-4 py-3">
                <Text
                  selectable
                  className={cn(
                    'text-sm',
                    backupMsg.kind === 'success' ? 'text-positive' : 'text-destructive'
                  )}
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
              <Divider />
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

      <ConfirmSheet
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t('set.resetTitle')}
        description={t('set.resetDesc')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('set.reset')}
        busy={busy}
        onConfirm={handleReset}
      />
    </View>
  );
}
