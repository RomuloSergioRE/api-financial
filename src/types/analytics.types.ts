export interface BalanceSummaryDTO {
  totalIncome: number;  
  totalOutcome: number; 
  netBalance: number;  
}

export interface CategoryShareDTO {
  categoryId: string;
  categoryName: string;
  color: string | null;
  icon: string | null;
  totalAmount: number;  
  percentage: number;  
}

export interface AnalyticsFilterInput {
  startDate?: string | undefined;   
  endDate?: string | undefined;     
  categoryId?: string | undefined;  
}

export interface SequelizeGroupResult {
  categoryId: string;
  total: string;
  category: {
    name: string;
    color: string | null;
    icon: string | null;
  };
}