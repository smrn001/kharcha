import type { SQLiteDatabase } from 'expo-sqlite';

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

const NOT_DELETED = `deleted_at IS NULL`;
const INCOME_EXPENSE_ONLY = `type IN ('income', 'expense')`;

export async function getAnalyticsSummary(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<AnalyticsSummary> {
  const row =
    (await db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount_minor ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_minor ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE ${NOT_DELETED} AND ${INCOME_EXPENSE_ONLY} AND local_date >= ? AND local_date <= ?`,
      from,
      to
    )) ?? { income: 0, expense: 0 };
  return { income: row.income, expense: row.expense, saved: row.income - row.expense };
}

export interface AnalyticsCounts {
  income: number;
  expense: number;
}

export async function getAnalyticsCounts(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<AnalyticsCounts> {
  const row =
    (await db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE ${NOT_DELETED} AND ${INCOME_EXPENSE_ONLY} AND local_date >= ? AND local_date <= ?`,
      from,
      to
    )) ?? { income: 0, expense: 0 };
  return { income: row.income, expense: row.expense };
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
    slug: string | null;
    amount: number;
  }>(
    `SELECT t.category_id, c.name, c.icon, c.slug, SUM(t.amount_minor) AS amount
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.type = 'expense' AND t.deleted_at IS NULL AND t.local_date >= ? AND t.local_date <= ?
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
    slug: row.slug ?? undefined,
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
    `SELECT local_date AS date,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount_minor ELSE 0 END), 0) AS income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_minor ELSE 0 END), 0) AS expense
     FROM transactions
     WHERE ${NOT_DELETED} AND ${INCOME_EXPENSE_ONLY} AND local_date >= ? AND local_date <= ?
     GROUP BY local_date
     ORDER BY date`,
    from,
    to
  );
  return rows.map((row) => ({ date: row.date, income: row.income, expense: row.expense }));
}