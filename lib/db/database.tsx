import { SQLiteProvider } from 'expo-sqlite';
import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { DatabaseUnavailableScreen } from '@/components/database-unavailable-screen';
import { DatabaseErrorBoundary } from './database-error-boundary';
import { migrateDbIfNeeded } from './migrations';
import { useWebDatabaseLock } from './web-tab-lock';

export const DATABASE_NAME = 'kharcha.db';

export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <DatabaseErrorBoundary>
      <DatabaseGate>{children}</DatabaseGate>
    </DatabaseErrorBoundary>
  );
}

function DatabaseGate({ children }: { children: ReactNode }) {
  const lockStatus = useWebDatabaseLock();

  if (Platform.OS === 'web') {
    if (lockStatus === 'blocked') {
      return <DatabaseUnavailableScreen kind="other-tab" />;
    }
    if (lockStatus === 'checking') {
      return <DatabaseLoadingScreen />;
    }
  }

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      {children}
    </SQLiteProvider>
  );
}

function DatabaseLoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" />
    </View>
  );
}
