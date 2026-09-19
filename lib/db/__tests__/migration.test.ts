import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it } from 'vitest';
import { getAnalyticsSummary } from '../transactions';
import { convertV1Amount, migrateDbIfNeeded, type MigrationReport } from '../migrations';
import { createTestDb, type TestDatabase } from './sqlite-shim';

const V1_SCHEMA = `
  CREATE TABLE categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TEXT NOT NULL
  );
  CREATE TABLE transactions (
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
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT
  );
`;

function asSql(db: TestDatabase): SQLiteDatabase {
  return db as unknown as SQLiteDatabase;
}

/** Build a v1 database (user_version = 1) with foreign keys off to allow legacy inconsistencies. */
async function createV1Db(): Promise<TestDatabase> {
  const db = createTestDb();
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  await db.execAsync(V1_SCHEMA);
  await db.runAsync(
    `INSERT INTO categories (id, name, icon, type, created_at) VALUES
     ('expense-food', 'Food', 'Utensils', 'expense', '2026-01-01T00:00:00.000Z'),
     ('expense-other', 'Other', 'MoreHorizontal', 'expense', '2026-01-01T00:00:00.000Z'),
     ('income-other', 'Other', 'MoreHorizontal', 'income', '2026-01-01T00:00:00.000Z'),
     ('custom-coffee', 'Coffee', 'Coffee', 'expense', '2026-02-01T00:00:00.000Z')`
  );
  await db.execAsync('PRAGMA user_version = 1');
  return db;
}

async function insertV1Tx(
  db: TestDatabase,
  row: {
    id: string;
    type: string;
    amount: number;
    category: string;
    date: string;
    title?: string;
  }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions
       (id, type, amount, category_id, title, note, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z')`,
    row.id,
    row.type,
    row.amount,
    row.category,
    row.title ?? null,
    row.date
  );
}

describe('v2 migration', () => {
  it('creates a fresh v2 database with Cash and slugs', async () => {
    const db = createTestDb();
    await migrateDbIfNeeded(asSql(db));

    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(2);

    const accounts = await db.getAllAsync<{ id: string; name: string }>(
      'SELECT id, name FROM accounts'
    );
    expect(accounts).toEqual([{ id: 'account-cash', name: 'Cash' }]);

    const slugs = await db.getAllAsync<{ id: string; slug: string }>(
      'SELECT id, slug FROM categories WHERE slug IS NOT NULL'
    );
    expect(slugs.find((row) => row.id === 'expense-food')?.slug).toBe('food');
    expect(slugs.find((row) => row.id === 'expense-other')?.slug).toBe('other-expense');
    expect(slugs.find((row) => row.id === 'income-other')?.slug).toBe('other-income');
    db.close();
  });

  it('migrates v1 rows with preserved totals', async () => {
    const db = await createV1Db();
    await insertV1Tx(db, {
      id: 't1',
      type: 'expense',
      amount: 25000,
      category: 'expense-food',
      date: '2026-09-18T10:00:00.000Z',
      title: 'Lunch',
    });
    await insertV1Tx(db, {
      id: 't2',
      type: 'income',
      amount: 1500000,
      category: 'income-other',
      date: '2026-09-17T10:00:00.000Z',
    });
    await insertV1Tx(db, {
      id: 't3',
      type: 'expense',
      amount: 12.5,
      category: 'custom-coffee',
      date: '2026-09-16T10:00:00.000Z',
    });
    await insertV1Tx(db, {
      id: 't4',
      type: 'expense',
      amount: 500,
      category: 'expense-gone',
      date: '2026-09-15',
    });
    await insertV1Tx(db, {
      id: 't5',
      type: 'expense',
      amount: -100,
      category: 'expense-food',
      date: '2026-09-14T10:00:00.000Z',
    });

    await migrateDbIfNeeded(asSql(db));

    const txs = await db.getAllAsync<{
      id: string;
      amount_minor: number;
      account_id: string;
      category_id: string;
      local_date: string;
      occurred_at: string;
      tz_offset_min: number;
    }>(
      'SELECT id, amount_minor, account_id, category_id, local_date, occurred_at, tz_offset_min FROM transactions ORDER BY id'
    );
    // t5 (negative amount) is quarantined.
    expect(txs.map((row) => row.id)).toEqual(['t1', 't2', 't3', 't4']);

    const byId = Object.fromEntries(txs.map((row) => [row.id, row]));
    expect(byId.t1.amount_minor).toBe(25000);
    expect(byId.t1.account_id).toBe('account-cash');
    expect(byId.t1.local_date).toBe('2026-09-18');
    expect(byId.t1.tz_offset_min).toBe(345);
    // Legacy REAL major units scale to minor.
    expect(byId.t3.amount_minor).toBe(1250);
    // Missing category remaps to Other.
    expect(byId.t4.category_id).toBe('expense-other');
    // Date-only value treated as NPT wall time.
    expect(byId.t4.local_date).toBe('2026-09-15');
    expect(byId.t4.occurred_at).toBe('2026-09-14T18:15:00.000Z');

    const summary = await getAnalyticsSummary(asSql(db), '2026-01-01', '2026-12-31');
    expect(summary).toEqual({ income: 1500000, expense: 25000 + 1250 + 500, saved: 1500000 - 26750 });

    const reportRow = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'migration_report'"
    );
    const report = JSON.parse(reportRow?.value ?? '{}') as MigrationReport;
    expect(report.migrated).toBe(4);
    expect(report.skippedInvalid).toBe(1);
    expect(report.skippedIdsSample).toEqual(['t5']);

    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(2);
    db.close();
  });

  it('is idempotent', async () => {
    const db = await createV1Db();
    await insertV1Tx(db, {
      id: 't1',
      type: 'expense',
      amount: 100,
      category: 'expense-food',
      date: '2026-09-18T10:00:00.000Z',
    });
    await migrateDbIfNeeded(asSql(db));
    await migrateDbIfNeeded(asSql(db));
    const txs = await db.getAllAsync<{ id: string }>('SELECT id FROM transactions');
    expect(txs.map((row) => row.id)).toEqual(['t1']);
    db.close();
  });

  it('rolls back failed transactions', async () => {
    const db = createTestDb();
    await db.execAsync('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT)');
    await expect(
      db.withTransactionAsync(async () => {
        await db.runAsync("INSERT INTO settings (key, value) VALUES ('probe', '1')");
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'probe'"
    );
    expect(row).toBeNull();
    db.close();
  });
});

describe('convertV1Amount', () => {
  it('keeps integer minor units and scales REAL majors', () => {
    expect(convertV1Amount(25000)).toBe(25000);
    expect(convertV1Amount(12.5)).toBe(1250);
    expect(convertV1Amount(0)).toBeNull();
    expect(convertV1Amount(-5)).toBeNull();
    expect(convertV1Amount(Number.NaN)).toBeNull();
  });
});
