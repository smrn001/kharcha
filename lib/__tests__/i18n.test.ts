import { describe, expect, it } from 'vitest';
import { categoryDisplayName, pluralSuffix, translate } from '../i18n';
import { en } from '../i18n/en';
import { ne } from '../i18n/ne';

describe('i18n dictionaries', () => {
  it('has a non-empty Nepali string for every English key', () => {
    const missing = (Object.keys(en) as (keyof typeof en)[]).filter(
      (key) => !ne[key] || ne[key].trim() === ''
    );
    expect(missing).toEqual([]);
  });

  it('interpolates params and falls back gracefully', () => {
    expect(translate('en', 'set.version', { version: '1.2.3' })).toBe('Version 1.2.3');
    expect(translate('ne', 'set.version', { version: '1.2.3' })).toBe('संस्करण 1.2.3');
    expect(translate('en', 'an.insightSame', {})).toBe('Same as {unit}.');
  });

  it('pluralizes English only', () => {
    expect(pluralSuffix('en', 1)).toBe('');
    expect(pluralSuffix('en', 2)).toBe('s');
    expect(pluralSuffix('ne', 2)).toBe('');
  });

  it('shows Nepali category names by slug', () => {
    expect(categoryDisplayName({ name: 'Food & Dining', slug: 'food' }, 'ne')).toBe('खाना');
    expect(categoryDisplayName({ name: 'Food & Dining', slug: 'food' }, 'en')).toBe(
      'Food & Dining'
    );
    expect(categoryDisplayName({ name: 'Custom' }, 'ne')).toBe('Custom');
  });
});
