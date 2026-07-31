export type TransactionType = 'income' | 'expense';

export interface Transaction {
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

export interface NewTransaction {
  type: TransactionType;
  amount: number;
  categoryId: string;
  title?: string;
  note?: string;
  date: string;
}

export type UpdateTransaction = Partial<NewTransaction>;
