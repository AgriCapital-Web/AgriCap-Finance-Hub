// App Role types (matching Supabase enum)
export type AppRole = 'super_admin' | 'admin' | 'comptable' | 'raf' | 'cabinet' | 'auditeur';

// Transaction types (matching Supabase enum)
export type TransactionType = 'income' | 'expense';

// Validation status (matching Supabase enum)
export type ValidationStatus = 'draft' | 'submitted' | 'raf_validated' | 'dg_validated' | 'locked' | 'rejected';

// Payment method (matching Supabase enum)
export type PaymentMethod = 'cash' | 'bank' | 'mobile_money' | 'cheque' | 'transfer';

// Operational status for stakeholders (matching Supabase enum)
export type OperationalStatus = 'employe_interne' | 'prestataire_interne' | 'prestataire_externe' | 'consultant' | 'fournisseur' | 'autre';

// Legacy types for backward compatibility
export type TransactionStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = AppRole;

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
  role: AppRole;
  department: string;
  isActive: boolean;
  createdAt: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  title?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Associate {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  entry_date: string;
  total_contribution: number;
  participation_rate: number;
  notes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AssociateContribution {
  id: string;
  associate_id: string;
  transaction_id?: string;
  amount: number;
  contribution_date: string;
  contribution_type?: string;
  description?: string;
  created_by?: string;
  created_at: string;
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
  description?: string;
  is_active: boolean;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  department_id?: string;
  budget: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export interface Stakeholder {
  id: string;
  name: string;
  operational_status: OperationalStatus;
  contract_type?: string;
  department_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  bank_account?: string;
  is_active: boolean;
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

export interface ValidationRecord {
  id: string;
  transaction_id: string;
  from_status: ValidationStatus;
  to_status: ValidationStatus;
  validated_by?: string;
  comment?: string;
  created_at: string;
}

// Role labels for display
export const roleLabels: Record<AppRole, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-primary text-primary-foreground' },
  admin: { label: 'Administrateur', color: 'bg-blue-500 text-white' },
  comptable: { label: 'Comptable', color: 'bg-green-500 text-white' },
  raf: { label: 'RAF', color: 'bg-purple-500 text-white' },
  cabinet: { label: 'Cabinet comptable', color: 'bg-orange-500 text-white' },
  auditeur: { label: 'Auditeur', color: 'bg-gray-500 text-white' },
};

// Validation status labels
export const validationStatusLabels: Record<ValidationStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Soumis', color: 'bg-blue-100 text-blue-800' },
  raf_validated: { label: 'Validé RAF', color: 'bg-yellow-100 text-yellow-800' },
  dg_validated: { label: 'Validé DG', color: 'bg-green-100 text-green-800' },
  locked: { label: 'Verrouillé', color: 'bg-purple-100 text-purple-800' },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
};

// Payment method labels
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  bank: 'Banque',
  mobile_money: 'Mobile Money',
  cheque: 'Chèque',
  transfer: 'Virement',
};

// Operational status labels
export const operationalStatusLabels: Record<OperationalStatus, string> = {
  employe_interne: 'Employé interne',
  prestataire_interne: 'Prestataire interne',
  prestataire_externe: 'Prestataire externe',
  consultant: 'Consultant',
  fournisseur: 'Fournisseur',
  autre: 'Autre',
};
