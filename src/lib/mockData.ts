import { Transaction, User, Department, FinancialSummary, ChartData } from '@/types';

export const departments: Department[] = [
  { id: '1', name: 'Direction', code: 'DIR', is_active: true },
  { id: '2', name: 'Opération', code: 'OPE', is_active: true },
  { id: '3', name: 'Commercial', code: 'COM', is_active: true },
  { id: '4', name: 'Administration', code: 'ADM', is_active: true },
  { id: '5', name: 'Associés Fondateurs', code: 'ASS', is_active: true },
];

export const categories = {
  income: ['Apport Associés', 'Levée de fonds', 'Vente', 'Subvention', 'Autre entrée'],
  expense: ['Carburation', 'Achats de Matériel', 'Salaires', 'Négoce', 'Fournitures', 'Services', 'Autre dépense'],
};

export const mockUsers: User[] = [
  { id: '1', email: 'admin@agricapital.ci', name: 'KOFFI Inocent', role: 'super_admin', department: 'Direction', isActive: true, createdAt: '2024-01-01' },
];

export const mockTransactions: Transaction[] = [];

export const calculateSummary = (transactions: Transaction[]): FinancialSummary => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const approvedTransactions = transactions.filter(t => t.status === 'approved').length;

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    pendingTransactions,
    approvedTransactions,
  };
};

export const generateChartData = (transactions: Transaction[]): ChartData[] => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  return months.map((name, index) => {
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === index;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      name,
      income,
      expenses,
      balance: income - expenses,
    };
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};