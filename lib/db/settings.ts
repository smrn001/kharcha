import type { SQLiteDatabase } from 'expo-sqlite';
import type { Settings, ThemePreference } from '@/types';

interface SettingsRow {
  key: string;
  value: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  currency: 'NPR',
  theme: 'system',
};

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<SettingsRow>('SELECT key, value FROM settings');
  const map: Record<string, string | null> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return {
    currency: map.currency ?? DEFAULT_SETTINGS.currency,
    theme: (map.theme as ThemePreference | null) ?? DEFAULT_SETTINGS.theme,
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
