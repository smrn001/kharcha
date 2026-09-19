import { describe, expect, it } from 'vitest';
import {
  adToBs,
  bsToAd,
  formatBsDate,
  localDateKeyToBs,
  toDevanagariDigits,
} from '../calendar/bs';

function noonUtc(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

describe('BS conversion', () => {
  it.each([
    ['2000-01-01', { year: 2056, month: 9, day: 17 }],
    ['2024-04-13', { year: 2081, month: 1, day: 1 }],
    ['2025-04-14', { year: 2082, month: 1, day: 1 }],
    ['2026-04-14', { year: 2083, month: 1, day: 1 }],
  ])('converts AD %s to BS', (ad, expected) => {
    expect(adToBs(noonUtc(ad))).toEqual(expected);
  });

  it('round-trips BS to AD', () => {
    const ad = bsToAd({ year: 2083, month: 6, day: 19 });
    expect(ad).not.toBeNull();
    expect(adToBs(ad as Date)).toEqual({ year: 2083, month: 6, day: 19 });
  });

  it('returns null outside the supported range', () => {
    expect(adToBs(new Date('1900-01-01T12:00:00Z'))).toBeNull();
    expect(adToBs(new Date('2040-01-01T12:00:00Z'))).toBeNull();
    expect(bsToAd({ year: 1999, month: 1, day: 1 })).toBeNull();
    expect(bsToAd({ year: 2083, month: 13, day: 1 })).toBeNull();
    expect(localDateKeyToBs('not-a-date')).toBeNull();
  });

  it('covers the table edges', () => {
    expect(adToBs(noonUtc('1943-04-15'))).toEqual({ year: 2000, month: 1, day: 2 });
    expect(adToBs(noonUtc('2034-04-11'))).toEqual({ year: 2090, month: 12, day: 28 });
  });

  it('converts local-date keys', () => {
    expect(localDateKeyToBs('2026-04-14')).toEqual({ year: 2083, month: 1, day: 1 });
  });

  it('formats in both languages', () => {
    expect(formatBsDate(noonUtc('2026-04-14'), 'en')).toBe('1 Baisakh 2083');
    expect(formatBsDate(noonUtc('2026-04-14'), 'ne')).toBe('१ बैशाख २०८३');
    expect(formatBsDate(new Date('1900-01-01T12:00:00Z'))).toBeNull();
  });

  it('converts digits to Devanagari', () => {
    expect(toDevanagariDigits(1234567890)).toBe('१२३४५६७८९०');
    expect(toDevanagariDigits('Rs. 1,250.50')).toBe('Rs. १,२५०.५०');
  });
});
