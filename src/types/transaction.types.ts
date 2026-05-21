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
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type TransactionCreateInput = Omit<TransactionInterface, Create>;
export type TransactionUpdateInput = Partial<TransactionCreateInput>;
export type TransactionDTO = Omit<TransactionInterface, 'deletedAt'>;