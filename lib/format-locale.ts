import type { FormatLang, FormatNumerals } from './format';

/**
 * App-wide money format defaults (language + numerals from Settings).
 *
 * `formatAmount` / `formatAmountCompact` fall back to these when a call site
 * does not pass explicit options, so screens do not need to thread locale
 * props through every component. `SettingsProvider` syncs this on load and
 * on every settings change; tests reset it explicitly.
 */

interface FormatLocale {
  lang: FormatLang;
  numerals: FormatNumerals;
}

const defaults: FormatLocale = { lang: 'en', numerals: 'latin' };

export function setDefaultFormatLocale(locale: Partial<FormatLocale>): void {
  if (locale.lang) defaults.lang = locale.lang;
  if (locale.numerals) defaults.numerals = locale.numerals;
}

export function getDefaultFormatLocale(): FormatLocale {
  return { ...defaults };
}

export function resetDefaultFormatLocale(): void {
  defaults.lang = 'en';
  defaults.numerals = 'latin';
}
