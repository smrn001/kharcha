import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  backupFileName,
  detectBackupKind,
  exportTextFile,
  pickBackupFile,
} from '@/lib/backup-files';
import {
  backupToCsv,
  collectBackup,
  importBackup,
  importCsvRows,
  parseCsv,
  serializeBackup,
  validateBackup,
} from '@/lib/db/backup';

export type BackupBusyState = 'export-json' | 'export-csv' | 'import' | null;

/**
 * Screen-level backup actions. Follows Screen → Hook → Repository → SQLite:
 * this hook wires UI state to the backup repository and file helpers.
 */
export function useBackup() {
  const db = useSQLiteContext();
  const [busy, setBusy] = useState<BackupBusyState>(null);

  const exportJson = useCallback(async (): Promise<void> => {
    setBusy('export-json');
    try {
      const data = await collectBackup(db);
      await exportTextFile({
        fileName: backupFileName('json'),
        contents: serializeBackup(data),
        mimeType: 'application/json',
      });
    } finally {
      setBusy(null);
    }
  }, [db]);

  const exportCsv = useCallback(async (): Promise<void> => {
    setBusy('export-csv');
    try {
      const data = await collectBackup(db);
      await exportTextFile({
        fileName: backupFileName('csv'),
        contents: backupToCsv(data),
        mimeType: 'text/csv',
      });
    } finally {
      setBusy(null);
    }
  }, [db]);

  /**
   * Pick a JSON/CSV file and merge it. Resolves to a summary message, or
   * null when the user cancelled. Never deletes existing data.
   */
  const importFile = useCallback(async (): Promise<string | null> => {
    setBusy('import');
    try {
      const picked = await pickBackupFile();
      if (!picked) return null;

      if (detectBackupKind(picked.name, picked.text) === 'csv') {
        const { rows, errors } = parseCsv(picked.text);
        if (rows.length === 0) {
          throw new Error(errors[0] ?? 'No valid transactions found in this CSV file.');
        }
        const result = await importCsvRows(db, rows);
        let message = `Imported ${result.imported} transaction${result.imported === 1 ? '' : 's'}.`;
        if (result.unmapped > 0) {
          message += ` ${result.unmapped} row${result.unmapped === 1 ? '' : 's'} used the Other category (unknown name).`;
        }
        if (errors.length > 0) {
          message += ` Skipped ${errors.length} invalid row${errors.length === 1 ? '' : 's'}.`;
        }
        return message;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(picked.text);
      } catch {
        throw new Error('This file is not valid JSON. Pick a Kharcha backup (.json) file.');
      }
      const validated = validateBackup(parsed);
      if (!validated.ok) {
        throw new Error(validated.error);
      }
      const result = await importBackup(db, validated.data);
      return (
        `Imported ${result.imported} transaction${result.imported === 1 ? '' : 's'}. ` +
        `Skipped ${result.skipped} duplicate${result.skipped === 1 ? '' : 's'}. ` +
        `Added ${result.categoriesAdded} categor${result.categoriesAdded === 1 ? 'y' : 'ies'}` +
        (result.accountsAdded > 0 ? ` and ${result.accountsAdded} account${result.accountsAdded === 1 ? '' : 's'}.` : '.')
      );
    } finally {
      setBusy(null);
    }
  }, [db]);

  return { busy, exportJson, exportCsv, importFile };
}
