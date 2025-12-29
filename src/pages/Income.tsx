import { MainLayout } from '@/components/layout/MainLayout';
import { IncomeForm } from '@/components/transactions/IncomeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/mockData';

const Income = () => {
  const { transactions, refetch } = useTransactions({ type: 'income' });
  const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <MainLayout 
      title="Entrées" 
      subtitle="Enregistrement des crédits et apports des associés"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeForm onSuccess={refetch} />
        </div>

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
                  <p className="text-sm text-emerald-600">Total</p>
                  <p className="text-3xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="pt-4 border-t border-emerald-200">
                  <p className="text-sm text-emerald-600 mb-2">Dernières entrées</p>
                  {transactions.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex justify-between py-2">
                      <span className="text-sm text-emerald-700 truncate">{t.nature || t.description}</span>
                      <span className="text-sm font-medium text-emerald-700">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories d'entrées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Apport Associés', 'Levée de fonds', 'Vente', 'Subvention'].map((cat) => (
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
