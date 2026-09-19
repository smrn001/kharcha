import { DatabaseSync } from 'node:sqlite';

/**
 * In-memory test double for expo-sqlite's `SQLiteDatabase`, backed by real
 * SQLite (node:sqlite). Supports the exact surface our repositories use, so
 * migrations and queries run against a real engine in tests.
 *
 * Pass to repositories with `as unknown as SQLiteDatabase`.
 */

export interface TestRunResult {
  changes: number | bigint;
  lastInsertRowId: number | bigint;
}

export interface TestPreparedStatement {
  executeAsync: (params?: Record<string, unknown>) => Promise<TestRunResult>;
  finalizeAsync: () => Promise<void>;
}

export interface TestDatabase {
  getAllAsync: <T>(sql: string, ...params: unknown[]) => Promise<T[]>;
  getFirstAsync: <T>(sql: string, ...params: unknown[]) => Promise<T | null>;
  runAsync: (sql: string, ...params: unknown[]) => Promise<TestRunResult>;
  execAsync: (sql: string) => Promise<void>;
  withTransactionAsync: <T>(fn: () => Promise<T>) => Promise<T>;
  prepareAsync: (sql: string) => Promise<TestPreparedStatement>;
  close: () => void;
}

export function createTestDb(): TestDatabase {
  const db = new DatabaseSync(':memory:');

  return {
    getAllAsync: async <T>(sql: string, ...params: unknown[]): Promise<T[]> => {
      const stmt = db.prepare(sql);
      const all = stmt.all.bind(stmt) as (...args: unknown[]) => T[];
      return all(...params);
    },

    getFirstAsync: async <T>(sql: string, ...params: unknown[]): Promise<T | null> => {
      const stmt = db.prepare(sql);
      const get = stmt.get.bind(stmt) as (...args: unknown[]) => T | undefined;
      return get(...params) ?? null;
    },

    runAsync: async (sql: string, ...params: unknown[]): Promise<TestRunResult> => {
      const stmt = db.prepare(sql);
      const run = stmt.run.bind(stmt) as (...args: unknown[]) => {
        changes: number | bigint;
        lastInsertRowid: number | bigint;
      };
      const result = run(...params);
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
    },

    execAsync: async (sql: string): Promise<void> => {
      db.exec(sql);
    },

    withTransactionAsync: async <T>(fn: () => Promise<T>): Promise<T> => {
      db.exec('BEGIN');
      try {
        const result = await fn();
        db.exec('COMMIT');
        return result;
      } catch (error) {
        try {
          db.exec('ROLLBACK');
        } catch {
          // Already rolled back; surface the original error.
        }
        throw error;
      }
    },

    prepareAsync: async (sql: string): Promise<TestPreparedStatement> => {
      const stmt = db.prepare(sql);
      const run = stmt.run.bind(stmt) as (params?: unknown) => {
        changes: number | bigint;
        lastInsertRowid: number | bigint;
      };
      return {
        executeAsync: async (params?: Record<string, unknown>): Promise<TestRunResult> => {
          const result = run(params);
          return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
        },
        finalizeAsync: async (): Promise<void> => {},
      };
    },

    close: (): void => {
      db.close();
    },
  };
}
