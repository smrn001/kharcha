import type { SQLiteDatabase } from 'expo-sqlite';
import { splitTransactionDate, startOfMonth, startOfWeek, toDateKey } from '@/lib/dates';
import { MAX_TRANSACTION_MINOR } from '@/lib/format';
import { generateId } from '@/lib/id';
import type { NewTransaction, Transaction, TransactionType, UpdateTransaction } from '@/types';
import { getAccountById } from './accounts';
import { getCategoryById, resolveCategoryIdsForSearch } from './categories';

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount_minor: number;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  title: string | null;
  note: string | null;
  local_date: string;
  occurred_at: string;
  tz_offset_min: number;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount_minor,
    accountId: row.account_id,
    toAccountId: row.to_account_id ?? undefined,
    categoryId: row.category_id ?? undefined,
    title: row.title ?? undefined,
    note: row.note ?? undefined,
    localDate: row.local_date,
    date: row.occurred_at,
    tzOffsetMin: row.tz_offset_min,
    recurringId: row.recurring_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

export interface TransactionCursor {
  localDate: string;
  occurredAt: string;
  id: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  categoryIds?: string[];
  accountIds?: string[];
  /** Amount lower bound in minor units (inclusive). */
  minAmountMinor?: number;
  /** Amount upper bound in minor units (inclusive). */
  maxAmountMinor?: number;
  /** Local-date keys ('YYYY-MM-DD'). */
  from?: string;
  /** Local-date keys ('YYYY-MM-DD'). */
  to?: string;
  search?: string;
  limit?: number;
  /** Keyset cursor for pagination (exclusive). */
  before?: TransactionCursor;
  includeDeleted?: boolean;
}

/** Amounts are stored in minor units (major × 100, mirroring the input UIs). */
const MINOR_UNITS = 100;

/**
 * When the search term is a plain decimal amount (e.g. `850` or `12.50`), also
 * match transactions by amount. Returns `null` for non-numeric terms.
 */
function parseAmountSearchTerm(term: string): number | null {
  const normalized = term.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number.parseFloat(normalized) * MINOR_UNITS);
}

export async function getTransactions(
  db: SQLiteDatabase,
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (!filters.includeDeleted) {
    conditions.push(`t.deleted_at IS NULL`);
  }
  if (filters.type) {
    conditions.push('t.type = ?');
    params.push(filters.type);
  }
  if (filters.categoryIds?.length) {
    const placeholders = filters.categoryIds.map(() => '?').join(', ');
    conditions.push(`t.category_id IN (${placeholders})`);
    params.push(...filters.categoryIds);
  }
  if (filters.accountIds?.length) {
    const placeholders = filters.accountIds.map(() => '?').join(', ');
    conditions.push(`(t.account_id IN (${placeholders}) OR t.to_account_id IN (${placeholders}))`);
    params.push(...filters.accountIds, ...filters.accountIds);
  }
  if (filters.from) {
    conditions.push('t.local_date >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push('t.local_date <= ?');
    params.push(filters.to);
  }
  if (filters.before) {
    conditions.push(
      `(t.local_date < ? OR (t.local_date = ? AND t.occurred_at < ?)
        OR (t.local_date = ? AND t.occurred_at = ? AND t.id < ?))`
    );
    params.push(
      filters.before.localDate,
      filters.before.localDate,
      filters.before.occurredAt,
      filters.before.localDate,
      filters.before.occurredAt,
      filters.before.id
    );
  }
  if (filters.minAmountMinor != null) {
    conditions.push('t.amount_minor >= ?');
    params.push(filters.minAmountMinor);
  }
  if (filters.maxAmountMinor != null) {
    conditions.push('t.amount_minor <= ?');
    params.push(filters.maxAmountMinor);
  }
  if (filters.search) {
    const term = filters.search.normalize('NFC');
    const orConditions: string[] = ['t.title LIKE ?', 't.note LIKE ?', 'c.name LIKE ?'];
    const orParams: (string | number)[] = [`%${term}%`, `%${term}%`, `%${term}%`];
    const aliasIds = await resolveCategoryIdsForSearch(db, term);
    if (aliasIds.length > 0) {
      const placeholders = aliasIds.map(() => '?').join(', ');
      orConditions.push(`t.category_id IN (${placeholders})`);
      orParams.push(...aliasIds);
    }
    const amountMinor = parseAmountSearchTerm(term);
    if (amountMinor != null) {
      orConditions.push('t.amount_minor = ?');
      orParams.push(amountMinor);
    }
    conditions.push(`(${orConditions.join(' OR ')})`);
    params.push(...orParams);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ? ` LIMIT ${filters.limit}` : '';

  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT t.* FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     ${where} ORDER BY t.local_date DESC, t.occurred_at DESC, t.id DESC${limit}`,
    ...params
  );
  return rows.map(mapTransaction);
}

export async function getTransactionById(
  db: SQLiteDatabase,
  id: string
): Promise<Transaction | null> {
  const row = await db.getFirstAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL',
    id
  );
  return row ? mapTransaction(row) : null;
}

function validateAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }
  if (amount > MAX_TRANSACTION_MINOR) {
    throw new Error('That amount is too large.');
  }
}

async function validateReferences(
  db: SQLiteDatabase,
  input: { type: TransactionType; accountId: string; toAccountId?: string; categoryId?: string }
): Promise<void> {
  const account = await getAccountById(db, input.accountId);
  if (!account || account.archivedAt) {
    throw new Error('Choose a valid account.');
  }
  if (input.type === 'transfer') {
    if (!input.toAccountId || input.toAccountId === input.accountId) {
      throw new Error('Choose two different accounts for a transfer.');
    }
    const toAccount = await getAccountById(db, input.toAccountId);
    if (!toAccount || toAccount.archivedAt) {
      throw new Error('Choose a valid account.');
    }
    if (input.categoryId) {
      throw new Error('Transfers do not use a category.');
    }
  } else if (!input.categoryId) {
    throw new Error('Choose a category.');
  } else {
    const category = await getCategoryById(db, input.categoryId);
    if (!category || category.archivedAt) {
      throw new Error('Choose a valid category.');
    }
  }
}

function deviceTzOffsetMin(): number {
  return -new Date().getTimezoneOffset();
}

export async function createTransaction(
  db: SQLiteDatabase,
  input: NewTransaction
): Promise<Transaction> {
  validateAmount(input.amount);
  await validateReferences(db, input);
  const dates = splitTransactionDate(input.date, input.tzOffsetMin ?? deviceTzOffsetMin());

  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO transactions
       (id, type, amount_minor, account_id, to_account_id, category_id, title, note,
        local_date, occurred_at, tz_offset_min, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.type,
    input.amount,
    input.accountId,
    input.toAccountId ?? null,
    input.categoryId ?? null,
    input.title ?? null,
    input.note ?? null,
    dates.localDate,
    dates.occurredAt,
    dates.tzOffsetMin,
    now,
    now
  );
  return {
    id,
    type: input.type,
    amount: input.amount,
    accountId: input.accountId,
    toAccountId: input.toAccountId,
    categoryId: input.categoryId,
    title: input.title,
    note: input.note,
    localDate: dates.localDate,
    date: dates.occurredAt,
    tzOffsetMin: dates.tzOffsetMin,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  input: UpdateTransaction
): Promise<Transaction | null> {
  const current = await getTransactionById(db, id);
  if (!current) return null;

  const merged = {
    type: input.type ?? current.type,
    amount: input.amount ?? current.amount,
    accountId: input.accountId ?? current.accountId,
    toAccountId: input.toAccountId ?? current.toAccountId,
    categoryId: input.categoryId ?? current.categoryId,
  };
  // Switching away from transfer clears the destination account.
  if (merged.type !== 'transfer' && input.type && input.type !== 'transfer') {
    merged.toAccountId = undefined;
  }
  validateAmount(merged.amount);
  await validateReferences(db, merged);

  const now = new Date().toISOString();
  let localDate = current.localDate;
  let occurredAt = current.date;
  let tzOffsetMin = current.tzOffsetMin;
  if (input.date && input.date !== current.date) {
    const dates = splitTransactionDate(input.date, input.tzOffsetMin ?? current.tzOffsetMin);
    localDate = dates.localDate;
    occurredAt = dates.occurredAt;
    tzOffsetMin = dates.tzOffsetMin;
  }

  const title = input.title ?? current.title;
  const note = input.note ?? current.note;
  await db.runAsync(
    `UPDATE transactions
     SET type = ?, amount_minor = ?, account_id = ?, to_account_id = ?, category_id = ?,
         title = ?, note = ?, local_date = ?, occurred_at = ?, tz_offset_min = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    merged.type,
    merged.amount,
    merged.accountId,
    merged.toAccountId ?? null,
    merged.type === 'transfer' ? null : (merged.categoryId ?? null),
    title ?? null,
    note ?? null,
    localDate,
    occurredAt,
    tzOffsetMin,
    now,
    id
  );
  return {
    ...current,
    type: merged.type,
    amount: merged.amount,
    accountId: merged.accountId,
    toAccountId: merged.type === 'transfer' ? merged.toAccountId : undefined,
    categoryId: merged.type === 'transfer' ? undefined : merged.categoryId,
    title,
    note,
    localDate,
    date: occurredAt,
    tzOffsetMin,
    updatedAt: now,
  };
}

/** Soft delete: the row stays for history and future undo. */
export async function deleteTransaction(db: SQLiteDatabase, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    now,
    now,
    id
  );
}

export async function hardDeleteTransaction(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function resetAllTransactions(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM transactions');
}

export interface AnalyticsSummary {
  income: number;
  expense: number;
  saved: number;
}

export interface CategorySpending {
  categoryId: string;
  name: string;
  icon: string | undefined;
  slug: string | undefined;
  amount: number;
  percentage: number;
}

export interface SpendingTrendPoint {
  date: string;
  income: number;
  expense: number;
}

export {
  getAnalyticsSummary,
  getCategorySpending,
  getSpendingTrend,
} from './analytics-queries';

export interface DashboardSummary {
  balance: number;
  income: number;
  expense: number;
  spentToday: number;
  spentWeek: number;
  spentMonth: number;
}

export async function getDashboardSummary(
  db: SQLiteDatabase,
  startOfWeekDay = 1
): Promise<DashboardSummary> {
  const NOT_DELETED = `deleted_at IS NULL`;
  const today = toDateKey(new Date());
  const week = toDateKey(startOfWeek(new Date(), startOfWeekDay));
  const month = toDateKey(startOfMonth(new Date()));

  const row =
    (await db.getFirstAsync<{
      balance: number;
      income: number;
      expense: number;
      spentToday: number;
      spentWeek: number;
      spentMonth: number;
    }>(
      `SELECT
         COALESCE((SELECT SUM(opening_balance_minor) FROM accounts
                   WHERE deleted_at IS NULL AND archived_at IS NULL AND include_in_total = 1), 0)
         + COALESCE(SUM(CASE WHEN type = 'income' THEN amount_minor ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_minor ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN type = 'transfer' AND account_id IN
             (SELECT id FROM accounts WHERE deleted_at IS NULL AND include_in_total = 1)
             THEN amount_minor ELSE 0 END), 0)
         + COALESCE(SUM(CASE WHEN type = 'transfer' AND to_account_id IN
             (SELECT id FROM accounts WHERE deleted_at IS NULL AND include_in_total = 1)
             THEN amount_minor ELSE 0 END), 0)
         AS balance,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount_minor ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_minor ELSE 0 END), 0) AS expense,
         COALESCE(SUM(CASE WHEN type = 'expense' AND local_date >= ? THEN amount_minor ELSE 0 END), 0) AS spentToday,
         COALESCE(SUM(CASE WHEN type = 'expense' AND local_date >= ? THEN amount_minor ELSE 0 END), 0) AS spentWeek,
         COALESCE(SUM(CASE WHEN type = 'expense' AND local_date >= ? THEN amount_minor ELSE 0 END), 0) AS spentMonth
       FROM transactions
       WHERE ${NOT_DELETED}`,
      today,
      week,
      month
    )) ?? {
      balance: 0,
      income: 0,
      expense: 0,
      spentToday: 0,
      spentWeek: 0,
      spentMonth: 0,
    };

  return {
    balance: row.balance,
    income: row.income,
    expense: row.expense,
    spentToday: row.spentToday,
    spentWeek: row.spentWeek,
    spentMonth: row.spentMonth,
  };
}
