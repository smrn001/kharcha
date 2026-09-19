import type { SQLiteDatabase } from 'expo-sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createAccount,
  ensureDefaultAccount,
  getAccountBalance,
} from '../accounts';
import { migrateDbIfNeeded } from '../migrations';
import {
  createTransaction,
  deleteTransaction,
  getAnalyticsSummary,
  getCategorySpending,
  getDashboardSummary,
  getSpendingTrend,
  getTransactionById,
  getTransactions,
  hardDeleteTransaction,
  updateTransaction,
} from '../transactions';
import { createTestDb, type TestDatabase } from './sqlite-shim';

let db: TestDatabase;

async function setup(): Promise<SQLiteDatabase> {
  db = createTestDb();
  const sql = db as unknown as SQLiteDatabase;
  await migrateDbIfNeeded(sql);
  return sql;
}

afterEach(() => {
  db?.close();
});

const FOOD = 'expense-food';
const INCOME_OTHER = 'income-other';

async function cashId(sql: SQLiteDatabase): Promise<string> {
  return (await ensureDefaultAccount(sql)).id;
}

describe('transactions repository (v2)', () => {
  it('creates and reads with derived local dates', async () => {
    const sql = await setup();
    const accountId = await cashId(sql);
    const tx = await createTransaction(sql, {
      type: 'expense',
      amount: 25000,
      accountId,
      categoryId: FOOD,
      title: 'Lunch',
      date: '2026-09-18T10:00:00.000Z',
    });
    expect(tx.localDate).toBe('2026-09-18');
    expect(tx.date).toBe('2026-09-18T10:00:00.000Z');
    expect(await getTransactionById(sql, tx.id)).toMatchObject({ id: tx.id, title: 'Lunch' });

    const summary = await getDashboardSummary(sql, 1);
    expect(summary.expense).toBe(25000);
    expect(summary.balance).toBe(-25000);
  });

  it('rejects invalid transactions', async () => {
    const sql = await setup();
    const accountId = await cashId(sql);
    const base = {
      type: 'expense' as const,
      amount: 100,
      accountId,
      categoryId: FOOD,
      date: '2026-09-18T10:00:00.000Z',
    };
    await expect(createTransaction(sql, { ...base, amount: 0 })).rejects.toThrow();
    await expect(createTransaction(sql, { ...base, amount: 10.5 })).rejects.toThrow();
    await expect(
      createTransaction(sql, { ...base, type: 'transfer', toAccountId: accountId })
    ).rejects.toThrow(); // same account
    await expect(
      createTransaction(sql, {
        type: 'transfer',
        amount: 100,
        accountId,
        toAccountId: 'nope',
        date: base.date,
      })
    ).rejects.toThrow(); // unknown account
    await expect(
      createTransaction(sql, { ...base, type: 'income', categoryId: undefined })
    ).rejects.toThrow(); // category required
    await expect(
      createTransaction(sql, { ...base, accountId: 'nope' })
    ).rejects.toThrow();
  });

  it('moves money on transfer without touching income/expense', async () => {
    const sql = await setup();
    const cash = await cashId(sql);
    const bank = await createAccount(sql, { name: 'Bank', kind: 'bank' });
    await createTransaction(sql, {
      type: 'transfer',
      amount: 100000,
      accountId: cash,
      toAccountId: bank.id,
      date: '2026-09-18T10:00:00.000Z',
    });

    expect(await getAccountBalance(sql, cash)).toBe(-100000);
    expect(await getAccountBalance(sql, bank.id)).toBe(100000);
    const summary = await getAnalyticsSummary(sql, '2026-09-01', '2026-09-30');
    expect(summary).toEqual({ income: 0, expense: 0, saved: 0 });
    const dashboard = await getDashboardSummary(sql, 1);
    expect(dashboard.balance).toBe(0);
  });

  it('soft-deletes and hard-deletes', async () => {
    const sql = await setup();
    const accountId = await cashId(sql);
    const tx = await createTransaction(sql, {
      type: 'expense',
      amount: 100,
      accountId,
      categoryId: FOOD,
      date: '2026-09-18T10:00:00.000Z',
    });
    await deleteTransaction(sql, tx.id);
    expect(await getTransactionById(sql, tx.id)).toBeNull();
    expect(await getTransactions(sql)).toEqual([]);
    expect(await getTransactions(sql, { includeDeleted: true })).toHaveLength(1);

    const tx2 = await createTransaction(sql, {
      type: 'expense',
      amount: 100,
      accountId,
      categoryId: FOOD,
      date: '2026-09-18T10:00:00.000Z',
    });
    await hardDeleteTransaction(sql, tx2.id);
    expect(await getTransactions(sql, { includeDeleted: true })).toHaveLength(1);
  });

  it('paginates with a keyset cursor', async () => {
    const sql = await setup();
    const accountId = await cashId(sql);
    for (let day = 1; day <= 5; day++) {
      await createTransaction(sql, {
        type: 'expense',
        amount: day * 100,
        accountId,
        categoryId: FOOD,
        date: `2026-09-${String(day).padStart(2, '0')}T10:00:00.000Z`,
      });
    }
    const page1 = await getTransactions(sql, { limit: 2 });
    expect(page1.map((tx) => tx.localDate)).toEqual(['2026-09-05', '2026-09-04']);
    const last = page1[page1.length - 1];
    const page2 = await getTransactions(sql, {
      limit: 2,
      before: { localDate: last.localDate, occurredAt: last.date, id: last.id },
    });
    expect(page2.map((tx) => tx.localDate)).toEqual(['2026-09-03', '2026-09-02']);
  });

  it('filters by account and aggregates by local date', async () => {
    const sql = await setup();
    const cash = await cashId(sql);
    const bank = await createAccount(sql, { name: 'Bank', kind: 'bank' });
    await createTransaction(sql, {
      type: 'expense',
      amount: 100,
      accountId: cash,
      categoryId: FOOD,
      date: '2026-09-18T10:00:00.000Z',
    });
    await createTransaction(sql, {
      type: 'expense',
      amount: 200,
      accountId: bank.id,
      categoryId: FOOD,
      date: '2026-09-18T10:00:00.000Z',
    });

    expect(await getTransactions(sql, { accountIds: [bank.id] })).toHaveLength(1);
    const spending = await getCategorySpending(sql, '2026-09-01', '2026-09-30');
    expect(spending).toHaveLength(1);
    expect(spending[0].amount).toBe(300);
    const trend = await getSpendingTrend(sql, '2026-09-18', '2026-09-18');
    expect(trend).toEqual([{ date: '2026-09-18', income: 0, expense: 300 }]);
  });

  it('updates fields and recomputes dates', async () => {
    const sql = await setup();
    const accountId = await cashId(sql);
    const tx = await createTransaction(sql, {
      type: 'expense',
      amount: 100,
      accountId,
      categoryId: FOOD,
      date: '2026-09-18T10:00:00.000Z',
    });
    const updated = await updateTransaction(sql, tx.id, {
      amount: 200,
      type: 'income',
      categoryId: INCOME_OTHER,
    });
    expect(updated).toMatchObject({ amount: 200, type: 'income', categoryId: INCOME_OTHER });
    expect(await updateTransaction(sql, 'missing', { amount: 1 })).toBeNull();
  });

  it('respects opening balances in totals', async () => {
    const sql = await setup();
    await createAccount(sql, { name: 'Bank', kind: 'bank', openingBalance: 500000 });
    const dashboard = await getDashboardSummary(sql, 1);
    expect(dashboard.balance).toBe(500000);
  });
});
