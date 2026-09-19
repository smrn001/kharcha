import { ConfirmSheet } from '@/components/confirm-sheet';
import { Column, Icon, Host, ListItem, Picker, Switch, Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { PageHeader } from '@/components/page-header';
import { BackupError, useBackup, type ImportSummary } from '@/hooks/use-backup';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useUpdateChecker } from '@/hooks/use-update-checker';
import { resetAllTransactions } from '@/lib/db/transactions';
import { SUPPORTED_CURRENCIES } from '@/lib/format';
import { hapticError, hapticMediumImpact, hapticSuccess } from '@/lib/haptics';
import { useAppColors } from '@/lib/colors';
import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, View } from 'react-native';
import type {
  CalendarPreference,
  LanguagePreference,
  NumeralsPreference,
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

function SectionLabel({ children }: { children: string }) {
  const colors = useAppColors();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
      <NativeBlock>
        <Text
          textStyle={{
            fontSize: 12,
            fontWeight: '600',
            color: colors.mutedForeground,
          }}
        >
          {children}
        </Text>
      </NativeBlock>
    </View>
  );
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { settings, updateSetting } = useSettings();
  const { t, plural } = useI18n();
  const colors = useAppColors();
  const { state: updateState, isChecking, checkNow } = useUpdateChecker();
  const { busy: backupBusy, exportJson, exportCsv, importFile } = useBackup();
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null
  );

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
      <PageHeader title={t('set.title')} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <SectionLabel>{t('set.general')}</SectionLabel>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.currency')}
            trailing={
              <Host>
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
              </Host>
            }
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.language')}
            trailing={
              <Host>
                <Picker
                  appearance="menu"
                  selectedValue={settings.language}
                  onValueChange={(value) => updateSetting('language', value as LanguagePreference)}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
                  ))}
                </Picker>
              </Host>
            }
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.calendar')}
            trailing={
              <Host>
                <Picker
                  appearance="menu"
                  selectedValue={settings.calendar}
                  onValueChange={(value) => updateSetting('calendar', value as CalendarPreference)}
                >
                  {CALENDAR_OPTIONS.map((option) => (
                    <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
                  ))}
                </Picker>
              </Host>
            }
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.numerals')}
            trailing={
              <Host>
                <Picker
                  appearance="menu"
                  selectedValue={settings.numerals}
                  onValueChange={(value) => updateSetting('numerals', value as NumeralsPreference)}
                >
                  {NUMERALS_OPTIONS.map((option) => (
                    <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
                  ))}
                </Picker>
              </Host>
            }
          />
        </NativeBlock>

        <SectionLabel>{t('set.preferences')}</SectionLabel>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.defaultType')}
            trailing={
              <Host>
                <Picker
                  appearance="menu"
                  selectedValue={settings.defaultTransactionType}
                  onValueChange={(value) => handleTypeChange(value as TransactionType)}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
                  ))}
                </Picker>
              </Host>
            }
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.startWeek')}
            trailing={
              <Host>
                <Picker
                  appearance="menu"
                  selectedValue={settings.startOfWeek}
                  onValueChange={(value) => updateSetting('startOfWeek', Number(value))}
                >
                  {WEEKDAY_OPTIONS.map((option) => (
                    <Picker.Item key={option.value} label={t(option.labelKey)} value={option.value} />
                  ))}
                </Picker>
              </Host>
            }
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.haptics')}
            trailing={
              <Host>
                <Switch
                  value={settings.haptics}
                  onValueChange={(value) => updateSetting('haptics', value ? 'true' : 'false')}
                />
              </Host>
            }
          />
        </NativeBlock>

        <SectionLabel>{t('set.categories')}</SectionLabel>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.manageCategories')}
            supportingText={t('set.manageDesc')}
            trailing={<Icon name={CHEVRON_ICON} size={16} />}
            onPress={() => router.push('/categories')}
          />
        </NativeBlock>

        <SectionLabel>{t('set.data')}</SectionLabel>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.exportBackup')}
            supportingText={backupBusy === 'export-json' ? t('common.working') : t('set.jsonFile')}
            onPress={backupDisabled ? undefined : handleExportJson}
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.exportTx')}
            supportingText={backupBusy === 'export-csv' ? t('common.working') : t('set.csvFile')}
            onPress={backupDisabled ? undefined : handleExportCsv}
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem
            children={t('set.importData')}
            supportingText={backupBusy === 'import' ? t('common.working') : t('set.jsonOrCsv')}
            onPress={backupDisabled ? undefined : handleImport}
          />
        </NativeBlock>
        <NativeBlock matchContents={false}>
          <ListItem children={t('set.resetData')} onPress={() => setResetOpen(true)} />
        </NativeBlock>
        {backupMsg ? (
          <NativeBlock matchContents={false}>
            <ListItem
              children={
                <Text
                  textStyle={{
                    fontSize: 14,
                    color: backupMsg.kind === 'success' ? colors.positive : colors.destructiveError,
                  }}
                >
                  {backupMsg.text}
                </Text>
              }
              onPress={undefined}
            />
          </NativeBlock>
        ) : null}

        <SectionLabel>{t('set.about')}</SectionLabel>
        <NativeBlock matchContents={false}>
          <ListItem
            children={
              <Column spacing={2}>
                <Text textStyle={{ fontSize: 15, fontWeight: '600' }}>{t('set.aboutName')}</Text>
                <Text textStyle={{ fontSize: 13, color: colors.mutedForeground }}>
                  {t('set.aboutDesc')}
                </Text>
                <Text textStyle={{ fontSize: 12, color: colors.mutedForeground }}>
                  {t('set.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
                </Text>
              </Column>
            }
            onPress={undefined}
          />
        </NativeBlock>
        {Platform.OS === 'android' ? (
          <NativeBlock matchContents={false}>
            <ListItem
              children={t('set.checkUpdates')}
              trailing={
                isChecking ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" />
                    <NativeBlock>
                      <Text textStyle={{ fontSize: 14, color: colors.mutedForeground }}>
                        {t('set.checking')}
                      </Text>
                    </NativeBlock>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <NativeBlock>
                      <Text textStyle={{ fontSize: 14, color: colors.mutedForeground }}>
                        {updateState.status === 'available'
                          ? t('set.available', { version: updateState.latestVersion })
                          : updateState.status === 'error'
                            ? t('set.checkFailed')
                            : t('set.upToDate')}
                      </Text>
                    </NativeBlock>
                    <NativeBlock>
                      <Icon name={REFRESH_ICON} size={16} color={colors.mutedForeground} />
                    </NativeBlock>
                  </View>
                )
              }
              onPress={checkNow}
            />
          </NativeBlock>
        ) : null}
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