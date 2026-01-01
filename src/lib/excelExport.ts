import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './mockData';

export function exportTransactionsExcel(transactions: any[], fileName: string) {
  // Summary sheet data
  const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  
  const summaryData = [
    ['AGRICAPITAL SARL - Rapport des Transactions'],
    ['Généré le:', new Date().toLocaleDateString('fr-FR')],
    [],
    ['RÉSUMÉ'],
    ['Total Entrées', totalIncome],
    ['Total Sorties', totalExpenses],
    ['Solde Net', totalIncome - totalExpenses],
    [],
  ];

  // Transactions data
  const headers = ['Date', 'Type', 'Référence', 'Description', 'Montant (FCFA)', 'Mode de paiement', 'Statut'];
  const rows = transactions.map(t => [
    formatDate(t.date),
    t.transaction_type === 'income' ? 'Entrée' : 'Sortie',
    t.reference || '-',
    t.description || '-',
    Number(t.amount),
    t.payment_method || '-',
    t.validation_status || 'draft',
  ]);

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Summary + Transactions sheet
  const wsData = [...summaryData, headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 10 }, // Type
    { wch: 15 }, // Référence
    { wch: 40 }, // Description
    { wch: 18 }, // Montant
    { wch: 15 }, // Mode
    { wch: 12 }, // Statut
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  // Income sheet
  const incomeData = transactions.filter(t => t.transaction_type === 'income');
  if (incomeData.length > 0) {
    const incomeSheet = XLSX.utils.json_to_sheet(incomeData.map(t => ({
      Date: formatDate(t.date),
      Référence: t.reference || '-',
      Description: t.description || '-',
      Montant: Number(t.amount),
      'Mode de paiement': t.payment_method || '-',
      Statut: t.validation_status || 'draft',
    })));
    XLSX.utils.book_append_sheet(wb, incomeSheet, 'Entrées');
  }

  // Expense sheet
  const expenseData = transactions.filter(t => t.transaction_type === 'expense');
  if (expenseData.length > 0) {
    const expenseSheet = XLSX.utils.json_to_sheet(expenseData.map(t => ({
      Date: formatDate(t.date),
      Référence: t.reference || '-',
      Description: t.description || '-',
      Montant: Number(t.amount),
      Nature: t.nature || '-',
      'Mode de paiement': t.payment_method || '-',
      Statut: t.validation_status || 'draft',
    })));
    XLSX.utils.book_append_sheet(wb, expenseSheet, 'Sorties');
  }

  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportFinancialReportExcel(data: {
  title: string;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: { name: string; value: number }[];
  byDepartment: { name: string; income: number; expenses: number }[];
  transactions: any[];
}) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['AGRICAPITAL SARL'],
    ['Rapport Financier'],
    ['Période:', data.period],
    ['Généré le:', new Date().toLocaleDateString('fr-FR')],
    [],
    ['RÉSUMÉ FINANCIER'],
    ['Total Entrées', data.totalIncome],
    ['Total Sorties', data.totalExpenses],
    ['Solde Net', data.balance],
    [],
    ['RÉPARTITION PAR CATÉGORIE'],
    ['Catégorie', 'Montant', '% du Total'],
    ...data.byCategory.map(c => [c.name, c.value, `${((c.value / data.totalExpenses) * 100).toFixed(1)}%`]),
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Résumé');

  // Department analysis sheet
  if (data.byDepartment.length > 0) {
    const deptSheet = XLSX.utils.json_to_sheet(data.byDepartment.map(d => ({
      Département: d.name,
      Entrées: d.income,
      Sorties: d.expenses,
      Solde: d.income - d.expenses,
    })));
    XLSX.utils.book_append_sheet(wb, deptSheet, 'Par Département');
  }

  // Transactions detail sheet
  if (data.transactions.length > 0) {
    const txSheet = XLSX.utils.json_to_sheet(data.transactions.map(t => ({
      Date: formatDate(t.date),
      Type: t.transaction_type === 'income' ? 'Entrée' : 'Sortie',
      Référence: t.reference || '-',
      Description: t.description || '-',
      Montant: Number(t.amount),
      Nature: t.nature || '-',
      Statut: t.validation_status || 'draft',
    })));
    XLSX.utils.book_append_sheet(wb, txSheet, 'Détail Transactions');
  }

  XLSX.writeFile(wb, `Rapport_Financier_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportAssociatesExcel(associates: any[], contributions: any[]) {
  const wb = XLSX.utils.book_new();

  // Associates sheet
  const associatesSheet = XLSX.utils.json_to_sheet(associates.map(a => ({
    'Nom Complet': a.full_name,
    'Prénom': a.first_name || '-',
    'Nom': a.last_name || '-',
    'Email': a.email || '-',
    'Téléphone': a.phone || '-',
    'Date d\'entrée': formatDate(a.entry_date),
    'Total Apports': Number(a.total_contribution || 0),
    'Taux de participation (%)': Number(a.participation_rate || 0),
    'Statut': a.is_active ? 'Actif' : 'Inactif',
  })));
  XLSX.utils.book_append_sheet(wb, associatesSheet, 'Associés');

  // Contributions sheet
  if (contributions.length > 0) {
    const contribSheet = XLSX.utils.json_to_sheet(contributions.map(c => ({
      'Date': formatDate(c.contribution_date),
      'Type': c.contribution_type || '-',
      'Montant': Number(c.amount),
      'Description': c.description || '-',
    })));
    XLSX.utils.book_append_sheet(wb, contribSheet, 'Contributions');
  }

  XLSX.writeFile(wb, `Associes_${new Date().toISOString().split('T')[0]}.xlsx`);
}
