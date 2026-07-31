import type { SQLiteDatabase } from 'expo-sqlite';
import { startOfDay, startOfMonth, startOfWeek } from '@/lib/dates';
import { generateId } from '@/lib/id';
import type { NewTransaction, Transaction, TransactionType, UpdateTransaction } from '@/types';

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  title: string | null;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    categoryId: row.category_id,
    title: row.title ?? undefined,
    note: row.note ?? undefined,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface TransactionFilters {
  type?: TransactionType;
  categoryIds?: string[];
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
}

export async function getTransactions(
  db: SQLiteDatabase,
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.categoryIds?.length) {
    const placeholders = filters.categoryIds.map(() => '?').join(', ');
    conditions.push(`category_id IN (${placeholders})`);
    params.push(...filters.categoryIds);
  }
  if (filters.from) {
    conditions.push('date >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push('date <= ?');
    params.push(filters.to);
  }
  if (filters.search) {
    conditions.push('(title LIKE ? OR note LIKE ? OR c.name LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ? ` LIMIT ${filters.limit}` : '';

  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT t.* FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     ${where} ORDER BY date DESC, created_at DESC${limit}`,
    ...params
  );
  return rows.map(mapTransaction);
}

export async function getTransactionById(
  db: SQLiteDatabase,
  id: string
): Promise<Transaction | null> {
  const row = await db.getFirstAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE id = ?',
    id
  );
  return row ? mapTransaction(row) : null;
}

export async function createTransaction(
  db: SQLiteDatabase,
  input: NewTransaction
): Promise<Transaction> {
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, category_id, title, note, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.type,
    input.amount,
    input.categoryId,
    input.title ?? null,
    input.note ?? null,
    input.date,
    now,
    now
  );
  return {
    id,
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId,
    title: input.title,
    note: input.note,
    date: input.date,
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

  const now = new Date().toISOString();
  const updated: Transaction = {
    ...current,
    ...input,
    categoryId: input.categoryId ?? current.categoryId,
    updatedAt: now,
  };

  await db.runAsync(
    `UPDATE transactions
     SET type = ?, amount = ?, category_id = ?, title = ?, note = ?, date = ?, updated_at = ?
     WHERE id = ?`,
    updated.type,
    updated.amount,
    updated.categoryId,
    updated.title ?? null,
    updated.note ?? null,
    updated.date,
    now,
    id
  );
  return updated;
}

export async function deleteTransaction(db: SQLiteDatabase, id: string): Promise<void> {
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
  amount: number;
  percentage: number;
}

export interface SpendingTrendPoint {
  date: string;
  income: number;
  expense: number;
}

export interface DashboardSummary {
  balance: number;
  income: number;
  expense: number;
  spentToday: number;
  spentWeek: number;
  spentMonth: number;
}

export async function getAnalyticsSummary(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<AnalyticsSummary> {
  const row =
    (await db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE date >= ? AND date <= ?`,
      from,
      to
    )) ?? { income: 0, expense: 0 };
  return { income: row.income, expense: row.expense, saved: row.income - row.expense };
}

export async function getCategorySpending(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<CategorySpending[]> {
  const rows = await db.getAllAsync<{
    category_id: string;
    name: string | null;
    icon: string | null;
    amount: number;
  }>(
    `SELECT t.category_id, c.name, c.icon, SUM(t.amount) AS amount
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY t.category_id
     ORDER BY amount DESC`,
    from,
    to
  );
  const total = rows.reduce((sum, row) => sum + row.amount, 0) || 1;
  return rows.map((row) => ({
    categoryId: row.category_id,
    name: row.name ?? 'Other',
    icon: row.icon ?? undefined,
    amount: row.amount,
    percentage: Math.round((row.amount / total) * 100),
  }));
}

export async function getSpendingTrend(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<SpendingTrendPoint[]> {
  const rows = await db.getAllAsync<{ date: string; income: number; expense: number }>(
    `SELECT substr(date, 1, 10) AS date,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM transactions
     WHERE date >= ? AND date <= ?
     GROUP BY substr(date, 1, 10)
     ORDER BY date`,
    from,
    to
  );
  return rows.map((row) => ({ date: row.date, income: row.income, expense: row.expense }));
}

export async function getDashboardSummary(db: SQLiteDatabase): Promise<DashboardSummary> {
  const today = startOfDay(new Date()).toISOString();
  const week = startOfWeek(new Date()).toISOString();
  const month = startOfMonth(new Date()).toISOString();

  const row =
    (await db.getFirstAsync<{
      income: number;
      expense: number;
      spentToday: number;
      spentWeek: number;
      spentMonth: number;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
         COALESCE(SUM(CASE WHEN type = 'expense' AND date >= ? THEN amount ELSE 0 END), 0) AS spentToday,
         COALESCE(SUM(CASE WHEN type = 'expense' AND date >= ? THEN amount ELSE 0 END), 0) AS spentWeek,
         COALESCE(SUM(CASE WHEN type = 'expense' AND date >= ? THEN amount ELSE 0 END), 0) AS spentMonth
       FROM transactions`,
      today,
      week,
      month
    )) ?? {
      income: 0,
      expense: 0,
      spentToday: 0,
      spentWeek: 0,
      spentMonth: 0,
    };

  return {
    balance: row.income - row.expense,
    income: row.income,
    expense: row.expense,
    spentToday: row.spentToday,
    spentWeek: row.spentWeek,
    spentMonth: row.spentMonth,
  };
}
