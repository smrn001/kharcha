import type { TransactionType } from './transaction';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  type: TransactionType;
  createdAt: string;
}

export interface NewCategory {
  name: string;
  icon?: string;
  type: TransactionType;
}
