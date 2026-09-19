import NepaliDate from 'nepali-date-converter';

/**
 * Bikram Sambat conversion.
 *
 * BS month lengths (29–32 days) cannot be computed by formula, so conversion
 * uses the `nepali-date-converter` lookup table (MIT, pinned version),
 * isolated behind this module so the engine can be swapped without touching
 * callers. Verified range and vectors live in `lib/__tests__/bs.test.ts`.
 *
 * Supported BS range: 2000-01-01 to 2090-12-30. Out-of-range input returns
 * null and callers fall back to AD display.
 */

export interface BsDate {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
}

export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;

// Table edges with margin: BS 2000-01-01 ≈ AD 1943-04-13,
// BS 2090-12-30 ≈ AD 2034-04-13, but the engine is fuzzy within a day or
// two of the edges. Past the end it wraps and returns wrong dates instead
// of throwing, so the AD side must be guarded too. Revisit before 2034.
const AD_MIN_INSTANT = Date.UTC(1943, 3, 15);
const AD_MAX_INSTANT = Date.UTC(2034, 3, 12);

/** PRD Appendix E spellings. */
export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

export const BS_MONTHS_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फागुन',
  'चैत',
] as const;

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toDevanagariDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => DEVANAGARI_DIGITS[Number(digit)]);
}

function isBsDate(value: unknown): value is { year: number; month: number; date: number } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.year === 'number' &&
    typeof record.month === 'number' &&
    typeof record.date === 'number'
  );
}

/** Convert an AD instant to BS, or null outside the supported range. */
export function adToBs(ad: Date): BsDate | null {
  try {
    const time = ad.getTime();
    if (Number.isNaN(time) || time < AD_MIN_INSTANT || time > AD_MAX_INSTANT) {
      return null;
    }
    const bs = new NepaliDate(ad).getBS();
    if (!isBsDate(bs)) return null;
    const year = bs.year;
    const month = bs.month + 1;
    if (year < BS_MIN_YEAR || year > BS_MAX_YEAR) return null;
    return { year, month, day: bs.date };
  } catch {
    return null;
  }
}

/** Convert a BS calendar date (interpreted at local noon) to an AD instant, or null. */
export function bsToAd(bs: BsDate): Date | null {
  try {
    if (
      !Number.isInteger(bs.year) ||
      !Number.isInteger(bs.month) ||
      !Number.isInteger(bs.day) ||
      bs.month < 1 ||
      bs.month > 12 ||
      bs.day < 1 ||
      bs.day > 32
    ) {
      return null;
    }
    return new NepaliDate(bs.year, bs.month - 1, bs.day).toJsDate();
  } catch {
    return null;
  }
}

/** Convert a local-date key ('YYYY-MM-DD') to BS, or null. */
export function localDateKeyToBs(key: string): BsDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const ad = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  if (Number.isNaN(ad.getTime())) return null;
  return adToBs(ad);
}

/** e.g. "19 Ashwin 2083" or "१९ असोज २०८३". Falls back to null out of range. */
export function formatBsDate(ad: Date, lang: 'en' | 'ne' = 'en'): string | null {
  const bs = adToBs(ad);
  if (!bs) return null;
  if (lang === 'ne') {
    return `${toDevanagariDigits(bs.day)} ${BS_MONTHS_NE[bs.month - 1]} ${toDevanagariDigits(bs.year)}`;
  }
  return `${bs.day} ${BS_MONTHS_EN[bs.month - 1]} ${bs.year}`;
}
