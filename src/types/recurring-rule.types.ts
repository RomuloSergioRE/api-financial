export interface RecurringRuleInterface {
  id: string;
  userId: string;
  categoryId: string;
  description: string;
  amount: number;
  type: 'income' | 'outcome';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  nextDate: string;
  endDate: string | null;
  active: boolean;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type RecurringRuleCreateInput = Omit<RecurringRuleInterface, 'id' | 'userId' | 'active' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string };

export type RecurringRuleUpdateInput = Partial<Omit<RecurringRuleInterface, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export type RecurringRuleDTO = Omit<RecurringRuleInterface, 'deletedAt'> & { categoryName?: string };
