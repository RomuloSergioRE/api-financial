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

export interface MonthlySeriesDTO {
  month: string;
  totalIncome: number;
  totalOutcome: number;
  netBalance: number;
}

export interface ComparisonDTO {
  current: BalanceSummaryDTO & { month: number; year: number };
  previous: BalanceSummaryDTO & { month: number; year: number };
  changes: {
    incomeChange: number | null;
    outcomeChange: number | null;
    netChange: number | null;
  };
}

export interface TopCategoryDTO {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

export interface ExecutiveSummaryDTO {
  month: number;
  year: number;
  totalIncome: number;
  totalOutcome: number;
  netBalance: number;
  topCategory: { name: string; amount: number } | null;
  transactionCount: number;
  dailyAverage: number;
  biggestExpense: { amount: number; description: string; date: string } | null;
  budgetAlerts: number;
  goalAchieved: number;
}

export interface CashFlowProjectionDTO {
  month: string;
  projectedIncome: number;
  projectedOutcome: number;
  projectedNet: number;
}

export interface PaginationParams {
  offset: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}