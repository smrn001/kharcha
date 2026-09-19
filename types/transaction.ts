export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Minor units (paisa). */
  amount: number;
  accountId: string;
  /** Transfers only. */
  toAccountId?: string;
  /** Required for income/expense; absent for transfers. */
  categoryId?: string;
  title?: string;
  note?: string;
  /** AD calendar date as experienced by the user ('YYYY-MM-DD'). Used for grouping and analytics. */
  localDate: string;
  /** ISO 8601 UTC instant. Used for ordering within a day. */
  date: string;
  /** UTC offset in minutes at entry (NPT = 345). */
  tzOffsetMin: number;
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface NewTransaction {
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  title?: string;
  note?: string;
  /** ISO date input; the repository derives localDate/occurred_at. */
  date: string;
  tzOffsetMin?: number;
}

export type UpdateTransaction = Partial<NewTransaction>;
