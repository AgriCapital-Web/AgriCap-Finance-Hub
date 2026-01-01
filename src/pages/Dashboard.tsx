import { ArrowDownCircle, ArrowUpCircle, Wallet, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useTransactionSummary, useTransactions } from '@/hooks/useTransactions';
import { useChartData } from '@/hooks/useChartData';
import { formatCurrency } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type DbTransaction = Database['public']['Tables']['transactions']['Row'];

const Dashboard = () => {
  const { summary, loading } = useTransactionSummary();
  const { chartData, loading: chartLoading } = useChartData();
  const { transactions } = useTransactions();

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
          <FinancialChart data={chartData} loading={chartLoading} />
        </div>
        <QuickActions />
      </div>

      {/* Recent Transactions inline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transactions Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucune transaction récente</div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.transaction_type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.transaction_type === 'income' ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description || (tx.transaction_type === 'income' ? 'Entrée' : 'Sortie')}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.transaction_type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Dashboard;
