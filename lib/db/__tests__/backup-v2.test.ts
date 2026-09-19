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
  });
});
