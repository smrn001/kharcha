import type { SQLiteDatabase } from 'expo-sqlite';
import type { Settings, ThemePreference, TransactionType } from '@/types';

interface SettingsRow {
  key: string;
  value: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  currency: 'NPR',
  theme: 'system',
  defaultTransactionType: 'expense',
  startOfWeek: 1,
};

function parseStartOfWeek(value: string | null | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : DEFAULT_SETTINGS.startOfWeek;
}

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<SettingsRow>('SELECT key, value FROM settings');
  const map: Record<string, string | null> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return {
    currency: map.currency ?? DEFAULT_SETTINGS.currency,
    theme: (map.theme as ThemePreference | null) ?? DEFAULT_SETTINGS.theme,
    defaultTransactionType: (map.defaultTransactionType as TransactionType | null) ?? DEFAULT_SETTINGS.defaultTransactionType,
    startOfWeek: parseStartOfWeek(map.startOfWeek),
  };
}

export async function setSetting(
  db: SQLiteDatabase,
  key: keyof Settings,
  value: string
): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}
