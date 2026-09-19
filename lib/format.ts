import { toDevanagariDigits } from './calendar/bs';
import { getDefaultFormatLocale } from './format-locale';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'NPR', symbol: 'Rs.', name: 'Nepalese Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const EN_SYMBOLS: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency.symbol])
);

const NE_SYMBOLS: Record<string, string> = {
  NPR: 'रू',
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};

/** Per-transaction cap: Rs. 100 crore in minor units. */
export const MAX_TRANSACTION_MINOR = 100_000_000_000;

export type FormatLang = 'en' | 'ne';
export type FormatNumerals = 'latin' | 'devanagari';

export interface FormatOptions {
  lang?: FormatLang;
  numerals?: FormatNumerals;
}

function symbolFor(currency: string, lang: FormatLang): string {
  if (lang === 'ne') return NE_SYMBOLS[currency] ?? `${currency} `;
  return EN_SYMBOLS[currency] ?? `${currency} `;
}

function isLakhCurrency(currency: string): boolean {
  return currency === 'NPR' || currency === 'INR';
}

function groupWestern(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Lakh/crore grouping: last 3 digits, then groups of 2 (12,34,567). */
export function groupLakhCrore(value: string): string {
  if (value.length <= 3) return value;
  const lastThree = value.slice(-3);
  let rest = value.slice(0, -3);
  const groups: string[] = [];
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  groups.unshift(rest);
  groups.push(lastThree);
  return groups.join(',');
}

function localizeDigits(value: string, numerals: FormatNumerals): string {
  return numerals === 'devanagari' ? toDevanagariDigits(value) : value;
}

/**
 * Central money formatter. Minor units in, display string out.
 * Decimals appear only for non-zero paisa; negatives read `-Rs. 1,250`.
 */
export function formatAmount(
  minorUnits: number,
  currency = 'NPR',
  opts: FormatOptions = {}
): string {
  const fallback = getDefaultFormatLocale();
  const lang = opts.lang ?? fallback.lang;
  const numerals = opts.numerals ?? fallback.numerals;
  const symbol = symbolFor(currency, lang);
  const negative = minorUnits < 0;
  const abs = Math.abs(minorUnits);
  const major = Math.floor(abs / 100);
  const fraction = abs % 100;
  const grouped = isLakhCurrency(currency)
    ? groupLakhCrore(major.toString())
    : groupWestern(major.toString());
  const number =
    fraction === 0 ? grouped : `${grouped}.${fraction.toString().padStart(2, '0')}`;
  return `${negative ? '-' : ''}${symbol} ${localizeDigits(number, numerals)}`;
}

function trimOneDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Compact format for charts and tight spaces: 1.5K, 1.5L, 2.5Cr. */
export function formatAmountCompact(
  minorUnits: number,
  currency = 'NPR',
  opts: FormatOptions = {}
): string {
  const fallback = getDefaultFormatLocale();
  const lang = opts.lang ?? fallback.lang;
  const numerals = opts.numerals ?? fallback.numerals;
  const symbol = symbolFor(currency, lang);
  const negative = minorUnits < 0;
  const major = Math.floor(Math.abs(minorUnits) / 100);

  let scaled: string;
  if (isLakhCurrency(currency)) {
    if (major >= 10_000_000) {
      scaled = `${trimOneDecimal(major / 10_000_000)}${lang === 'ne' ? 'करोड' : 'Cr'}`;
    } else if (major >= 100_000) {
      scaled = `${trimOneDecimal(major / 100_000)}${lang === 'ne' ? 'लाख' : 'L'}`;
    } else if (major >= 1000) {
      scaled = `${trimOneDecimal(major / 1000)}${lang === 'ne' ? 'हजार' : 'K'}`;
    } else {
      scaled = groupLakhCrore(major.toString());
    }
  } else {
    if (major >= 1_000_000_000) {
      scaled = `${trimOneDecimal(major / 1_000_000_000)}B`;
    } else if (major >= 1_000_000) {
      scaled = `${trimOneDecimal(major / 1_000_000)}M`;
    } else if (major >= 1000) {
      scaled = `${trimOneDecimal(major / 1000)}K`;
    } else {
      scaled = groupWestern(major.toString());
    }
  }
  return `${negative ? '-' : ''}${symbol} ${localizeDigits(scaled, numerals)}`;
}

export function minorUnitsToInput(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2).replace(/\.00$/, '');
}

const DEVANAGARI_TO_LATIN: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

export function parseAmountToMinorUnits(input: string): number | null {
  const normalized = input.replace(/[०-९]/g, (digit) => DEVANAGARI_TO_LATIN[digit]);
  const cleaned = normalized.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const parts = cleaned.split('.');
  if (parts.length > 2) return null;

  const major = parts[0] === '' ? 0 : parseInt(parts[0], 10);
  if (Number.isNaN(major)) return null;

  const fraction = (parts[1] ?? '').slice(0, 2);
  const minor = fraction.length === 0 ? 0 : parseInt(fraction.padEnd(2, '0'), 10);

  return major * 100 + minor;
}
