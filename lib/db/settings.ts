import type { SQLiteDatabase } from 'expo-sqlite';
import { getLocales } from 'expo-localization';
import type {
  CalendarPreference,
  LanguagePreference,
  NumeralsPreference,
  Settings,
  ThemePreference,
  TransactionType,
} from '@/types';

interface SettingsRow {
  key: string;
  value: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  currency: 'NPR',
  defaultTransactionType: 'expense',
  startOfWeek: 0,
  language: 'en',
  calendar: 'ad',
  numerals: 'latin',
  haptics: true,
  theme: 'system',
};

/** Device language, falling back to English when detection fails. */
export function deviceLanguage(): LanguagePreference {
  try {
    const code = getLocales()[0]?.languageCode?.toLowerCase() ?? '';
    if (code === 'ne' || code.startsWith('ne-') || code.startsWith('ne_')) return 'ne';
  } catch {
    // Detection is best-effort; settings carry the default.
  }
  return 'en';
}

function parseStartOfWeek(value: string | null | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : DEFAULT_SETTINGS.startOfWeek;
}

function parseLanguage(value: string | null | undefined): LanguagePreference {
  return value === 'ne' ? 'ne' : 'en';
}

function parseCalendar(value: string | null | undefined): CalendarPreference {
  return value === 'bs' || value === 'both' ? value : 'ad';
}

function parseNumerals(value: string | null | undefined): NumeralsPreference {
  return value === 'devanagari' ? 'devanagari' : 'latin';
}

function parseTheme(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<SettingsRow>('SELECT key, value FROM settings');
  const map: Record<string, string | null> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return {
    currency: map.currency ?? DEFAULT_SETTINGS.currency,
    defaultTransactionType: (map.defaultTransactionType as TransactionType | null) ?? DEFAULT_SETTINGS.defaultTransactionType,
    startOfWeek: parseStartOfWeek(map.startOfWeek),
    language: map.language ? parseLanguage(map.language) : deviceLanguage(),
    calendar: parseCalendar(map.calendar),
    numerals: parseNumerals(map.numerals),
    haptics: map.haptics == null ? DEFAULT_SETTINGS.haptics : map.haptics !== 'false',
    theme: parseTheme(map.theme),
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
