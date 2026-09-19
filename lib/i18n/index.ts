import { NEPALI_CATEGORY_NAMES } from '../category-aliases';
import type { Category } from '@/types';
import { en, type DictionaryKey } from './en';
import { ne } from './ne';

export type { DictionaryKey };

const DICTIONARIES = { en, ne } as const;

export type SupportedLang = keyof typeof DICTIONARIES;

/** Translate a key with `{param}` interpolation. Falls back to English, then the key. */
export function translate(
  lang: SupportedLang,
  key: DictionaryKey,
  params?: Record<string, string | number>
): string {
  const template = DICTIONARIES[lang][key] ?? en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] === undefined ? match : String(params[name])
  );
}

/** English plural suffix (other languages return ''). */
export function pluralSuffix(lang: SupportedLang, count: number): string {
  return lang === 'en' && count !== 1 ? 's' : '';
}

/** Localized category display name (Nepali by slug, English canonical otherwise). */
export function categoryDisplayName(category: Pick<Category, 'name' | 'slug'>, lang: SupportedLang): string {
  if (lang === 'ne' && category.slug && NEPALI_CATEGORY_NAMES[category.slug]) {
    return NEPALI_CATEGORY_NAMES[category.slug];
  }
  return category.name;
}
