import { MainLayout } from '@/components/layout/MainLayout';
import { ExpenseForm } from '@/components/transactions/ExpenseForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/mockData';

const Expenses = () => {
  const { transactions, refetch } = useTransactions({ type: 'expense' });
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <MainLayout 
      title="Sorties" 
      subtitle="Enregistrement des dépenses et décaissements"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpenseForm onSuccess={refetch} />
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ArrowUpCircle className="h-5 w-5" />
                Résumé des Sorties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-red-600">Total</p>
                  <p className="text-3xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="pt-4 border-t border-red-200">
                  <p className="text-sm text-red-600 mb-2">Dernières sorties</p>
                  {transactions.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex justify-between py-2">
                      <span className="text-sm text-red-700 truncate">{t.description || t.nature}</span>
                      <span className="text-sm font-medium text-red-700">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories de sorties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Carburation', 'Achats de Matériel', 'Salaires', 'Négoce', 'Fournitures'].map((cat) => (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-foreground">{cat}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Expenses;
