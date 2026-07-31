const CURRENCY_SYMBOLS: Record<string, string> = {
  NPR: 'Rs.',
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const MINOR_DIGITS: Record<string, number> = {};

function digitsForCurrency(currency: string): number {
  return MINOR_DIGITS[currency] ?? 2;
}

function groupThousands(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatAmount(minorUnits: number, currency = 'NPR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const digits = digitsForCurrency(currency);
  const negative = minorUnits < 0;
  const abs = Math.abs(minorUnits);
  const major = Math.floor(abs / 10 ** digits);
  const fraction = abs % 10 ** digits;
  const majorStr = groupThousands(major.toString());
  const value =
    digits > 0 ? `${majorStr}.${fraction.toString().padStart(digits, '0')}` : majorStr;
  return `${negative ? '-' : ''}${symbol}${value}`;
}

export function formatAmountCompact(minorUnits: number, currency = 'NPR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const digits = digitsForCurrency(currency);
  const abs = Math.abs(minorUnits);
  const major = Math.floor(abs / 10 ** digits);
  const fraction = abs % 10 ** digits;
  if (major === 0) return `${symbol}${major}`;
  if (fraction === 0) return `${symbol}${groupThousands(major.toString())}`;
  return `${symbol}${groupThousands(major.toString())}.${fraction
    .toString()
    .padStart(digits, '0')}`;
}

export function minorUnitsToInput(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2).replace(/\.00$/, '');
}

export function parseAmountToMinorUnits(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const parts = cleaned.split('.');
  if (parts.length > 2) return null;

  const major = parts[0] === '' ? 0 : parseInt(parts[0], 10);
  if (Number.isNaN(major)) return null;

  const fraction = (parts[1] ?? '').slice(0, 2);
  const minor = fraction.length === 0 ? 0 : parseInt(fraction.padEnd(2, '0'), 10);

  return major * 100 + minor;
}
