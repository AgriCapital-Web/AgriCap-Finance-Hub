import { useState } from 'react';
import { Search, Filter, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, Eye, Trash2 } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TransactionListProps {
  transactions: Transaction[];
}

const statusConfig = {
  pending: { label: 'En attente', icon: Clock, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approuvé', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejeté', icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200' },
};

export const TransactionList = ({ transactions }: TransactionListProps) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.article.toLowerCase().includes(search.toLowerCase()) ||
      t.user.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Card className="animate-fadeIn">
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <CardTitle className="text-lg font-semibold">Liste des Transactions</CardTitle>
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full sm:w-48"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout</SelectItem>
                <SelectItem value="income">Entrées</SelectItem>
                <SelectItem value="expense">Sorties</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const status = statusConfig[transaction.status];
                const StatusIcon = status.icon;

                return (
                  <TableRow key={transaction.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        transaction.type === 'income'
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-600"
                      )}>
                        {transaction.type === 'income'
                          ? <ArrowDownCircle className="h-4 w-4" />
                          : <ArrowUpCircle className="h-4 w-4" />
                        }
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.article}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-48">{transaction.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.service}</TableCell>
                    <TableCell>{transaction.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("gap-1", status.className)}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{status.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      transaction.type === 'income' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune transaction trouvée</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
