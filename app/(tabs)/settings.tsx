import { ConfirmSheet } from '@/components/confirm-sheet';
import { SelectionRow } from '@/components/selection-row';
import { SelectionSheet } from '@/components/selection-sheet';
import { Button, Column, FieldGroup, Host, Icon, Row, Spacer, Switch, Text } from '@expo/ui';
import { BackupError, useBackup, type ImportSummary } from '@/hooks/use-backup';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useUpdateChecker } from '@/hooks/use-update-checker';
import { resetAllTransactions } from '@/lib/db/transactions';
import { SUPPORTED_CURRENCIES } from '@/lib/format';
import { hapticError, hapticMediumImpact, hapticSuccess } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View, useColorScheme } from 'react-native';
import type {
  CalendarPreference,
  LanguagePreference,
  NumeralsPreference,
  ThemePreference,
  TransactionType,
} from '@/types';
import type { DictionaryKey } from '@/lib/i18n/en';

const CHEVRON_ICON = Icon.select({
  ios: 'chevron.right',
  android: import('@expo/material-symbols/chevron_right.xml'),
});

const REFRESH_ICON = Icon.select({
  ios: 'arrow.clockwise',
  android: import('@expo/material-symbols/refresh.xml'),
});

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

const THEME_OPTIONS: { value: ThemePreference; labelKey: DictionaryKey }[] = [
  { value: 'system', labelKey: 'set.themeSystem' },
  { value: 'light', labelKey: 'set.themeLight' },
  { value: 'dark', labelKey: 'set.themeDark' },
];

type SelectionKey =
  | 'theme'
  | 'currency'
  | 'language'
  | 'calendar'
  | 'numerals'
  | 'defaultType'
  | 'week';

function optionLabel(
  t: (key: DictionaryKey) => string,
  values: readonly { value: string | number; labelKey: DictionaryKey }[],
  value: string | number | undefined
): string {
  return t(values.find((option) => option.value === value)?.labelKey ?? values[0].labelKey);
}

function ActionRow({
  label,
  supporting,
  onPress,
  disabled,
  trailing,
}: {
  label: string;
  supporting?: string;
  onPress?: () => void;
  disabled?: boolean;
  trailing?: React.ReactNode;
}) {
  const colors = useTheme();
  return (
    <Button
      variant="text"
      onPress={onPress}
      disabled={disabled}
      style={{ paddingVertical: 0, paddingHorizontal: 0, borderRadius: 12 }}
    >
      <Row alignment="center" spacing={12}>
        <Column spacing={2}>
          <Text textStyle={{ fontSize: 16, color: colors.text }}>{label}</Text>
          {supporting ? (
            <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>{supporting}</Text>
          ) : null}
        </Column>
        <Spacer flexible />
        {trailing ?? <Icon name={CHEVRON_ICON} size={16} color={colors.textSecondary} />}
      </Row>
    </Button>
  );
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { settings, updateSetting } = useSettings();
  const { t, plural } = useI18n();
  const colors = useTheme();
  const scheme = useColorScheme();
  const { state: updateState, isChecking, checkNow } = useUpdateChecker();
  const { busy: backupBusy, exportJson, exportCsv, importFile } = useBackup();
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<SelectionKey | null>(null);
  const [backupMsg, setBackupMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleTypeChange = async (type: TransactionType) => {
    await updateSetting('defaultTransactionType', type);
  };

  const currencyLabel = SUPPORTED_CURRENCIES.find((c) => c.code === settings.currency);

  const sheetContent: {
    title: string;
    options: { value: string | number; label: string }[];
    selected: string | number | null;
  } | null =
    sheet === 'theme'
      ? {
          title: t('set.chooseTheme'),
          options: THEME_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          })),
          selected: settings.theme,
        }
      : sheet === 'currency'
        ? {
            title: t('set.chooseCurrency'),
            options: SUPPORTED_CURRENCIES.map((c) => ({
              value: c.code,
              label: `${c.name} (${c.symbol})`,
            })),
            selected: settings.currency,
          }
        : sheet === 'language'
          ? {
              title: t('set.chooseLanguage'),
              options: LANGUAGE_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
              })),
              selected: settings.language,
            }
          : sheet === 'calendar'
            ? {
                title: t('set.chooseCalendar'),
                options: CALENDAR_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.labelKey),
                })),
                selected: settings.calendar,
              }
            : sheet === 'numerals'
              ? {
                  title: t('set.chooseNumerals'),
                  options: NUMERALS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: t(option.labelKey),
                  })),
                  selected: settings.numerals,
                }
              : sheet === 'defaultType'
                ? {
                    title: t('set.chooseDefaultType'),
                    options: TYPE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: t(option.labelKey),
                    })),
                    selected: settings.defaultTransactionType,
                  }
                : sheet === 'week'
                  ? {
                      title: t('set.chooseStartWeek'),
                      options: WEEKDAY_OPTIONS.map((option) => ({
                        value: option.value,
                        label: t(option.labelKey),
                      })),
                      selected: settings.startOfWeek,
                    }
                  : null;

  const handleSheetSelect = (value: string | number) => {
    if (sheet === 'theme') void updateSetting('theme', value);
    else if (sheet === 'currency') void updateSetting('currency', value);
    else if (sheet === 'language') void updateSetting('language', value);
    else if (sheet === 'calendar') void updateSetting('calendar', value);
    else if (sheet === 'numerals') void updateSetting('numerals', value);
    else if (sheet === 'defaultType') void handleTypeChange(value as TransactionType);
    else if (sheet === 'week') void updateSetting('startOfWeek', Number(value));
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
    <View style={{ flex: 1 }}>
      <Host style={{ flex: 1 }} colorScheme={scheme ?? 'light'}>
        <FieldGroup>
          <FieldGroup.Section>
            <FieldGroup.SectionHeader>
              <Text textStyle={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
                {t('set.title')}
              </Text>
            </FieldGroup.SectionHeader>

            <SelectionRow
              label={t('set.theme')}
              value={optionLabel(t, THEME_OPTIONS, settings.theme)}
              onPress={() => setSheet('theme')}
            />
            <SelectionRow
              label={t('set.currency')}
              value={currencyLabel ? `${currencyLabel.name} (${currencyLabel.symbol})` : settings.currency}
              onPress={() => setSheet('currency')}
            />
            <SelectionRow
              label={t('set.language')}
              value={optionLabel(t, LANGUAGE_OPTIONS, settings.language)}
              onPress={() => setSheet('language')}
            />
            <SelectionRow
              label={t('set.calendar')}
              value={optionLabel(t, CALENDAR_OPTIONS, settings.calendar)}
              onPress={() => setSheet('calendar')}
            />
            <SelectionRow
              label={t('set.numerals')}
              value={optionLabel(t, NUMERALS_OPTIONS, settings.numerals)}
              onPress={() => setSheet('numerals')}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title={t('set.preferences')}>
            <SelectionRow
              label={t('set.defaultType')}
              value={optionLabel(t, TYPE_OPTIONS, settings.defaultTransactionType)}
              onPress={() => setSheet('defaultType')}
            />
            <SelectionRow
              label={t('set.startWeek')}
              value={optionLabel(t, WEEKDAY_OPTIONS, settings.startOfWeek)}
              onPress={() => setSheet('week')}
            />
            <Switch
              label={t('set.haptics')}
              value={settings.haptics}
              onValueChange={(value) => updateSetting('haptics', value ? 'true' : 'false')}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title={t('set.categories')}>
            <ActionRow
              label={t('set.manageCategories')}
              supporting={t('set.manageDesc')}
              onPress={() => router.push('/categories')}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title={t('set.data')}>
            <ActionRow
              label={t('set.exportBackup')}
              supporting={backupBusy === 'export-json' ? t('common.working') : t('set.jsonFile')}
              onPress={backupDisabled ? undefined : handleExportJson}
              disabled={backupDisabled}
            />
            <ActionRow
              label={t('set.exportTx')}
              supporting={backupBusy === 'export-csv' ? t('common.working') : t('set.csvFile')}
              onPress={backupDisabled ? undefined : handleExportCsv}
              disabled={backupDisabled}
            />
            <ActionRow
              label={t('set.importData')}
              supporting={backupBusy === 'import' ? t('common.working') : t('set.jsonOrCsv')}
              onPress={backupDisabled ? undefined : handleImport}
              disabled={backupDisabled}
            />
            <ActionRow label={t('set.resetData')} onPress={() => setResetOpen(true)} />
            {backupMsg ? (
              <Row alignment="center" spacing={8}>
                <Text
                  textStyle={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: backupMsg.kind === 'success' ? colors.success : colors.destructive,
                  }}
                >
                  {backupMsg.text}
                </Text>
              </Row>
            ) : null}
          </FieldGroup.Section>

          <FieldGroup.Section title={t('set.about')}>
            <Row alignment="center" spacing={8}>
              <Column spacing={2}>
                <Text textStyle={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {t('set.aboutName')}
                </Text>
                <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>
                  {t('set.aboutDesc')}
                </Text>
                <Text textStyle={{ fontSize: 12, color: colors.textSecondary }}>
                  {t('set.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
                </Text>
              </Column>
            </Row>
            {Platform.OS === 'android' ? (
              <ActionRow
                label={t('set.checkUpdates')}
                supporting={
                  isChecking
                    ? t('set.checking')
                    : updateState.status === 'available'
                      ? t('set.available', { version: updateState.latestVersion })
                      : updateState.status === 'error'
                        ? t('set.checkFailed')
                        : t('set.upToDate')
                }
                trailing={<Icon name={REFRESH_ICON} size={16} color={colors.textSecondary} />}
                onPress={checkNow}
                disabled={isChecking}
              />
            ) : null}
          </FieldGroup.Section>
        </FieldGroup>
      </Host>

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

      {sheetContent ? (
        <SelectionSheet
          open
          onOpenChange={(open) => {
            if (!open) setSheet(null);
          }}
          title={sheetContent.title}
          options={sheetContent.options}
          selected={sheetContent.selected}
          onSelect={handleSheetSelect}
        />
      ) : null}
    </View>
  );
}