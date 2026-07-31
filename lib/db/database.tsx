import { SQLiteProvider } from 'expo-sqlite';
import type { ReactNode } from 'react';
import { migrateDbIfNeeded } from './migrations';

export const DATABASE_NAME = 'kharcha.db';

export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      {children}
    </SQLiteProvider>
  );
}
