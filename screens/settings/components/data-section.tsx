import { Row, Text } from '@expo/ui';
import { FieldRow } from '@/components/field-row';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/hooks/use-i18n';
import type { BackupBusyState } from '@/hooks/use-backup';
import type { BackupMessage } from '@/hooks/use-settings-backup';

export function DataSection({
  busy,
  message,
  disabled,
  onExportJson,
  onExportCsv,
  onImport,
  onReset,
}: {
  busy: BackupBusyState;
  message: BackupMessage;
  disabled: boolean;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImport: () => void;
  onReset: () => void;
}) {
  const colors = useTheme();
  const { t } = useI18n();
  return (
    <>
      <FieldRow
        label={t('set.exportBackup')}
        supporting={busy === 'export-json' ? t('common.working') : t('set.jsonFile')}
        onPress={disabled ? undefined : onExportJson}
        disabled={disabled}
      />
      <FieldRow
        label={t('set.exportTx')}
        supporting={busy === 'export-csv' ? t('common.working') : t('set.csvFile')}
        onPress={disabled ? undefined : onExportCsv}
        disabled={disabled}
      />
      <FieldRow
        label={t('set.importData')}
        supporting={busy === 'import' ? t('common.working') : t('set.jsonOrCsv')}
        onPress={disabled ? undefined : onImport}
        disabled={disabled}
      />
      <FieldRow label={t('set.resetData')} onPress={onReset} />
      {message ? (
        <Row alignment="center" spacing={8}>
          <Text
            textStyle={{
              fontSize: 14,
              fontWeight: '500',
              color: message.kind === 'success' ? colors.success : colors.destructive,
            }}
          >
            {message.text}
          </Text>
        </Row>
      ) : null}
    </>
  );
}