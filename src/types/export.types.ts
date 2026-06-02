export interface TransactionExportRow {
  id: string;
  date: string;
  type: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
}

export interface CategoryExportRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: 'user' | 'global';
}

export interface AnalyticsExportRow {
  type: 'income' | 'outcome' | 'category';
  name: string;
  amount: number;
  percentage: number | null;
  period: string | null;
}

export interface UserExportRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface AuditLogExportRow {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  targetType: string;
  details: string | null;
  createdAt: string;
}

export interface TransactionTemplateRow {
  categoryName: string;
  categoryId: string;
  description: string;
  amount: number;
  type: 'income' | 'outcome';
  date: string;
}
