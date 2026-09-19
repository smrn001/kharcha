import type { SQLiteDatabase } from 'expo-sqlite';
import { NPT_OFFSET_MIN, splitTransactionDate } from '@/lib/dates';
import { DEFAULT_CASH_ACCOUNT_ID } from './accounts';
import { DEFAULT_CATEGORIES, slugForDefaultCategoryId } from './categories';

const DATABASE_VERSION = 2;

const V2_ACCOUNTS_TABLE = `
  CREATE TABLE accounts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('cash', 'bank', 'wallet', 'card', 'savings', 'other')),
    icon TEXT,
    opening_balance_minor INTEGER NOT NULL DEFAULT 0,
    include_in_total INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    archived_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
`;

const V2_CATEGORIES_TABLE = `
  CREATE TABLE categories (
    id TEXT PRIMARY KEY NOT NULL,
    slug TEXT UNIQUE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_default INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    archived_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
`;

const V2_TRANSACTIONS_TABLE = `
  CREATE TABLE transactions (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
    account_id TEXT NOT NULL REFERENCES accounts (id),
    to_account_id TEXT REFERENCES accounts (id),
    category_id TEXT REFERENCES categories (id),
    title TEXT,
    note TEXT,
    local_date TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    tz_offset_min INTEGER NOT NULL DEFAULT 345,
    recurring_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    CHECK (
      (type = 'transfer' AND to_account_id IS NOT NULL AND category_id IS NULL AND to_account_id <> account_id)
      OR
      (type <> 'transfer' AND category_id IS NOT NULL AND to_account_id IS NULL)
    )
  );
`;

const V2_SETTINGS_TABLE = `
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT
  );
`;

const V2_INDEXES = `
  CREATE INDEX idx_tx_date ON transactions (local_date DESC, occurred_at DESC) WHERE deleted_at IS NULL;
  CREATE INDEX idx_tx_category ON transactions (category_id, local_date) WHERE deleted_at IS NULL;
  CREATE INDEX idx_tx_account ON transactions (account_id, local_date) WHERE deleted_at IS NULL;
`;

interface V1TransactionRow {
  id: string;
  type: string;
  amount: number;
  category_id: string;
  title: string | null;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

interface V1CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  type: string;
  created_at: string;
}

export interface MigrationReport {
  from: number;
  to: number;
  migrated: number;
  skippedInvalid: number;
  skippedIdsSample: string[];
  categoriesAdded: number;
}

const MIGRATION_REPORT_KEY = 'migration_report';

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  await db.withTransactionAsync(async () => {
    if (currentVersion < 1) {
      await createV2Schema(db);
      await seedV2Defaults(db);
    } else if (currentVersion < 2) {
      await migrateV1ToV2(db);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}

async function createV2Schema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(
    V2_ACCOUNTS_TABLE + V2_CATEGORIES_TABLE + V2_TRANSACTIONS_TABLE + V2_SETTINGS_TABLE + V2_INDEXES
  );
}

async function seedV2Defaults(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO accounts
       (id, name, kind, icon, opening_balance_minor, include_in_total, sort_order, created_at, updated_at)
     VALUES (?, 'Cash', 'cash', NULL, 0, 1, 0, ?, ?)`,
    DEFAULT_CASH_ACCOUNT_ID,
    now,
    now
  );

  const insertCategory = await db.prepareAsync(
    `INSERT INTO categories
       (id, slug, name, icon, color, type, is_default, sort_order, created_at, updated_at)
     VALUES ($id, $slug, $name, $icon, $color, $type, $isDefault, $sortOrder, $createdAt, $updatedAt)`
  );
  try {
    for (const category of DEFAULT_CATEGORIES) {
      await insertCategory.executeAsync({
        $id: category.id,
        $slug: category.slug ?? null,
        $name: category.name,
        $icon: category.icon ?? null,
        $color: category.color ?? null,
        $type: category.type,
        $isDefault: 1,
        $sortOrder: category.sortOrder,
        $createdAt: category.createdAt,
        $updatedAt: category.updatedAt,
      });
    }
  } finally {
    await insertCategory.finalizeAsync();
  }
}

function isValidV1Type(type: string): type is 'income' | 'expense' {
  return type === 'income' || type === 'expense';
}

/**
 * Convert a v1 stored amount to minor units. As-built v1 databases already
 * hold integer minor units; only fractional REAL major-unit values are
 * scaled. Returns null when the value is unusable.
 */
export function convertV1Amount(amount: number): number | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  const minor = Number.isInteger(amount) ? amount : Math.round(amount * 100);
  return minor > 0 && Number.isSafeInteger(minor) ? minor : null;
}

async function migrateV1ToV2(db: SQLiteDatabase): Promise<void> {
  const [v1Transactions, v1Categories] = await Promise.all([
    db.getAllAsync<V1TransactionRow>('SELECT * FROM transactions'),
    db.getAllAsync<V1CategoryRow>('SELECT * FROM categories'),
  ]);

  // --- Accounts: single default Cash account owns all existing rows. ---
  await db.execAsync(V2_ACCOUNTS_TABLE);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO accounts
       (id, name, kind, icon, opening_balance_minor, include_in_total, sort_order, created_at, updated_at)
     VALUES (?, 'Cash', 'cash', NULL, 0, 1, 0, ?, ?)`,
    DEFAULT_CASH_ACCOUNT_ID,
    now,
    now
  );

  // --- Categories: rebuild with slugs; custom categories keep slug NULL. ---
  const defaultIds = new Set(DEFAULT_CATEGORIES.map((category) => category.id));
  const defaultOrder = new Map(DEFAULT_CATEGORIES.map((category, index) => [category.id, index]));
  await db.execAsync(V2_CATEGORIES_TABLE.replace('CREATE TABLE categories', 'CREATE TABLE categories_new'));
  const insertCategory = await db.prepareAsync(
    `INSERT INTO categories_new
       (id, slug, name, icon, color, type, is_default, sort_order, created_at, updated_at)
     VALUES ($id, $slug, $name, $icon, $color, $type, $isDefault, $sortOrder, $createdAt, $updatedAt)`
  );
  let customOrder = DEFAULT_CATEGORIES.length;
  try {
    for (const row of v1Categories) {
      const isDefault = defaultIds.has(row.id);
      await insertCategory.executeAsync({
        $id: row.id,
        $slug: isDefault ? slugForDefaultCategoryId(row.id) : null,
        $name: row.name,
        $icon: row.icon,
        $color: null,
        $type: row.type,
        $isDefault: isDefault ? 1 : 0,
        $sortOrder: isDefault ? (defaultOrder.get(row.id) ?? customOrder++) : customOrder++,
        $createdAt: row.created_at,
        $updatedAt: row.created_at,
      });
    }
  } finally {
    await insertCategory.finalizeAsync();
  }

  // Defaults deleted by the user are re-seeded so slug matching always works.
  const existingIds = new Set(v1Categories.map((row) => row.id));
  let categoriesAdded = 0;
  const insertMissing = await db.prepareAsync(
    `INSERT INTO categories_new
       (id, slug, name, icon, color, type, is_default, sort_order, created_at, updated_at)
     VALUES ($id, $slug, $name, $icon, $color, $type, 1, $sortOrder, $createdAt, $updatedAt)`
  );
  try {
    for (const category of DEFAULT_CATEGORIES) {
      if (!existingIds.has(category.id)) {
        await insertMissing.executeAsync({
          $id: category.id,
          $slug: category.slug ?? null,
          $name: category.name,
          $icon: category.icon ?? null,
          $color: category.color ?? null,
          $type: category.type,
          $sortOrder: category.sortOrder,
          $createdAt: category.createdAt,
          $updatedAt: category.updatedAt,
        });
        existingIds.add(category.id);
        categoriesAdded += 1;
      }
    }
  } finally {
    await insertMissing.finalizeAsync();
  }

  // Swap categories before touching transactions: dropping a parent table
  // with referencing rows fails under foreign_keys=ON, so the old child
  // table goes first while the new one does not exist yet.
  await db.execAsync('DROP TABLE transactions');
  await db.execAsync('DROP TABLE categories');
  await db.execAsync('ALTER TABLE categories_new RENAME TO categories');

  // --- Transactions: rebuild with v2 columns. ---
  await db.execAsync(
    V2_TRANSACTIONS_TABLE.replace('CREATE TABLE transactions', 'CREATE TABLE transactions_new')
  );
  const insertTx = await db.prepareAsync(
    `INSERT INTO transactions_new
       (id, type, amount_minor, account_id, category_id, title, note,
        local_date, occurred_at, tz_offset_min, created_at, updated_at)
     VALUES ($id, $type, $amount, $accountId, $categoryId, $title, $note,
        $localDate, $occurredAt, $tzOffset, $createdAt, $updatedAt)`
  );
  let migrated = 0;
  let skippedInvalid = 0;
  const skippedIdsSample: string[] = [];
  let sourceIncome = 0;
  let sourceExpense = 0;
  let migratedIncome = 0;
  let migratedExpense = 0;
  try {
    for (const row of v1Transactions) {
      const amount = convertV1Amount(row.amount);
      let dates: { localDate: string; occurredAt: string; tzOffsetMin: number } | null = null;
      try {
        dates = splitTransactionDate(row.date, NPT_OFFSET_MIN);
      } catch {
        dates = null;
      }
      const categoryId = existingIds.has(row.category_id)
        ? row.category_id
        : row.type === 'income'
          ? 'income-other'
          : 'expense-other';
      if (!isValidV1Type(row.type) || amount === null || dates === null) {
        skippedInvalid += 1;
        if (skippedIdsSample.length < 10) skippedIdsSample.push(row.id);
        continue;
      }
      if (row.type === 'income') sourceIncome += amount;
      else sourceExpense += amount;
      await insertTx.executeAsync({
        $id: row.id,
        $type: row.type,
        $amount: amount,
        $accountId: DEFAULT_CASH_ACCOUNT_ID,
        $categoryId: categoryId,
        $title: row.title,
        $note: row.note,
        $localDate: dates.localDate,
        $occurredAt: dates.occurredAt,
        $tzOffset: dates.tzOffsetMin,
        $createdAt: row.created_at,
        $updatedAt: row.updated_at,
      });
      migrated += 1;
      if (row.type === 'income') migratedIncome += amount;
      else migratedExpense += amount;
    }
  } finally {
    await insertTx.finalizeAsync();
  }

  if (sourceIncome !== migratedIncome || sourceExpense !== migratedExpense) {
    throw new Error(
      'Migration validation failed: migrated totals do not match the source. ' +
        'No data was changed.'
    );
  }

  await db.execAsync('ALTER TABLE transactions_new RENAME TO transactions');
  await db.execAsync(V2_INDEXES);

  const report: MigrationReport = {
    from: 1,
    to: 2,
    migrated,
    skippedInvalid,
    skippedIdsSample,
    categoriesAdded,
  };
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    MIGRATION_REPORT_KEY,
    JSON.stringify(report)
  );
}
