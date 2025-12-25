export type TransactionType = 'income' | 'expense';

export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export type UserRole = 'admin' | 'comptable' | 'raf' | 'cabinet';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  service: string;
  user: string;
  article: string;
  description: string;
  status: TransactionStatus;
  hasReceipt: boolean;
  receiptUrl?: string;
  invoiceRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  createdAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  pendingTransactions: number;
  approvedTransactions: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface ReportPeriod {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  startDate: string;
  endDate: string;
  label: string;
}

export interface ChartData {
  name: string;
  income: number;
  expenses: number;
  balance: number;
}
