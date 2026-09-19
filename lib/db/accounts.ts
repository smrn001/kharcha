import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '@/lib/id';
import type { Account, AccountKind, NewAccount } from '@/types';

export const DEFAULT_CASH_ACCOUNT_ID = 'account-cash';

interface AccountRow {
  id: string;
  name: string;
  kind: AccountKind;
  icon: string | null;
  opening_balance_minor: number;
  include_in_total: number;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    icon: row.icon ?? undefined,
    openingBalance: row.opening_balance_minor,
    includeInTotal: row.include_in_total === 1,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

export async function getAccounts(
  db: SQLiteDatabase,
  opts: { includeArchived?: boolean } = {}
): Promise<Account[]> {
  const rows = await db.getAllAsync<AccountRow>(
    `SELECT * FROM accounts
     WHERE deleted_at IS NULL ${opts.includeArchived ? '' : 'AND archived_at IS NULL'}
     ORDER BY sort_order, name COLLATE NOCASE`
  );
  return rows.map(mapAccount);
}

export async function getAccountById(db: SQLiteDatabase, id: string): Promise<Account | null> {
  const row = await db.getFirstAsync<AccountRow>(
    'SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL',
    id
  );
  return row ? mapAccount(row) : null;
}

/** First usable account (oldest sort order). Used as the default picker value. */
export async function getDefaultAccount(db: SQLiteDatabase): Promise<Account | null> {
  const row = await db.getFirstAsync<AccountRow>(
    `SELECT * FROM accounts
     WHERE deleted_at IS NULL AND archived_at IS NULL
     ORDER BY sort_order, created_at LIMIT 1`
  );
  return row ? mapAccount(row) : null;
}

/** Get the default account, creating the Cash account when none exists. */
export async function ensureDefaultAccount(db: SQLiteDatabase): Promise<Account> {
  const existing = await getDefaultAccount(db);
  if (existing) return existing;
  return createAccount(db, { name: 'Cash', kind: 'cash' }, DEFAULT_CASH_ACCOUNT_ID);
}

export async function createAccount(
  db: SQLiteDatabase,
  input: NewAccount,
  id: string = generateId()
): Promise<Account> {
  const now = new Date().toISOString();
  const existing = await db.getAllAsync<{ sort_order: number }>(
    'SELECT sort_order FROM accounts WHERE deleted_at IS NULL ORDER BY sort_order DESC LIMIT 1'
  );
  const sortOrder = (existing[0]?.sort_order ?? -1) + 1;
  await db.runAsync(
    `INSERT INTO accounts
       (id, name, kind, icon, opening_balance_minor, include_in_total, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name,
    input.kind,
    input.icon ?? null,
    input.openingBalance ?? 0,
    input.includeInTotal === false ? 0 : 1,
    sortOrder,
    now,
    now
  );
  const created = await getAccountById(db, id);
  if (!created) throw new Error("Couldn't create this account. Please try again.");
  return created;
}

export async function updateAccount(
  db: SQLiteDatabase,
  id: string,
  input: Partial<NewAccount> & { archivedAt?: string | null }
): Promise<void> {
  const current = await getAccountById(db, id);
  if (!current) throw new Error('Account not found.');
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE accounts
     SET name = ?, kind = ?, icon = ?, opening_balance_minor = ?,
         include_in_total = ?, archived_at = ?, updated_at = ?
     WHERE id = ?`,
    input.name ?? current.name,
    input.kind ?? current.kind,
    input.icon ?? current.icon ?? null,
    input.openingBalance ?? current.openingBalance,
    (input.includeInTotal ?? current.includeInTotal) ? 1 : 0,
    input.archivedAt ?? current.archivedAt ?? null,
    now,
    id
  );
}

/**
 * Balance = opening + income − expense − transfers out + transfers in,
 * ignoring soft-deleted rows.
 */
export async function getAccountBalance(db: SQLiteDatabase, accountId: string): Promise<number> {
  const row = await db.getFirstAsync<{ balance: number }>(
    `SELECT
       a.opening_balance_minor
       + COALESCE(SUM(CASE WHEN t.type = 'income' AND t.account_id = a.id THEN t.amount_minor ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.account_id = a.id THEN t.amount_minor ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.account_id = a.id THEN t.amount_minor ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.to_account_id = a.id THEN t.amount_minor ELSE 0 END), 0)
       AS balance
     FROM accounts a
     LEFT JOIN transactions t
       ON (t.account_id = a.id OR t.to_account_id = a.id) AND t.deleted_at IS NULL
     WHERE a.id = ?
     GROUP BY a.id`,
    accountId
  );
  return row?.balance ?? 0;
}

export async function countAccountUsage(db: SQLiteDatabase, id: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM transactions
     WHERE deleted_at IS NULL AND (account_id = ? OR to_account_id = ?)`,
    id,
    id
  );
  return row?.count ?? 0;
}
