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