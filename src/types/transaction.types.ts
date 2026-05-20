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

// O que precisamos para criar uma transação (userId vem do JWT no Service)
export type TransactionCreateInput = Omit<TransactionInterface, Create>;

// O que permitimos atualizar
export type TransactionUpdateInput = Partial<TransactionCreateInput>;

// O que respondemos para o cliente (pode ser o objeto completo ou omitindo o deletedAt)
export type TransactionDTO = Omit<TransactionInterface, 'deletedAt'>;