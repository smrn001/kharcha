import type { SQLiteDatabase } from 'expo-sqlite';

const SKIPPED_VERSION_KEY = 'skipped_update_version';

export async function getSkippedUpdateVersion(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM settings WHERE key = ?',
    SKIPPED_VERSION_KEY
  );
  return row?.value ?? null;
}

export async function setSkippedUpdateVersion(db: SQLiteDatabase, version: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    SKIPPED_VERSION_KEY,
    version
  );
}
