import type { TransactionType } from './transaction';

export type ThemePreference = 'system' | 'light' | 'dark';
export type LanguagePreference = 'en' | 'ne';
export type CalendarPreference = 'ad' | 'bs' | 'both';
export type NumeralsPreference = 'latin' | 'devanagari';

export interface Settings {
  currency: string;
  theme: ThemePreference;
  defaultTransactionType: TransactionType;
  /** 0 = Sunday … 6 = Saturday. Implements PRD `week_start`; defaults to Sunday (Nepal). */
  startOfWeek: number;
  language: LanguagePreference;
  calendar: CalendarPreference;
  numerals: NumeralsPreference;
  haptics: boolean;
}
