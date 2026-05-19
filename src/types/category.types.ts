type Type = 'income' | 'expense' 
type Status = 'active' | 'inactive'
type Creation = 'id' | 'status'| 'userId' | 'createdAt' | 'updatedAt';

export interface CategoryInterface{
    id: number;
    name: string;
    type: Type;
    status: Status;
    userId: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export type CategoryCreation = Omit<CategoryInterface, Creation> & {
    id?: string;
    status?: Status;
    userId?: string | null;
}