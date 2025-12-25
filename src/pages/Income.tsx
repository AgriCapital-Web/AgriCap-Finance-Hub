import { MainLayout } from '@/components/layout/MainLayout';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { mockTransactions, formatCurrency, calculateSummary } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownCircle } from 'lucide-react';

const Income = () => {
  const incomeTransactions = mockTransactions.filter(t => t.type === 'income');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <MainLayout 
      title="Entrées" 
      subtitle="Enregistrement des crédits et approvisionnements"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <TransactionForm type="income" />
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <ArrowDownCircle className="h-5 w-5" />
                Résumé des Entrées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-emerald-600">Total ce mois</p>
                  <p className="text-3xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="pt-4 border-t border-emerald-200">
                  <p className="text-sm text-emerald-600 mb-2">Dernières entrées</p>
                  {incomeTransactions.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex justify-between py-2">
                      <span className="text-sm text-emerald-700">{t.article}</span>
                      <span className="text-sm font-medium text-emerald-700">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories d'entrées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Approvisionnement', 'Levée de fonds', 'Vente', 'Subvention'].map((cat) => (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
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

export default Income;
