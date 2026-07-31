import type { SQLiteDatabase } from 'expo-sqlite';
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
  categoryId?: string;
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
  if (filters.categoryId) {
    conditions.push('category_id = ?');
    params.push(filters.categoryId);
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
    conditions.push('(title LIKE ? OR note LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ? ` LIMIT ${filters.limit}` : '';

  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC${limit}`,
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
