import { MainLayout } from '@/components/layout/MainLayout';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { RoleBasedDashboard } from '@/components/dashboard/RoleBasedDashboard';
import { useChartData } from '@/hooks/useChartData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/mockData';

const Dashboard = () => {
  const { chartData, loading: chartLoading } = useChartData();
  const { transactions } = useTransactions();

  return (
    <MainLayout title="Tableau de Bord" subtitle="Vue d'ensemble de vos finances">
      {/* Dashboard personnalisé par rôle */}
      <RoleBasedDashboard />

      {/* Graphique financier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 mb-8">
        <div className="lg:col-span-2">
          <FinancialChart data={chartData} loading={chartLoading} />
        </div>
        
        {/* Transactions récentes */}
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
      </div>
    </MainLayout>
  );
};

export default Dashboard;
