export interface BudgetInterface {
  id: string;
  userId: string;
  categoryId: string;
  month: number;
  year: number;
  limit: number;
  spent: number;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type BudgetCreateInput = Omit<BudgetInterface, 'id' | 'userId' | 'spent' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string };

export type BudgetUpdateInput = {
  limit?: number;
  month?: number;
  year?: number;
  categoryId?: string;
};

export type BudgetDTO = Omit<BudgetInterface, 'deletedAt'> & { categoryName?: string; overBudget: boolean; percentage: number };
