import { ArrowDownCircle, ArrowUpCircle, Wallet, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useTransactionSummary } from '@/hooks/useTransactions';
import { formatCurrency, generateChartData, mockTransactions } from '@/lib/mockData';

const Dashboard = () => {
  const { summary, loading } = useTransactionSummary();
  const chartData = generateChartData(mockTransactions);

  return (
    <MainLayout title="Tableau de Bord" subtitle="Vue d'ensemble de vos finances">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Entrées"
          value={loading ? '...' : formatCurrency(summary.totalIncome)}
          subtitle="Ce mois"
          icon={ArrowDownCircle}
          variant="income"
        />
        <StatCard
          title="Total Sorties"
          value={loading ? '...' : formatCurrency(summary.totalExpenses)}
          subtitle="Ce mois"
          icon={ArrowUpCircle}
          variant="expense"
        />
        <StatCard
          title="Solde Disponible"
          value={loading ? '...' : formatCurrency(summary.balance)}
          subtitle="Fonds disponibles"
          icon={Wallet}
          variant="balance"
        />
        <StatCard
          title="En Attente"
          value={loading ? '...' : `${summary.pendingCount}`}
          subtitle="Transactions à valider"
          icon={Clock}
          variant="pending"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <FinancialChart data={chartData} />
        </div>
        <QuickActions />
      </div>
    </MainLayout>
  );
};

export default Dashboard;