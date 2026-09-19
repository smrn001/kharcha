import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatAmountCompact,
  groupLakhCrore,
  parseAmountToMinorUnits,
} from '../format';

describe('formatAmount (Appendix B vectors)', () => {
  it.each([
    [99900, 'Rs. 999'],
    [100000, 'Rs. 1,000'],
    [1234500, 'Rs. 12,345'],
    [10000000, 'Rs. 1,00,000'],
    [123456750, 'Rs. 12,34,567.50'],
    [1234567800, 'Rs. 1,23,45,678'],
    [125050, 'Rs. 1,250.50'],
    [-125000, '-Rs. 1,250'],
    [0, 'Rs. 0'],
  ])('formats %d NPR as %s', (minor, expected) => {
    expect(formatAmount(minor, 'NPR')).toBe(expected);
  });

  it('uses western grouping for USD/EUR/GBP', () => {
    expect(formatAmount(123456750, 'USD')).toBe('$ 1,234,567.50');
    expect(formatAmount(100000, 'EUR')).toBe('€ 1,000');
  });

  it('uses Nepali symbols and numerals', () => {
    expect(formatAmount(125050, 'NPR', { lang: 'ne' })).toBe('रू 1,250.50');
    expect(formatAmount(125050, 'NPR', { lang: 'ne', numerals: 'devanagari' })).toBe(
      'रू १,२५०.५०'
    );
    expect(formatAmount(10000000, 'NPR', { lang: 'ne', numerals: 'devanagari' })).toBe(
      'रू १,००,०००'
    );
  });

  it('groups lakh/crore', () => {
    expect(groupLakhCrore('999')).toBe('999');
    expect(groupLakhCrore('1000')).toBe('1,000');
    expect(groupLakhCrore('100000')).toBe('1,00,000');
    expect(groupLakhCrore('1234567')).toBe('12,34,567');
    expect(groupLakhCrore('12345678')).toBe('1,23,45,678');
  });
});

describe('formatAmountCompact', () => {
  it.each([
    [150000, 'Rs. 1.5K'],
    [15000000, 'Rs. 1.5L'],
    [2500000000, 'Rs. 2.5Cr'],
    [200000, 'Rs. 2K'],
    [50000, 'Rs. 500'],
  ])('compacts %d NPR as %s', (minor, expected) => {
    expect(formatAmountCompact(minor, 'NPR')).toBe(expected);
  });

  it('compacts western currencies and Nepali units', () => {
    expect(formatAmountCompact(150000, 'USD')).toBe('$ 1.5K');
    expect(formatAmountCompact(150000000, 'USD')).toBe('$ 1.5M');
    expect(formatAmountCompact(15000000, 'NPR', { lang: 'ne', numerals: 'devanagari' })).toBe(
      'रू १.५लाख'
    );
  });
});

describe('parseAmountToMinorUnits', () => {
  it('accepts Devanagari digits', () => {
    expect(parseAmountToMinorUnits('१२५०.५०')).toBe(125050);
    expect(parseAmountToMinorUnits('1,250')).toBe(125000);
  });
});
