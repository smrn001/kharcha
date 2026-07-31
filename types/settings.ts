import type { TransactionType } from './transaction';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  currency: string;
  theme: ThemePreference;
  defaultTransactionType: TransactionType;
  startOfWeek: number;
}
