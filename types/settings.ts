import type { TransactionType } from './transaction';

export type LanguagePreference = 'en' | 'ne';
export type CalendarPreference = 'ad' | 'bs' | 'both';
export type NumeralsPreference = 'latin' | 'devanagari';

export interface Settings {
  currency: string;
  defaultTransactionType: TransactionType;
  /** 0 = Sunday … 6 = Saturday. Implements PRD `week_start`; defaults to Sunday (Nepal). */
  startOfWeek: number;
  language: LanguagePreference;
  calendar: CalendarPreference;
  numerals: NumeralsPreference;
  haptics: boolean;
}
