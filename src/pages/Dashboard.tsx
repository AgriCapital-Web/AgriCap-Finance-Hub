import { ArrowDownCircle, ArrowUpCircle, Wallet, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { mockTransactions, calculateSummary, generateChartData, formatCurrency } from '@/lib/mockData';

const Dashboard = () => {
  const summary = calculateSummary(mockTransactions);
  const chartData = generateChartData(mockTransactions);

  return (
    <MainLayout 
      title="Tableau de Bord" 
      subtitle="Vue d'ensemble de vos finances"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Entrées"
          value={formatCurrency(summary.totalIncome)}
          subtitle="Ce mois"
          icon={ArrowDownCircle}
          variant="income"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Total Sorties"
          value={formatCurrency(summary.totalExpenses)}
          subtitle="Ce mois"
          icon={ArrowUpCircle}
          variant="expense"
          trend={{ value: 8.2, isPositive: false }}
        />
        <StatCard
          title="Solde Disponible"
          value={formatCurrency(summary.balance)}
          subtitle="Fonds disponibles"
          icon={Wallet}
          variant="balance"
        />
        <StatCard
          title="En Attente"
          value={`${summary.pendingTransactions}`}
          subtitle="Transactions à valider"
          icon={Clock}
          variant="pending"
        />
      </div>

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <FinancialChart data={chartData} />
        </div>
        <QuickActions />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={mockTransactions} />
    </MainLayout>
  );
};

export default Dashboard;
