type Type = 'income' | 'expense' 
type Status = 'active' | 'inactive'
type Creation = 'id' | 'status'| 'createdAt' | 'updatedAt';

export interface TransactionInterface{
    id: string;
    amount: number;
    description: string;
    date: Date;
    type: Type;
    status: Status;
    userId: string | null;
    categoryId: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export type TransactionCreation = Omit<TransactionInterface, Creation> & {
    id?: string;
    status?: Status;
}