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

export interface JsonImportSummary {
  kind: 'json';
  imported: number;
  skipped: number;
  categoriesAdded: number;
  accountsAdded: number;
}

export interface CsvImportSummary {
  kind: 'csv';
  imported: number;
  unmapped: number;
  invalid: number;
}

export type ImportSummary = JsonImportSummary | CsvImportSummary;

/**
 * Typed import failures the UI maps to translated messages.
 * Plain Errors carry validation text (already specific, shown as-is).
 */
export class BackupError extends Error {
  readonly code: 'empty-csv' | 'invalid-json';
  constructor(code: 'empty-csv' | 'invalid-json') {
    super(code);
    this.code = code;
  }
}

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
   * Pick a JSON/CSV file and merge it. Resolves to a summary, or null when
   * the user cancelled. Never deletes existing data. Messages are composed
   * by the caller (they need the UI language).
   */
  const importFile = useCallback(async (): Promise<ImportSummary | null> => {
    setBusy('import');
    try {
      const picked = await pickBackupFile();
      if (!picked) return null;

      if (detectBackupKind(picked.name, picked.text) === 'csv') {
        const { rows, errors } = parseCsv(picked.text);
        if (rows.length === 0) {
          throw new BackupError('empty-csv');
        }
        const result = await importCsvRows(db, rows);
        return {
          kind: 'csv',
          imported: result.imported,
          unmapped: result.unmapped,
          invalid: errors.length,
        };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(picked.text);
      } catch {
        throw new BackupError('invalid-json');
      }
      const validated = validateBackup(parsed);
      if (!validated.ok) {
        throw new Error(validated.error);
      }
      const result = await importBackup(db, validated.data);
      return {
        kind: 'json',
        imported: result.imported,
        skipped: result.skipped,
        categoriesAdded: result.categoriesAdded,
        accountsAdded: result.accountsAdded,
      };
    } finally {
      setBusy(null);
    }
  }, [db]);

  return { busy, exportJson, exportCsv, importFile };
}
