import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '@/lib/id';
import type { Category, NewCategory, TransactionType } from '@/types';

const SEED_DATE = new Date(0).toISOString();

interface BaseCategory {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  createdAt: string;
}

const BASE_CATEGORIES: BaseCategory[] = [
  { id: 'expense-food', name: 'Food', icon: 'Utensils', type: 'expense', createdAt: SEED_DATE },
  {
    id: 'expense-transport',
    name: 'Transport',
    icon: 'Bus',
    type: 'expense',
    createdAt: SEED_DATE,
  },
  {
    id: 'expense-shopping',
    name: 'Shopping',
    icon: 'ShoppingBag',
    type: 'expense',
    createdAt: SEED_DATE,
  },
  { id: 'expense-bills', name: 'Bills', icon: 'Receipt', type: 'expense', createdAt: SEED_DATE },
  {
    id: 'expense-entertainment',
    name: 'Entertainment',
    icon: 'Clapperboard',
    type: 'expense',
    createdAt: SEED_DATE,
  },
  {
    id: 'expense-health',
    name: 'Health',
    icon: 'HeartPulse',
    type: 'expense',
    createdAt: SEED_DATE,
  },
  {
    id: 'expense-education',
    name: 'Education',
    icon: 'GraduationCap',
    type: 'expense',
    createdAt: SEED_DATE,
  },
  { id: 'expense-travel', name: 'Travel', icon: 'Plane', type: 'expense', createdAt: SEED_DATE },
  {
    id: 'expense-groceries',
    name: 'Groceries',
    icon: 'ShoppingCart',
    type: 'expense',
    createdAt: SEED_DATE,
  },
  { id: 'expense-rent', name: 'Rent', icon: 'Home', type: 'expense', createdAt: SEED_DATE },
  {
    id: 'expense-subscriptions',
    name: 'Subscriptions',
    icon: 'Repeat',
    type: 'expense',
    createdAt: SEED_DATE,
  },
  { id: 'expense-personal', name: 'Personal', icon: 'User', type: 'expense', createdAt: SEED_DATE },
  { id: 'expense-family', name: 'Family', icon: 'Users', type: 'expense', createdAt: SEED_DATE },
  {
    id: 'expense-other',
    name: 'Other',
    icon: 'MoreHorizontal',
    type: 'expense',
    createdAt: SEED_DATE,
  },
  {
    id: 'income-salary',
    name: 'Salary',
    icon: 'BriefcaseBusiness',
    type: 'income',
    createdAt: SEED_DATE,
  },
  {
    id: 'income-freelance',
    name: 'Freelance',
    icon: 'Laptop',
    type: 'income',
    createdAt: SEED_DATE,
  },
  {
    id: 'income-business',
    name: 'Business',
    icon: 'Building2',
    type: 'income',
    createdAt: SEED_DATE,
  },
  {
    id: 'income-investment',
    name: 'Investment',
    icon: 'TrendingUp',
    type: 'income',
    createdAt: SEED_DATE,
  },
  { id: 'income-gift', name: 'Gift', icon: 'Gift', type: 'income', createdAt: SEED_DATE },
  { id: 'income-refund', name: 'Refund', icon: 'Undo2', type: 'income', createdAt: SEED_DATE },
  {
    id: 'income-other',
    name: 'Other',
    icon: 'MoreHorizontal',
    type: 'income',
    createdAt: SEED_DATE,
  },
];

/**
 * Stable slugs for the built-in categories. The two `other` categories are
 * namespaced because slugs are unique across types.
 */
export function slugForDefaultCategoryId(id: string): string {
  if (id === 'expense-other') return 'other-expense';
  if (id === 'income-other') return 'other-income';
  return id.replace(/^(expense|income)-/, '');
}

export const DEFAULT_CATEGORIES: Category[] = BASE_CATEGORIES.map((category, index) => ({
  ...category,
  slug: slugForDefaultCategoryId(category.id),
  isDefault: true,
  sortOrder: index,
  updatedAt: category.createdAt,
}));

interface CategoryRow {
  id: string;
  slug: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  type: TransactionType;
  is_default: number;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug ?? undefined,
    name: row.name,
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
    type: row.type,
    isDefault: row.is_default === 1,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

export async function getCategories(
  db: SQLiteDatabase,
  type?: TransactionType,
  opts: { includeArchived?: boolean } = {}
): Promise<Category[]> {
  const conditions = ['deleted_at IS NULL'];
  const params: (string | number)[] = [];
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (!opts.includeArchived) {
    conditions.push('archived_at IS NULL');
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT * FROM categories
     ${where}
     ORDER BY type, sort_order, (name = 'Other') COLLATE NOCASE, name COLLATE NOCASE`,
    ...params
  );
  return rows.map(mapCategory);
}

export async function getCategoryById(db: SQLiteDatabase, id: string): Promise<Category | null> {
  const row = await db.getFirstAsync<CategoryRow>(
    'SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL',
    id
  );
  return row ? mapCategory(row) : null;
}

export async function createCategory(db: SQLiteDatabase, input: NewCategory): Promise<Category> {
  const id = generateId();
  const createdAt = new Date().toISOString();
  const existing = await db.getAllAsync<{ sort_order: number }>(
    'SELECT sort_order FROM categories WHERE deleted_at IS NULL ORDER BY sort_order DESC LIMIT 1'
  );
  const sortOrder = (existing[0]?.sort_order ?? -1) + 1;
  await db.runAsync(
    `INSERT INTO categories
       (id, name, icon, color, type, is_default, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    id,
    input.name,
    input.icon ?? null,
    input.color ?? null,
    input.type,
    sortOrder,
    createdAt,
    createdAt
  );
  return {
    id,
    ...input,
    isDefault: false,
    sortOrder,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  input: NewCategory
): Promise<void> {
  await db.runAsync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, type = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    input.name,
    input.icon ?? null,
    input.color ?? null,
    input.type,
    new Date().toISOString(),
    id
  );
}

/** Soft delete so history stays intact. Callers must still block deleting categories in use. */
export async function deleteCategory(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    'UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    new Date().toISOString(),
    new Date().toISOString(),
    id
  );
}

export async function countCategoryUsage(db: SQLiteDatabase, id: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ? AND deleted_at IS NULL',
    id
  );
  return row?.count ?? 0;
}
