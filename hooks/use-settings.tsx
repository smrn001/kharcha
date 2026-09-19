import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, getSettings, setSetting } from '@/lib/db/settings';
import { setDefaultFormatLocale } from '@/lib/format-locale';
import type { Settings } from '@/types';

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSetting: (key: keyof Settings, value: string | number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [state, setState] = useState<{ settings: Settings; loading: boolean }>({
    settings: DEFAULT_SETTINGS,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    getSettings(db)
      .then((settings) => {
        if (active) {
          setDefaultFormatLocale({ lang: settings.language, numerals: settings.numerals });
          setState({ settings, loading: false });
        }
      })
      .catch(() => {
        if (active) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      });
    return () => {
      active = false;
    };
  }, [db]);

  const refresh = useCallback(async () => {
    try {
      const settings = await getSettings(db);
      setDefaultFormatLocale({ lang: settings.language, numerals: settings.numerals });
      setState({ settings, loading: false });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [db]);

  const updateSetting = useCallback(
    async (key: keyof Settings, value: string | number) => {
      const stored = String(value);
      await setSetting(db, key, stored);
      const parsed = key === 'startOfWeek' ? Number(stored) : stored;
      setState((prev) => {
        const settings = { ...prev.settings, [key]: parsed as never };
        if (key === 'language' || key === 'numerals') {
          setDefaultFormatLocale({ lang: settings.language, numerals: settings.numerals });
        }
        return { ...prev, settings };
      });
    },
    [db]
  );

  return (
    <SettingsContext.Provider value={{ ...state, refresh, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
