import { SUPPORTED_CURRENCIES } from '@/lib/format';
import type { Settings } from '@/types';
import type { DictionaryKey } from '@/lib/i18n/en';

export type SelectionKey =
  | 'theme'
  | 'currency'
  | 'language'
  | 'calendar'
  | 'numerals'
  | 'defaultType'
  | 'week';

export interface OptionDef {
  value: string | number;
  labelKey: DictionaryKey;
}

export const TYPE_OPTIONS: OptionDef[] = [
  { value: 'expense', labelKey: 'set.expense' },
  { value: 'income', labelKey: 'set.income' },
];

export const WEEKDAY_OPTIONS: OptionDef[] = [
  { value: 0, labelKey: 'set.sun' },
  { value: 1, labelKey: 'set.mon' },
  { value: 2, labelKey: 'set.tue' },
  { value: 3, labelKey: 'set.wed' },
  { value: 4, labelKey: 'set.thu' },
  { value: 5, labelKey: 'set.fri' },
  { value: 6, labelKey: 'set.sat' },
];

export const LANGUAGE_OPTIONS: OptionDef[] = [
  { value: 'en', labelKey: 'set.english' },
  { value: 'ne', labelKey: 'set.nepali' },
];

export const CALENDAR_OPTIONS: OptionDef[] = [
  { value: 'ad', labelKey: 'set.calAd' },
  { value: 'bs', labelKey: 'set.calBs' },
  { value: 'both', labelKey: 'set.calBoth' },
];

export const NUMERALS_OPTIONS: OptionDef[] = [
  { value: 'latin', labelKey: 'set.latin' },
  { value: 'devanagari', labelKey: 'set.devanagari' },
];

export const THEME_OPTIONS: OptionDef[] = [
  { value: 'system', labelKey: 'set.themeSystem' },
  { value: 'light', labelKey: 'set.themeLight' },
  { value: 'dark', labelKey: 'set.themeDark' },
];

/** Returns the translated label of the currently-selected option. */
export function optionLabel(
  t: (key: DictionaryKey) => string,
  values: readonly OptionDef[],
  value: string | number | undefined
): string {
  return t(values.find((option) => option.value === value)?.labelKey ?? values[0].labelKey);
}

export interface SheetContent {
  title: string;
  options: { value: string | number; label: string }[];
  selected: string | number | null;
}

/** Builds the sheet (title/options/selected) for a given selection key. */
export function sheetContentFor(
  sheet: SelectionKey,
  settings: Settings,
  t: (key: DictionaryKey) => string
): SheetContent | null {
  switch (sheet) {
    case 'theme':
      return {
        title: t('set.chooseTheme'),
        options: THEME_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
        selected: settings.theme,
      };
    case 'currency':
      return {
        title: t('set.chooseCurrency'),
        options: SUPPORTED_CURRENCIES.map((c) => ({
          value: c.code,
          label: `${c.name} (${c.symbol})`,
        })),
        selected: settings.currency,
      };
    case 'language':
      return {
        title: t('set.chooseLanguage'),
        options: LANGUAGE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
        selected: settings.language,
      };
    case 'calendar':
      return {
        title: t('set.chooseCalendar'),
        options: CALENDAR_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
        selected: settings.calendar,
      };
    case 'numerals':
      return {
        title: t('set.chooseNumerals'),
        options: NUMERALS_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
        selected: settings.numerals,
      };
    case 'defaultType':
      return {
        title: t('set.chooseDefaultType'),
        options: TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
        selected: settings.defaultTransactionType,
      };
    case 'week':
      return {
        title: t('set.chooseStartWeek'),
        options: WEEKDAY_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
        selected: settings.startOfWeek,
      };
    default:
      return null;
  }
}