import type { TransactionType } from './transaction';

export interface Category {
  id: string;
  /** Stable key for default categories; undefined for custom ones. */
  slug?: string;
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
  isDefault: boolean;
  sortOrder: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface NewCategory {
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
}
