import { useCallback } from 'react';
import { pluralSuffix, translate, type DictionaryKey, type SupportedLang } from '@/lib/i18n';
import { useSettings } from './use-settings';

export function useI18n(): {
  lang: SupportedLang;
  t: (key: DictionaryKey, params?: Record<string, string | number>) => string;
  plural: (count: number) => string;
} {
  const { settings } = useSettings();
  const lang: SupportedLang = settings.language === 'ne' ? 'ne' : 'en';
  const t = useCallback(
    (key: DictionaryKey, params?: Record<string, string | number>) =>
      translate(lang, key, params),
    [lang]
  );
  const plural = useCallback((count: number) => pluralSuffix(lang, count), [lang]);
  return { lang, t, plural };
}
