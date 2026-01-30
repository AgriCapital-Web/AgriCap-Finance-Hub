import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { usePaginatedTransactions } from '@/hooks/usePaginatedTransactions';
import { useTransactionSummary } from '@/hooks/useTransactions';
import { useDepartments } from '@/hooks/useDepartments';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/lib/mockData';
import { exportTransactionsPDFPro } from '@/lib/pdfExportPro';
import { exportTransactionsExcel } from '@/lib/excelExport';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowDownCircle, ArrowUpCircle, CheckCircle2, Clock, Search, Download, FileText, RefreshCw,
  MoreHorizontal, Send, CheckCircle, XCircle, Lock, MessageSquare, Loader2
} from 'lucide-react';

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
  const [actionDialog, setActionDialog] = useState<{ open: boolean; txId: string; action: string; currentStatus: string }>({ open: false, txId: '', action: '', currentStatus: '' });
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const { user, role, isSuperAdmin, isAdmin } = useAuth();
  const { toast } = useToast();
  
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

  const getNextStatus = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'draft': return 'submitted';
      case 'submitted': return 'raf_validated';
      case 'raf_validated': return 'dg_validated';
      case 'dg_validated': return 'locked';
      default: return currentStatus;
    }
  };

  const canPerformAction = (txStatus: string, action: string): boolean => {
    if (action === 'submit') return txStatus === 'draft';
    if (action === 'validate_raf') return (role === 'raf' || isSuperAdmin || isAdmin) && txStatus === 'submitted';
    if (action === 'validate_dg') return isSuperAdmin && txStatus === 'raf_validated';
    if (action === 'lock') return (isSuperAdmin || isAdmin) && txStatus === 'dg_validated';
    if (action === 'reject') return (role === 'raf' || isSuperAdmin || isAdmin) && ['submitted', 'raf_validated'].includes(txStatus);
    return false;
  };

  const handleAction = async () => {
    if (!user) return;
    setActionLoading(true);
    
    try {
      const newStatus = actionDialog.action === 'reject' ? 'rejected' : getNextStatus(actionDialog.currentStatus);
      
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ validation_status: newStatus as any })
        .eq('id', actionDialog.txId);

      if (updateError) throw updateError;

      const { error: validationError } = await supabase
        .from('validations')
        .insert({
          transaction_id: actionDialog.txId,
          from_status: actionDialog.currentStatus as any,
          to_status: newStatus as any,
          validated_by: user.id,
          comment: comment || null,
        });

      if (validationError) throw validationError;

      toast({
        title: actionDialog.action === 'reject' ? 'Transaction rejetée' : 'Statut mis à jour',
        description: `Nouveau statut: ${statusLabels[newStatus]?.label || newStatus}`,
      });

      setActionDialog({ open: false, txId: '', action: '', currentStatus: '' });
      setComment('');
      refetch();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (txId: string, action: string, currentStatus: string) => {
    setActionDialog({ open: true, txId, action, currentStatus });
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'submit': return 'Soumettre';
      case 'validate_raf': return 'Valider (RAF)';
      case 'validate_dg': return 'Valider (DG)';
      case 'lock': return 'Verrouiller';
      case 'reject': return 'Rejeter';
      default: return action;
    }
  };

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
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune transaction trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => {
                    const status = statusLabels[tx.validation_status || 'draft'];
                    const txStatus = tx.validation_status || 'draft';
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
                        <TableCell className="text-center">
                          {txStatus !== 'locked' && txStatus !== 'rejected' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canPerformAction(txStatus, 'submit') && (
                                  <DropdownMenuItem onClick={() => openActionDialog(tx.id, 'submit', txStatus)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Soumettre
                                  </DropdownMenuItem>
                                )}
                                {canPerformAction(txStatus, 'validate_raf') && (
                                  <DropdownMenuItem onClick={() => openActionDialog(tx.id, 'validate_raf', txStatus)}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-amber-600" />
                                    Valider (RAF)
                                  </DropdownMenuItem>
                                )}
                                {canPerformAction(txStatus, 'validate_dg') && (
                                  <DropdownMenuItem onClick={() => openActionDialog(tx.id, 'validate_dg', txStatus)}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                                    Valider (DG)
                                  </DropdownMenuItem>
                                )}
                                {canPerformAction(txStatus, 'lock') && (
                                  <DropdownMenuItem onClick={() => openActionDialog(tx.id, 'lock', txStatus)}>
                                    <Lock className="h-4 w-4 mr-2 text-purple-600" />
                                    Verrouiller
                                  </DropdownMenuItem>
                                )}
                                {canPerformAction(txStatus, 'reject') && (
                                  <DropdownMenuItem 
                                    onClick={() => openActionDialog(tx.id, 'reject', txStatus)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rejeter
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {txStatus === 'locked' && (
                            <Lock className="h-4 w-4 mx-auto text-purple-600" />
                          )}
                          {txStatus === 'rejected' && (
                            <XCircle className="h-4 w-4 mx-auto text-red-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
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

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => { if (!open) setActionDialog({ open: false, txId: '', action: '', currentStatus: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'reject' ? 'Rejeter la transaction' : `Confirmer: ${getActionLabel(actionDialog.action)}`}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'reject' 
                ? 'Êtes-vous sûr de vouloir rejeter cette transaction ?'
                : `Vous allez passer cette transaction au statut "${statusLabels[getNextStatus(actionDialog.currentStatus)]?.label}"`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="comment">
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Commentaire (optionnel)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, txId: '', action: '', currentStatus: '' })} disabled={actionLoading}>
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              variant={actionDialog.action === 'reject' ? 'destructive' : 'default'}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Transactions;
