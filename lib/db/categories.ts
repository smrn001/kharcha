import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '@/lib/id';
import type { Category, NewCategory, TransactionType } from '@/types';

const SEED_DATE = new Date(0).toISOString();

export const DEFAULT_CATEGORIES: Category[] = [
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

interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  type: TransactionType;
  created_at: string;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? undefined,
    type: row.type,
    createdAt: row.created_at,
  };
}

export async function getCategories(
  db: SQLiteDatabase,
  type?: TransactionType
): Promise<Category[]> {
  const rows = type
    ? await db.getAllAsync<CategoryRow>(
        `SELECT * FROM categories
         WHERE type = ?
         ORDER BY (name = 'Other') COLLATE NOCASE, name COLLATE NOCASE`,
        type
      )
    : await db.getAllAsync<CategoryRow>(
        `SELECT * FROM categories
         ORDER BY type, (name = 'Other') COLLATE NOCASE, name COLLATE NOCASE`
      );
  return rows.map(mapCategory);
}

export async function getCategoryById(db: SQLiteDatabase, id: string): Promise<Category | null> {
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', id);
  return row ? mapCategory(row) : null;
}

export async function createCategory(db: SQLiteDatabase, input: NewCategory): Promise<Category> {
  const id = generateId();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO categories (id, name, icon, type, created_at) VALUES (?, ?, ?, ?, ?)',
    id,
    input.name,
    input.icon ?? null,
    input.type,
    createdAt
  );
  return { id, ...input, createdAt };
}
