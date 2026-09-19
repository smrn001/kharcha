import type { SQLiteDatabase } from 'expo-sqlite';
import { CATEGORY_SEARCH_ALIASES, NEPALI_CATEGORY_NAMES } from '@/lib/category-aliases';
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

const V1_BASE_CATEGORIES: BaseCategory[] = [
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

export const V1_DEFAULT_CATEGORIES: Category[] = V1_BASE_CATEGORIES.map((category, index) => ({
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

export interface NepalCategoryDef {
  slug: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

/** PRD Appendix A defaults (English canonical names; Nepali names live in the dictionary). */
export const NEPAL_CATEGORY_DEFS: NepalCategoryDef[] = [
  { slug: 'food', name: 'Food & Dining', icon: 'Utensils', color: '#F59E0B', type: 'expense' },
  { slug: 'groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#84CC16', type: 'expense' },
  { slug: 'rent', name: 'Rent', icon: 'Home', color: '#8B5CF6', type: 'expense' },
  { slug: 'electricity', name: 'Electricity', icon: 'Zap', color: '#EAB308', type: 'expense' },
  { slug: 'water', name: 'Water', icon: 'Droplets', color: '#38BDF8', type: 'expense' },
  { slug: 'internet_mobile', name: 'Internet & Mobile', icon: 'Smartphone', color: '#6366F1', type: 'expense' },
  { slug: 'transport', name: 'Transport', icon: 'Bus', color: '#F97316', type: 'expense' },
  { slug: 'fuel', name: 'Fuel', icon: 'Fuel', color: '#EF4444', type: 'expense' },
  { slug: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899', type: 'expense' },
  { slug: 'clothing', name: 'Clothing', icon: 'Shirt', color: '#A855F7', type: 'expense' },
  { slug: 'health', name: 'Health & Medicine', icon: 'HeartPulse', color: '#F43F5E', type: 'expense' },
  { slug: 'education', name: 'Education', icon: 'GraduationCap', color: '#3B82F6', type: 'expense' },
  { slug: 'entertainment', name: 'Entertainment', icon: 'Clapperboard', color: '#D946EF', type: 'expense' },
  { slug: 'travel', name: 'Travel', icon: 'Plane', color: '#0EA5E9', type: 'expense' },
  { slug: 'personal_care', name: 'Personal Care', icon: 'User', color: '#E879F9', type: 'expense' },
  { slug: 'family', name: 'Family & Children', icon: 'Users', color: '#FB7185', type: 'expense' },
  { slug: 'gifts_social', name: 'Gifts & Social', icon: 'Gift', color: '#F472B6', type: 'expense' },
  { slug: 'festival', name: 'Festival', icon: 'PartyPopper', color: '#FB923C', type: 'expense' },
  { slug: 'religion_donation', name: 'Religion & Donation', icon: 'Church', color: '#FACC15', type: 'expense' },
  { slug: 'loan_emi', name: 'Loan & EMI', icon: 'Landmark', color: '#64748B', type: 'expense' },
  { slug: 'insurance', name: 'Insurance', icon: 'ShieldCheck', color: '#14B8A6', type: 'expense' },
  { slug: 'tax_fees', name: 'Tax & Fees', icon: 'Receipt', color: '#78716C', type: 'expense' },
  { slug: 'subscriptions', name: 'Subscriptions', icon: 'Repeat', color: '#8B5CF6', type: 'expense' },
  { slug: 'adjustment', name: 'Adjustment', icon: 'SlidersHorizontal', color: '#94A3B8', type: 'expense' },
  { slug: 'other-expense', name: 'Other', icon: 'MoreHorizontal', color: '#9CA3AF', type: 'expense' },
  { slug: 'salary', name: 'Salary', icon: 'BriefcaseBusiness', color: '#16A34A', type: 'income' },
  { slug: 'bonus', name: 'Bonus / Allowance', icon: 'Award', color: '#65A30D', type: 'income' },
  { slug: 'business', name: 'Business', icon: 'Building2', color: '#2563EB', type: 'income' },
  { slug: 'freelance', name: 'Freelance', icon: 'Laptop', color: '#7C3AED', type: 'income' },
  { slug: 'remittance', name: 'Remittance', icon: 'Send', color: '#059669', type: 'income' },
  { slug: 'rent_received', name: 'Rent Received', icon: 'Banknote', color: '#4D7C0F', type: 'income' },
  { slug: 'interest_dividend', name: 'Interest & Dividend', icon: 'TrendingUp', color: '#0D9488', type: 'income' },
  { slug: 'pocket_money', name: 'Pocket Money', icon: 'Wallet', color: '#DB2777', type: 'income' },
  { slug: 'gift', name: 'Gift', icon: 'HandCoins', color: '#E11D48', type: 'income' },
  { slug: 'refund', name: 'Refund / Cashback', icon: 'Undo2', color: '#0284C7', type: 'income' },
  { slug: 'other-income', name: 'Other', icon: 'MoreHorizontal', color: '#9CA3AF', type: 'income' },
];

/**
 * v1 default id → Nepal slug. Old ids absent here (e.g. `expense-bills`)
 * are archived by the v2→v3 migration; their transactions stay in history.
 */
export const V1_ID_TO_NEPAL_SLUG: Record<string, string> = {
  'expense-food': 'food',
  'expense-transport': 'transport',
  'expense-shopping': 'shopping',
  'expense-entertainment': 'entertainment',
  'expense-health': 'health',
  'expense-education': 'education',
  'expense-travel': 'travel',
  'expense-groceries': 'groceries',
  'expense-rent': 'rent',
  'expense-subscriptions': 'subscriptions',
  'expense-personal': 'personal_care',
  'expense-family': 'family',
  'expense-other': 'other-expense',
  'income-salary': 'salary',
  'income-freelance': 'freelance',
  'income-business': 'business',
  'income-investment': 'interest_dividend',
  'income-gift': 'gift',
  'income-refund': 'refund',
  'income-other': 'other-income',
};

export function nepalDefForSlug(slug: string): NepalCategoryDef | undefined {
  return NEPAL_CATEGORY_DEFS.find((def) => def.slug === slug);
}

function normalizeSearchTerm(term: string): string {
  return term.normalize('NFC').toLowerCase();
}

/**
 * Category ids matching a search term via slug, Nepali name or Roman-Nepali
 * alias (search-only; aliases are never displayed). Supplements the SQL
 * LIKE match on title/note/English name.
 */
export async function resolveCategoryIdsForSearch(
  db: SQLiteDatabase,
  term: string
): Promise<string[]> {
  const needle = normalizeSearchTerm(term.trim());
  if (!needle) return [];
  const rows = await db.getAllAsync<{ id: string; slug: string | null; name: string }>(
    'SELECT id, slug, name FROM categories WHERE deleted_at IS NULL'
  );
  const matched: string[] = [];
  for (const row of rows) {
    const slug = row.slug ?? '';
    const haystacks = [
      slug,
      row.name,
      slug ? (NEPALI_CATEGORY_NAMES[slug] ?? '') : '',
      ...((slug ? CATEGORY_SEARCH_ALIASES[slug] : undefined) ?? []),
    ].map(normalizeSearchTerm);
    if (haystacks.some((hay) => hay && (hay.includes(needle) || needle.includes(hay)))) {
      matched.push(row.id);
    }
  }
  return matched;
}
