import { sheetContentFor, type SelectionKey, type SheetContent } from '@/lib/settings-options';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings } from '@/hooks/use-settings';
import { useState } from 'react';
import type { Settings } from '@/types';

/**
 * Owns which selection sheet is open. Holds the sheet key, derives content
 * from current settings, and applies a picked value back via `updateSetting`.
 */
export function useSettingsSheet(settings: Settings) {
  const { t } = useI18n();
  const { updateSetting } = useSettings();
  const [sheet, setSheet] = useState<SelectionKey | null>(null);

  const handleSelect = (value: string | number) => {
    if (sheet === 'theme') void updateSetting('theme', value);
    else if (sheet === 'currency') void updateSetting('currency', value);
    else if (sheet === 'language') void updateSetting('language', value);
    else if (sheet === 'calendar') void updateSetting('calendar', value);
    else if (sheet === 'numerals') void updateSetting('numerals', value);
    else if (sheet === 'defaultType') void updateSetting('defaultTransactionType', value);
    else if (sheet === 'week') void updateSetting('startOfWeek', Number(value));
  };

  const content: SheetContent | null = sheet ? sheetContentFor(sheet, settings, t) : null;

  return {
    sheet,
    content,
    open: setSheet,
    select: handleSelect,
    close: () => setSheet(null),
  };
}