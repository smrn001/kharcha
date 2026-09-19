import { useCallback } from 'react';
import { formatBsDate, localDateKeyToBs } from '@/lib/calendar/bs';
import { formatFullDate, formatTime, toDateKey } from '@/lib/dates';
import type { Transaction } from '@/types';
import { useI18n } from './use-i18n';
import { useSettings } from './use-settings';

/**
 * Section headings in the user's calendar: Today/Yesterday, then the date
 * in AD, BS, or both depending on settings. Falls back to AD when a date is
 * outside the BS table range.
 */
export function useDayHeading(): (localDateKey: string) => string {
  const { settings } = useSettings();
  const { t, lang } = useI18n();

  return useCallback(
    (key: string): string => {
      const today = toDateKey(new Date());
      const yesterday = toDateKey(new Date(Date.now() - 86_400_000));
      if (key === today) return t('common.today');
      if (key === yesterday) return t('common.yesterday');

      const [y, m, d] = key.split('-').map(Number);
      const ad = formatFullDate(new Date(y, m - 1, d, 12).toISOString());
      if (settings.calendar === 'ad') return ad;
      const bs = localDateKeyToBs(key);
      const bsFormatted = bs ? formatBsDate(new Date(y, m - 1, d, 12), lang) : null;
      if (settings.calendar === 'bs') return bsFormatted ?? ad;
      return bsFormatted ? `${bsFormatted} · ${ad}` : ad;
    },
    [settings.calendar, t, lang]
  );
}

/** Detail-screen date line in the user's calendar (BS with AD fallback). */
export function useDetailDate(): (transaction: Pick<Transaction, 'localDate' | 'date'>) => string {
  const { settings } = useSettings();
  const { lang } = useI18n();

  return useCallback(
    (transaction): string => {
      const ad = `${formatFullDate(transaction.date)}, ${formatTime(transaction.date)}`;
      if (settings.calendar === 'ad') return ad;
      const [y, m, d] = transaction.localDate.split('-').map(Number);
      const bs = formatBsDate(new Date(y, m - 1, d, 12), lang);
      if (!bs) return ad;
      const bsLine = `${bs}, ${formatTime(transaction.date)}`;
      return settings.calendar === 'bs' ? bsLine : `${bsLine} · ${ad}`;
    },
    [settings.calendar, lang]
  );
}
