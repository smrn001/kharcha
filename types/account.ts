export type AccountKind = 'cash' | 'bank' | 'wallet' | 'card' | 'savings' | 'other';

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  icon?: string;
  /** Opening balance in minor units (paisa). */
  openingBalance: number;
  includeInTotal: boolean;
  sortOrder: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface NewAccount {
  name: string;
  kind: AccountKind;
  icon?: string;
  openingBalance?: number;
  includeInTotal?: boolean;
}
