import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { usePaginatedTransactions } from '@/hooks/usePaginatedTransactions';
import { useTransactionSummary } from '@/hooks/useTransactions';
import { useDepartments } from '@/hooks/useDepartments';
import { formatCurrency, formatDate } from '@/lib/mockData';
import { exportTransactionsPDFPro } from '@/lib/pdfExportPro';
import { exportTransactionsExcel } from '@/lib/excelExport';
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Clock, Search, Download, FileText, RefreshCw } from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  submitted: { label: 'Soumis', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  raf_validated: { label: 'Validé RAF', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  dg_validated: { label: 'Validé DG', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  locked: { label: 'Verrouillé', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-700 border-red-200' },
};

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  // Construire les filtres pour le hook paginé
  const filters = useMemo(() => ({
    type: typeFilter !== 'all' ? typeFilter as 'income' | 'expense' : undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    departmentId: departmentFilter !== 'all' ? departmentFilter : undefined,
    searchTerm: searchTerm || undefined,
  }), [typeFilter, statusFilter, departmentFilter, searchTerm]);
  
  const { 
    transactions, 
    loading, 
    pagination, 
    goToPage, 
    setPageSize, 
    hasNextPage, 
    hasPreviousPage,
    refetch 
  } = usePaginatedTransactions(filters);
  
  const { summary } = useTransactionSummary();
  const { departments } = useDepartments();

  const handleExportPDF = () => {
    exportTransactionsPDFPro(transactions, 'Journal des Transactions', 'Toutes périodes');
  };

  const handleExportExcel = () => {
    exportTransactionsExcel(transactions, 'Transactions');
  };

  return (
    <MainLayout 
      title="Transactions" 
      subtitle={`Historique de toutes les opérations • ${pagination.totalCount.toLocaleString('fr-FR')} résultats`}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <ArrowDownCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Entrées</span>
            </div>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(summary.totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <ArrowUpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Sorties</span>
            </div>
            <p className="text-lg font-bold text-red-700">{formatCurrency(summary.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Approuvées</span>
            </div>
            <p className="text-lg font-bold text-emerald-700">{summary.approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">En attente</span>
            </div>
            <p className="text-lg font-bold text-amber-700">{summary.pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par description ou référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="income">Entrées</SelectItem>
                <SelectItem value="expense">Sorties</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {Object.entries(statusLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous départements</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Liste des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loading
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune transaction trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => {
                    const status = statusLabels[tx.validation_status || 'draft'];
                    return (
                      <TableRow key={tx.id} className="hover:bg-muted/30">
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.transaction_type === 'income' ? (
                              <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowUpCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="hidden sm:inline">
                              {tx.transaction_type === 'income' ? 'Entrée' : 'Sortie'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{tx.reference || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{tx.description || '-'}</TableCell>
                        <TableCell className={`text-right font-semibold ${
                          tx.transaction_type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {tx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            totalPages={pagination.totalPages}
            onPageChange={goToPage}
            onPageSizeChange={setPageSize}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            loading={loading}
          />
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Transactions;
