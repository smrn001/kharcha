import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, getSettings, setSetting } from '@/lib/db/settings';
import type { Settings } from '@/types';

export function useSettings() {
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
      setState({ settings, loading: false });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [db]);

  const updateSetting = useCallback(
    async (key: keyof Settings, value: string) => {
      await setSetting(db, key, value);
      setState((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value as never } }));
    },
    [db]
  );

  return { ...state, refresh, updateSetting };
}
