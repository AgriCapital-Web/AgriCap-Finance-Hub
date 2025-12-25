import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const statusConfig = {
  pending: { label: 'En attente', icon: Clock, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approuvé', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejeté', icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200' },
};

export const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
  return (
    <Card className="animate-fadeIn">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Transactions Récentes</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/transactions">Voir tout</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 6).map((transaction, index) => {
            const status = statusConfig[transaction.status];
            const StatusIcon = status.icon;

            return (
              <div 
                key={transaction.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Type Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  transaction.type === 'income' 
                    ? "bg-emerald-100 text-emerald-600" 
                    : "bg-red-100 text-red-600"
                )}>
                  {transaction.type === 'income' 
                    ? <ArrowDownCircle className="h-5 w-5" />
                    : <ArrowUpCircle className="h-5 w-5" />
                  }
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.service} • {formatDate(transaction.date)}
                  </p>
                </div>

                {/* Status Badge */}
                <Badge variant="outline" className={cn("hidden sm:flex gap-1", status.className)}>
                  <StatusIcon className="h-3 w-3" />
                  <span>{status.label}</span>
                </Badge>

                {/* Amount */}
                <p className={cn(
                  "font-semibold whitespace-nowrap",
                  transaction.type === 'income' ? "text-emerald-600" : "text-red-600"
                )}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
