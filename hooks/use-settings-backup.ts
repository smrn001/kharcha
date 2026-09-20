import { BackupError, useBackup, type ImportSummary } from '@/hooks/use-backup';
import { useI18n } from '@/hooks/use-i18n';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useState } from 'react';

export type BackupMessage = { kind: 'success' | 'error'; text: string } | null;

/**
 * Wraps the export/import backup actions with busy state and a one-line
 * result message shown under the Data section.
 */
export function useSettingsBackup() {
  const { t, plural } = useI18n();
  const { busy, exportJson, exportCsv, importFile } = useBackup();
  const [message, setMessage] = useState<BackupMessage>(null);

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

  const disabled = busy !== null;

  const runExportJson = async () => {
    if (disabled) return;
    setMessage(null);
    try {
      await exportJson();
      void hapticSuccess();
      setMessage({ kind: 'success', text: t('set.exportDone') });
    } catch (error) {
      void hapticError();
      setMessage({ kind: 'error', text: messageFor(error) });
    }
  };

  const runExportCsv = async () => {
    if (disabled) return;
    setMessage(null);
    try {
      await exportCsv();
      void hapticSuccess();
      setMessage({ kind: 'success', text: t('set.exportDone') });
    } catch (error) {
      void hapticError();
      setMessage({ kind: 'error', text: messageFor(error) });
    }
  };

  const runImport = async () => {
    if (disabled) return;
    setMessage(null);
    try {
      const summary = await importFile();
      if (summary) {
        void hapticSuccess();
        setMessage({ kind: 'success', text: summarizeImport(summary) });
      }
    } catch (error) {
      void hapticError();
      setMessage({ kind: 'error', text: messageFor(error) });
    }
  };

  return { busy, message, disabled, runExportJson, runExportCsv, runImport };
}