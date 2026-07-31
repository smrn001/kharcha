import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from './categories';

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  await db.withTransactionAsync(async () => {
    if (currentVersion < 1) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          icon TEXT,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          amount INTEGER NOT NULL,
          category_id TEXT NOT NULL,
          title TEXT,
          note TEXT,
          date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);
      `);

      const insertCategory = await db.prepareAsync(
        'INSERT INTO categories (id, name, icon, type, created_at) VALUES ($id, $name, $icon, $type, $createdAt)'
      );
      try {
        for (const category of DEFAULT_CATEGORIES) {
          await insertCategory.executeAsync({
            $id: category.id,
            $name: category.name,
            $icon: category.icon ?? null,
            $type: category.type,
            $createdAt: category.createdAt,
          });
        }
      } finally {
        await insertCategory.finalizeAsync();
      }
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
