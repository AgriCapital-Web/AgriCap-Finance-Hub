import { Transaction, User, Department, FinancialSummary, ChartData } from '@/types';

export const departments: Department[] = [
  { id: '1', name: 'Direction', code: 'DIR' },
  { id: '2', name: 'Opération', code: 'OPE' },
  { id: '3', name: 'Commercial', code: 'COM' },
  { id: '4', name: 'Administration', code: 'ADM' },
];

export const categories = {
  income: ['Approvisionnement', 'Levée de fonds', 'Vente', 'Subvention', 'Autre entrée'],
  expense: ['Carburation', 'Achats de Matériel', 'Salaires', 'Négoce', 'Fournitures', 'Services', 'Autre dépense'],
};

export const mockUsers: User[] = [
  { id: '1', email: 'admin@agricapital.ci', name: 'KOUAKOU Kouame Jacques', role: 'admin', department: 'Direction', isActive: true, createdAt: '2024-01-01' },
  { id: '2', email: 'comptable@agricapital.ci', name: 'KOFFI Inocent', role: 'comptable', department: 'Administration', isActive: true, createdAt: '2024-01-15' },
  { id: '3', email: 'raf@agricapital.ci', name: 'TRAORE Aminata', role: 'raf', department: 'Administration', isActive: true, createdAt: '2024-02-01' },
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-11-12',
    amount: 1000000,
    type: 'income',
    category: 'Approvisionnement',
    service: 'Direction',
    user: 'KOUAKOU Kouame Jacques',
    article: 'Apport Associé',
    description: 'Apport de fonds par associé',
    status: 'approved',
    hasReceipt: true,
    createdAt: '2025-11-12T10:00:00Z',
    updatedAt: '2025-11-12T10:00:00Z',
  },
  {
    id: '2',
    date: '2025-11-12',
    amount: 3000,
    type: 'expense',
    category: 'Carburation',
    service: 'Direction',
    user: 'KOFFI Inocent',
    article: 'Carburation Direction',
    description: 'Frais de carburant direction',
    status: 'approved',
    hasReceipt: false,
    createdAt: '2025-11-12T11:00:00Z',
    updatedAt: '2025-11-12T11:00:00Z',
  },
  {
    id: '3',
    date: '2025-11-13',
    amount: 300000,
    type: 'expense',
    category: 'Achats de Matériel',
    service: 'Opération',
    user: 'KOFFI Inocent',
    article: 'Achats de Matériel',
    description: 'Achat de Moto pompe',
    status: 'approved',
    hasReceipt: true,
    createdAt: '2025-11-13T09:00:00Z',
    updatedAt: '2025-11-13T09:00:00Z',
  },
  {
    id: '4',
    date: '2025-11-13',
    amount: 100000,
    type: 'expense',
    category: 'Achats de Matériel',
    service: 'Opération',
    user: 'KOFFI Inocent',
    article: 'Achats de Matériel',
    description: '20 vanes d\'aspresseurs',
    status: 'pending',
    hasReceipt: true,
    createdAt: '2025-11-13T10:00:00Z',
    updatedAt: '2025-11-13T10:00:00Z',
  },
  {
    id: '5',
    date: '2025-11-13',
    amount: 25000,
    type: 'expense',
    category: 'Achats de Matériel',
    service: 'Opération',
    user: 'KOFFI Inocent',
    article: 'Achats de Matériel',
    description: '25 mettre de tuyau d\'aspiration',
    status: 'pending',
    hasReceipt: true,
    createdAt: '2025-11-13T11:00:00Z',
    updatedAt: '2025-11-13T11:00:00Z',
  },
  {
    id: '6',
    date: '2025-11-15',
    amount: 210000,
    type: 'expense',
    category: 'Achats de Matériel',
    service: 'Opération',
    user: 'KOFFI Inocent',
    article: 'Achats de Matériel',
    description: 'Sacs de remplissage',
    status: 'approved',
    hasReceipt: false,
    createdAt: '2025-11-15T09:00:00Z',
    updatedAt: '2025-11-15T09:00:00Z',
  },
  {
    id: '7',
    date: '2025-11-15',
    amount: 5500,
    type: 'expense',
    category: 'Négoce',
    service: 'Opération',
    user: 'KOFFI Inocent',
    article: 'Négoce',
    description: 'Remerciement',
    status: 'approved',
    hasReceipt: false,
    createdAt: '2025-11-15T10:00:00Z',
    updatedAt: '2025-11-15T10:00:00Z',
  },
  {
    id: '8',
    date: '2025-11-17',
    amount: 2000,
    type: 'expense',
    category: 'Carburation',
    service: 'Direction',
    user: 'KOFFI Inocent',
    article: 'Carburation Direction',
    description: 'Frais de carburant',
    status: 'approved',
    hasReceipt: true,
    createdAt: '2025-11-17T09:00:00Z',
    updatedAt: '2025-11-17T09:00:00Z',
  },
];

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
