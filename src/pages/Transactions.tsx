import { MainLayout } from '@/components/layout/MainLayout';
import { TransactionList } from '@/components/transactions/TransactionList';
import { mockTransactions, calculateSummary, formatCurrency } from '@/lib/mockData';
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Clock } from 'lucide-react';

const Transactions = () => {
  const summary = calculateSummary(mockTransactions);

  return (
    <MainLayout 
      title="Transactions" 
      subtitle="Historique de toutes les opérations"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <ArrowDownCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Entrées</span>
          </div>
          <p className="text-lg font-bold text-emerald-700">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <ArrowUpCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Sorties</span>
          </div>
          <p className="text-lg font-bold text-red-700">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Approuvées</span>
          </div>
          <p className="text-lg font-bold text-emerald-700">{summary.approvedTransactions}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">En attente</span>
          </div>
          <p className="text-lg font-bold text-amber-700">{summary.pendingTransactions}</p>
        </div>
      </div>

      <TransactionList transactions={mockTransactions} />
    </MainLayout>
  );
};

export default Transactions;
