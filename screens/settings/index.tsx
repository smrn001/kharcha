import { ConfirmSheet } from '@/components/confirm-sheet';
import { FieldRow } from '@/components/field-row';
import { SelectionSheet } from '@/components/selection-sheet';
import { FieldGroup, Host, Switch, Text } from '@expo/ui';
import { AboutSection } from './components/about-section';
import { DataSection } from './components/data-section';
import { useSettingsSheet } from '@/hooks/use-settings-sheet';
import { useSettingsBackup } from '@/hooks/use-settings-backup';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useUpdateChecker } from '@/hooks/use-update-checker';
import {
  optionLabel,
  CALENDAR_OPTIONS,
  LANGUAGE_OPTIONS,
  NUMERALS_OPTIONS,
  THEME_OPTIONS,
  TYPE_OPTIONS,
  WEEKDAY_OPTIONS,
} from '@/lib/settings-options';
import { resetAllTransactions } from '@/lib/db/transactions';
import { SUPPORTED_CURRENCIES } from '@/lib/format';
import { hapticMediumImpact } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { useState } from 'react';
import { View, useColorScheme } from 'react-native';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { settings, updateSetting } = useSettings();
  const { t } = useI18n();
  const colors = useTheme();
  const scheme = useColorScheme();
  const { state: updateState, isChecking, checkNow } = useUpdateChecker();
  const sheet = useSettingsSheet(settings);
  const backup = useSettingsBackup();

  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const currencyLabel = SUPPORTED_CURRENCIES.find((c) => c.code === settings.currency);

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

  const backupDisabled = busy || backup.disabled;

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

            <FieldRow
              label={t('set.theme')}
              value={optionLabel(t, THEME_OPTIONS, settings.theme)}
              onPress={() => sheet.open('theme')}
            />
            <FieldRow
              label={t('set.currency')}
              value={currencyLabel ? `${currencyLabel.name} (${currencyLabel.symbol})` : settings.currency}
              onPress={() => sheet.open('currency')}
            />
            <FieldRow
              label={t('set.language')}
              value={optionLabel(t, LANGUAGE_OPTIONS, settings.language)}
              onPress={() => sheet.open('language')}
            />
            <FieldRow
              label={t('set.calendar')}
              value={optionLabel(t, CALENDAR_OPTIONS, settings.calendar)}
              onPress={() => sheet.open('calendar')}
            />
            <FieldRow
              label={t('set.numerals')}
              value={optionLabel(t, NUMERALS_OPTIONS, settings.numerals)}
              onPress={() => sheet.open('numerals')}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title={t('set.preferences')}>
            <FieldRow
              label={t('set.defaultType')}
              value={optionLabel(t, TYPE_OPTIONS, settings.defaultTransactionType)}
              onPress={() => sheet.open('defaultType')}
            />
            <FieldRow
              label={t('set.startWeek')}
              value={optionLabel(t, WEEKDAY_OPTIONS, settings.startOfWeek)}
              onPress={() => sheet.open('week')}
            />
            <Switch
              label={t('set.haptics')}
              value={settings.haptics}
              onValueChange={(value) => updateSetting('haptics', value ? 'true' : 'false')}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title={t('set.categories')}>
            <FieldRow
              label={t('set.manageCategories')}
              supporting={t('set.manageDesc')}
              onPress={() => router.push('/categories')}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title={t('set.data')}>
            <DataSection
              busy={backup.busy}
              message={backup.message}
              disabled={backupDisabled}
              onExportJson={backup.runExportJson}
              onExportCsv={backup.runExportCsv}
              onImport={backup.runImport}
              onReset={() => setResetOpen(true)}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title={t('set.about')}>
            <AboutSection
              updateState={updateState}
              isChecking={isChecking}
              checkNow={checkNow}
            />
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

      {sheet.content ? (
        <SelectionSheet
          open
          onOpenChange={(open) => {
            if (!open) sheet.close();
          }}
          title={sheet.content.title}
          options={sheet.content.options}
          selected={sheet.content.selected}
          onSelect={sheet.select}
        />
      ) : null}
    </View>
  );
}