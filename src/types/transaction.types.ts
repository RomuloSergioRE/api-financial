import type { TagDTO } from './tag.types.js';

type Type = 'income' | 'outcome' 
type Create ='id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'

export interface TransactionInterface {
  id: string;
  userId: string;
  categoryId: string;
  description: string;
  amount: number; 
  type: Type;
  date: Date;
  recurringRuleId?: string | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  tags?: TagDTO[];
}

export type TransactionCreateInput = Omit<TransactionInterface, Create>;
export type TransactionUpdateInput = Partial<TransactionCreateInput>;
export type TransactionDTO = Omit<TransactionInterface, 'deletedAt'> & { isRecurring: boolean };
