import type { SQLiteDatabase } from 'expo-sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureDefaultAccount } from '../accounts';
import {
  collectBackup,
  importBackup,
  serializeBackup,
  validateBackup,
} from '../backup';
import { migrateDbIfNeeded } from '../migrations';
import { createTransaction, getDashboardSummary, getTransactions } from '../transactions';
import { createTestDb, type TestDatabase } from './sqlite-shim';

let dbs: TestDatabase[] = [];

async function setup(): Promise<SQLiteDatabase> {
  const db = createTestDb();
  dbs.push(db);
  const sql = db as unknown as SQLiteDatabase;
  await migrateDbIfNeeded(sql);
  return sql;
}

afterEach(() => {
  for (const db of dbs) db.close();
  dbs = [];
});

describe('backup round-trip (v2)', () => {
  it('collects and restores everything including accounts and transfers', async () => {
    const src = await setup();
    const cash = await ensureDefaultAccount(src);
    const { createAccount } = await import('../accounts');
    const bank = await createAccount(src, { name: 'Bank', kind: 'bank', openingBalance: 100000 });
    await createTransaction(src, {
      type: 'expense',
      amount: 25000,
      accountId: cash.id,
      categoryId: 'food',
      title: 'Lunch',
      date: '2026-09-18T10:00:00.000Z',
    });
    await createTransaction(src, {
      type: 'transfer',
      amount: 50000,
      accountId: cash.id,
      toAccountId: bank.id,
      date: '2026-09-17T10:00:00.000Z',
    });

    const backup = await collectBackup(src);
    expect(backup.accounts.map((account) => account.name).sort()).toEqual(['Bank', 'Cash']);

    const dst = await setup();
    const validated = validateBackup(JSON.parse(serializeBackup(backup)));
    expect(validated.ok).toBe(true);
    if (!validated.ok) throw new Error('unreachable');
    const result = await importBackup(dst, validated.data);
    expect(result).toMatchObject({ imported: 2, skipped: 0 });

    const txs = await getTransactions(dst);
    expect(txs).toHaveLength(2);
    const transfer = txs.find((tx) => tx.type === 'transfer');
    expect(transfer?.toAccountId).toBe(bank.id);

    const srcSummary = await getDashboardSummary(src, 1);
    const dstSummary = await getDashboardSummary(dst, 1);
    expect(dstSummary).toEqual(srcSummary);

    // Re-import is a no-op for duplicates.
    const again = await importBackup(dst, validated.data);
    expect(again).toMatchObject({ imported: 0, skipped: 2 });
  });

  it('imports pre-accounts backups into Cash', async () => {
    const dst = await setup();
    const legacy = {
      version: 1,
      app: 'kharcha',
      exportedAt: new Date().toISOString(),
      categories: [
        {
          id: 'food',
          name: 'Food',
          type: 'expense',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      transactions: [
        {
          id: 'old-1',
          type: 'expense',
          amount: 999,
          categoryId: 'food',
          date: '2026-09-18T10:00:00.000Z',
          createdAt: '2026-09-18T10:00:00.000Z',
          updatedAt: '2026-09-18T10:00:00.000Z',
        },
      ],
    };
    const validated = validateBackup(legacy);
    expect(validated.ok).toBe(true);
    if (!validated.ok) throw new Error('unreachable');
    const result = await importBackup(dst, validated.data);
    expect(result.imported).toBe(1);
    const txs = await getTransactions(dst);
    expect(txs[0].accountId).toBe('account-cash');
    // v1 amounts are already minor units; import must not rescale them.
    expect(txs[0].amount).toBe(999);
  });

  it('imports a full legacy v1 export without rescaling amounts', async () => {
    const dst = await setup();
    const legacy = {
      version: 1,
      app: 'kharcha',
      exportedAt: '2026-09-19T05:00:58.754Z',
      categories: [
        {
          id: 'expense-education',
          name: 'Education',
          icon: 'GraduationCap',
          type: 'expense',
          createdAt: '1970-01-01T00:00:00.000Z',
        },
        {
          id: 'expense-transport',
          name: 'Transport',
          icon: 'Bus',
          type: 'expense',
          createdAt: '1970-01-01T00:00:00.000Z',
        },
        {
          id: 'income-salary',
          name: 'Salary',
          icon: 'BriefcaseBusiness',
          type: 'income',
          createdAt: '1970-01-01T00:00:00.000Z',
        },
      ],
      transactions: [
        {
          id: 'id-old-1',
          type: 'expense',
          amount: 10000,
          categoryId: 'expense-transport',
          date: '2026-09-18T03:20:00.000Z',
          createdAt: '2026-09-19T03:20:16.967Z',
          updatedAt: '2026-09-19T03:20:16.967Z',
        },
        {
          id: 'id-old-2',
          type: 'expense',
          amount: 43000,
          categoryId: 'expense-food',
          title: 'Kta haru',
          date: '2026-08-01T14:17:36.076Z',
          createdAt: '2026-08-01T14:17:53.949Z',
          updatedAt: '2026-08-01T14:17:53.949Z',
        },
        {
          id: 'id-old-3',
          type: 'income',
          amount: 100000,
          categoryId: 'income-salary',
          title: 'Mummy le',
          date: '2026-08-01T04:13:00.000Z',
          createdAt: '2026-08-01T10:14:22.384Z',
          updatedAt: '2026-08-01T10:14:22.384Z',
        },
      ],
    };
    const validated = validateBackup(legacy);
    expect(validated.ok).toBe(true);
    if (!validated.ok) throw new Error('unreachable');
    const result = await importBackup(dst, validated.data);
    // The missing expense-other category is created as a fallback for
    // expense-food; all three transactions land.
    expect(result.imported).toBe(3);

    const txs = await getTransactions(dst);
    expect(txs).toHaveLength(3);
    expect(txs.find((tx) => tx.id === 'id-old-1')?.amount).toBe(10000);
    expect(txs.find((tx) => tx.id === 'id-old-2')?.amount).toBe(43000);
    expect(txs.find((tx) => tx.id === 'id-old-3')?.amount).toBe(100000);
    expect(txs.find((tx) => tx.id === 'id-old-1')?.accountId).toBe('account-cash');

    const categories = await import('../categories').then((m) => m.getCategories(dst));
    expect(categories.find((c) => c.id === 'expense-transport')?.icon).toBe('Bus');
    expect(categories.find((c) => c.id === 'income-salary')?.icon).toBe('BriefcaseBusiness');
  });
});
