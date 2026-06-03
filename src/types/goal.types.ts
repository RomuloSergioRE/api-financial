export interface GoalInterface {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type GoalCreateInput = Omit<GoalInterface, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string };

export type GoalUpdateInput = {
  name?: string;
  targetAmount?: number;
  categoryId?: string | null;
  deadline?: string | null;
};

export type GoalDTO = Omit<GoalInterface, 'deletedAt'> & {
  categoryName?: string;
  progress: number;
  achieved: boolean;
};
