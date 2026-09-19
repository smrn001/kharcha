import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '@/lib/id';
import type { TransactionType } from '@/types';
import { getCategories } from './categories';
import { getTransactions } from './transactions';

/**
 * Offline backup / restore.
 *
 * Design constraints:
 * - No schema changes: works against the existing v1 database so older
 *   installs update without migrations or data loss.
 * - Import is merge-only: existing rows are never updated or deleted.
 *   Duplicate transaction ids are skipped, unknown categories fall back to
 *   the matching "Other" category (or a placeholder is created).
 * - Settings are intentionally NOT restored on import so the current
 *   device preferences (currency, theme, …) are never overwritten.
 */

export const BACKUP_VERSION = 1;
export const BACKUP_APP = 'kharcha';

const MAX_TRANSACTIONS = 50_000;
const MAX_CATEGORIES = 500;
const MAX_AMOUNT_MINOR = 1_000_000_000_00; // 1bn in minor units

export interface BackupCategory {
  id: string;
  name: string;
  icon?: string;
  type: TransactionType;
  createdAt: string;
}

export interface BackupTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  title?: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupData {
  version: number;
  app: string;
  exportedAt: string;
  categories: BackupCategory[];
  transactions: BackupTransaction[];
}

export async function collectBackup(db: SQLiteDatabase): Promise<BackupData> {
  const [categories, transactions] = await Promise.all([
    getCategories(db),
    getTransactions(db),
  ]);
  return {
    version: BACKUP_VERSION,
    app: BACKUP_APP,
    exportedAt: new Date().toISOString(),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      type: category.type,
      createdAt: category.createdAt,
    })),
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      title: transaction.title,
      note: transaction.note,
      date: transaction.date,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    })),
  };
}

export function serializeBackup(data: BackupData): string {
  return JSON.stringify(data);
}

type ValidationResult =
  | { ok: true; data: BackupData }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTransactionType(value: unknown): value is TransactionType {
  return value === 'income' || value === 'expense';
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

/**
 * Validate an unknown parsed value as backup data. Returns a
 * user-friendly error message instead of throwing.
 */
export function validateBackup(parsed: unknown): ValidationResult {
  if (!isRecord(parsed)) {
    return { ok: false, error: 'This file does not look like a Kharcha backup.' };
  }
  if (parsed.version !== BACKUP_VERSION) {
    return {
      ok: false,
      error: `Unsupported backup version (${String(parsed.version)}). Expected version ${BACKUP_VERSION}.`,
    };
  }
  if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.transactions)) {
    return { ok: false, error: 'Backup is missing transactions or categories.' };
  }
  if (parsed.categories.length > MAX_CATEGORIES) {
    return { ok: false, error: 'Backup contains too many categories to import safely.' };
  }
  if (parsed.transactions.length > MAX_TRANSACTIONS) {
    return { ok: false, error: 'Backup contains too many transactions to import safely.' };
  }

  const categories: BackupCategory[] = [];
  for (const raw of parsed.categories) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== 'string' ||
      raw.id.length === 0 ||
      typeof raw.name !== 'string' ||
      raw.name.length === 0 ||
      !isTransactionType(raw.type)
    ) {
      return { ok: false, error: 'Backup contains an invalid category.' };
    }
    categories.push({
      id: raw.id,
      name: raw.name,
      icon: typeof raw.icon === 'string' ? raw.icon : undefined,
      type: raw.type,
      createdAt: isValidDate(raw.createdAt) ? raw.createdAt : new Date(0).toISOString(),
    });
  }

  const transactions: BackupTransaction[] = [];
  for (const raw of parsed.transactions) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== 'string' ||
      raw.id.length === 0 ||
      !isTransactionType(raw.type) ||
      typeof raw.amount !== 'number' ||
      !Number.isInteger(raw.amount) ||
      raw.amount <= 0 ||
      raw.amount > MAX_AMOUNT_MINOR ||
      typeof raw.categoryId !== 'string' ||
      raw.categoryId.length === 0 ||
      !isValidDate(raw.date)
    ) {
      return { ok: false, error: 'Backup contains an invalid transaction.' };
    }
    transactions.push({
      id: raw.id,
      type: raw.type,
      amount: raw.amount,
      categoryId: raw.categoryId,
      title: typeof raw.title === 'string' ? raw.title : undefined,
      note: typeof raw.note === 'string' ? raw.note : undefined,
      date: raw.date,
      createdAt: isValidDate(raw.createdAt) ? raw.createdAt : raw.date,
      updatedAt: isValidDate(raw.updatedAt) ? raw.updatedAt : raw.date,
    });
  }

  return {
    ok: true,
    data: {
      version: BACKUP_VERSION,
      app: typeof parsed.app === 'string' ? parsed.app : BACKUP_APP,
      exportedAt: isValidDate(parsed.exportedAt)
        ? (parsed.exportedAt as string)
        : new Date().toISOString(),
      categories,
      transactions,
    },
  };
}

export interface ImportResult {
  imported: number;
  skipped: number;
  categoriesAdded: number;
}

async function ensureFallbackCategory(
  db: SQLiteDatabase,
  categoryIds: Set<string>,
  type: TransactionType,
  now: string,
  counter: { added: number }
): Promise<string> {
  const preferred = type === 'income' ? 'income-other' : 'expense-other';
  if (categoryIds.has(preferred)) return preferred;
  const placeholder = `imported-${type}-other`;
  if (!categoryIds.has(placeholder)) {
    await db.runAsync(
      'INSERT OR IGNORE INTO categories (id, name, icon, type, created_at) VALUES (?, ?, ?, ?, ?)',
      placeholder,
      'Other',
      'MoreHorizontal',
      type,
      now
    );
    categoryIds.add(placeholder);
    counter.added += 1;
  }
  return placeholder;
}

/**
 * Merge a backup into the database. Existing transactions and categories
 * are left untouched; only new ids are inserted. Runs in a single
 * transaction so a failure cannot leave a half-imported database.
 */
export async function importBackup(db: SQLiteDatabase, data: BackupData): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;
  const counter = { added: 0 };

  await db.withTransactionAsync(async () => {
    const now = new Date().toISOString();
    const existingCategories = await getCategories(db);
    const categoryIds = new Set(existingCategories.map((category) => category.id));

    for (const category of data.categories) {
      if (!categoryIds.has(category.id)) {
        await db.runAsync(
          'INSERT OR IGNORE INTO categories (id, name, icon, type, created_at) VALUES (?, ?, ?, ?, ?)',
          category.id,
          category.name,
          category.icon ?? null,
          category.type,
          category.createdAt
        );
        categoryIds.add(category.id);
        counter.added += 1;
      }
    }

    const existingRows = await db.getAllAsync<{ id: string }>('SELECT id FROM transactions');
    const existingIds = new Set(existingRows.map((row) => row.id));

    for (const transaction of data.transactions) {
      if (existingIds.has(transaction.id)) {
        skipped += 1;
        continue;
      }
      let categoryId = transaction.categoryId;
      if (!categoryIds.has(categoryId)) {
        categoryId = await ensureFallbackCategory(db, categoryIds, transaction.type, now, counter);
      }
      await db.runAsync(
        `INSERT OR IGNORE INTO transactions
           (id, type, amount, category_id, title, note, date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        transaction.id,
        transaction.type,
        transaction.amount,
        categoryId,
        transaction.title ?? null,
        transaction.note ?? null,
        transaction.date,
        transaction.createdAt,
        transaction.updatedAt
      );
      existingIds.add(transaction.id);
      imported += 1;
    }
  });

  return { imported, skipped, categoriesAdded: counter.added };
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

const CSV_HEADER = ['date', 'type', 'category', 'title', 'note', 'amount'] as const;

function escapeCsvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Export transactions as CSV with amounts in major units (e.g. 12.50). */
export function backupToCsv(data: BackupData): string {
  const names = new Map(data.categories.map((category) => [category.id, category.name]));
  const lines = [CSV_HEADER.join(',')];
  for (const transaction of data.transactions) {
    const major = (transaction.amount / 100).toFixed(2);
    lines.push(
      [
        escapeCsvField(transaction.date),
        transaction.type,
        escapeCsvField(names.get(transaction.categoryId) ?? ''),
        escapeCsvField(transaction.title ?? ''),
        escapeCsvField(transaction.note ?? ''),
        major,
      ].join(',')
    );
  }
  return lines.join('\n');
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export interface CsvTransactionRow {
  type: TransactionType;
  /** Minor units. */
  amount: number;
  categoryName: string;
  title?: string;
  note?: string;
  date: string;
}

export interface ParsedCsv {
  rows: CsvTransactionRow[];
  errors: string[];
}

/**
 * Parse CSV text into transaction rows. Accepts the exported header
 * (date,type,category,title,note,amount); category/title/note are optional.
 * Invalid rows are reported with line numbers instead of aborting.
 */
export function parseCsv(text: string): ParsedCsv {
  const rows: CsvTransactionRow[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
    return { rows, errors: ['The CSV file is empty.'] };
  }

  const header = parseCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const indexOf = (name: string): number => header.indexOf(name);
  const dateIdx = indexOf('date');
  const typeIdx = indexOf('type');
  const amountIdx = indexOf('amount');
  if (dateIdx === -1 || typeIdx === -1 || amountIdx === -1) {
    return {
      rows,
      errors: ['CSV must have date, type and amount columns (header row).'],
    };
  }
  const categoryIdx = indexOf('category');
  const titleIdx = indexOf('title');
  const noteIdx = indexOf('note');

  for (let lineNo = 2; lineNo <= lines.length; lineNo++) {
    const line = lines[lineNo - 1];
    if (line.trim() === '') continue;
    const cells = parseCsvLine(line);
    const fail = (reason: string): void => {
      if (errors.length < 20) errors.push(`Row ${lineNo}: ${reason}.`);
    };

    const type = (cells[typeIdx] ?? '').trim().toLowerCase();
    if (type !== 'income' && type !== 'expense') {
      fail(`type must be income or expense (got "${cells[typeIdx] ?? ''}")`);
      continue;
    }
    const amountCell = (cells[amountIdx] ?? '').trim();
    if (amountCell.includes('-')) {
      fail(`amount must be a number greater than 0 (got "${cells[amountIdx] ?? ''}")`);
      continue;
    }
    const amountRaw = amountCell.replace(/[^0-9.]/g, '');
    const amountMajor = Number(amountRaw);
    if (!amountRaw || !Number.isFinite(amountMajor) || amountMajor <= 0) {
      fail(`amount must be a number greater than 0 (got "${cells[amountIdx] ?? ''}")`);
      continue;
    }
    const amount = Math.round(amountMajor * 100);
    if (amount <= 0 || amount > MAX_AMOUNT_MINOR) {
      fail('amount is out of range');
      continue;
    }
    const dateRaw = (cells[dateIdx] ?? '').trim();
    const parsedDate = Date.parse(dateRaw);
    if (!dateRaw || Number.isNaN(parsedDate)) {
      fail(`date is not valid (got "${cells[dateIdx] ?? ''}")`);
      continue;
    }
    rows.push({
      type,
      amount,
      categoryName: categoryIdx === -1 ? '' : (cells[categoryIdx] ?? '').trim(),
      title: titleIdx === -1 || (cells[titleIdx] ?? '').trim() === '' ? undefined : cells[titleIdx].trim(),
      note: noteIdx === -1 || (cells[noteIdx] ?? '').trim() === '' ? undefined : cells[noteIdx].trim(),
      date: new Date(parsedDate).toISOString(),
    });
    if (rows.length > MAX_TRANSACTIONS) {
      errors.push('CSV contains too many rows to import safely.');
      break;
    }
  }

  return { rows, errors };
}

export interface CsvImportResult {
  imported: number;
  categoriesAdded: number;
  unmapped: number;
}

/**
 * Insert parsed CSV rows as new transactions (merge-only, like JSON
 * import). Unknown category names fall back to the matching "Other"
 * category; nothing existing is modified.
 */
export async function importCsvRows(
  db: SQLiteDatabase,
  rows: CsvTransactionRow[]
): Promise<CsvImportResult> {
  let imported = 0;
  let unmapped = 0;
  const counter = { added: 0 };

  await db.withTransactionAsync(async () => {
    const now = new Date().toISOString();
    const existingCategories = await getCategories(db);
    const categoryIds = new Set(existingCategories.map((category) => category.id));
    const byName = new Map<string, string>();
    for (const category of existingCategories) {
      const key = `${category.type}:${category.name.toLowerCase()}`;
      if (!byName.has(key)) byName.set(key, category.id);
    }

    for (const row of rows) {
      let categoryId = row.categoryName
        ? byName.get(`${row.type}:${row.categoryName.toLowerCase()}`)
        : undefined;
      if (!categoryId) {
        if (row.categoryName) unmapped += 1;
        categoryId = await ensureFallbackCategory(db, categoryIds, row.type, now, counter);
      }
      await db.runAsync(
        `INSERT INTO transactions
           (id, type, amount, category_id, title, note, date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        generateId(),
        row.type,
        row.amount,
        categoryId,
        row.title ?? null,
        row.note ?? null,
        row.date,
        now,
        now
      );
      imported += 1;
    }
  });

  return { imported, categoriesAdded: counter.added, unmapped };
}
