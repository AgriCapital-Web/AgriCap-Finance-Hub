import { MainLayout } from '@/components/layout/MainLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { mockTransactions, formatCurrency } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle } from 'lucide-react';

const Expenses = () => {
  const expenseTransactions = mockTransactions.filter(t => t.type === 'expense');
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <MainLayout 
      title="Sorties" 
      subtitle="Enregistrement des dépenses et décaissements"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <TransactionForm type="expense" />
        </div>

        {/* Summary */}
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
                  <p className="text-sm text-red-600">Total ce mois</p>
                  <p className="text-3xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="pt-4 border-t border-red-200">
                  <p className="text-sm text-red-600 mb-2">Dernières sorties</p>
                  {expenseTransactions.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex justify-between py-2">
                      <span className="text-sm text-red-700 truncate">{t.article}</span>
                      <span className="text-sm font-medium text-red-700">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
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
