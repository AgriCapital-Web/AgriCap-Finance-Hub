import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/mockData';
import { Search, TrendingUp, Calendar, Wallet, ChevronDown, ChevronUp, History } from 'lucide-react';

interface Contribution {
  id: string;
  associate_id: string;
  amount: number;
  contribution_date: string;
  contribution_type?: string | null;
  description?: string | null;
}

interface Associate {
  id: string;
  full_name: string;
  total_contribution: number | null;
  participation_rate: number | null;
}

interface AssociateContributionHistoryProps {
  associate: Associate;
  contributions: Contribution[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssociateContributionHistory = ({
  associate,
  contributions,
  open,
  onOpenChange,
}: AssociateContributionHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const associateContributions = useMemo(() => {
    return contributions
      .filter(c => c.associate_id === associate.id)
      .filter(c => 
        c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contribution_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDate(c.contribution_date).includes(searchTerm)
      )
      .sort((a, b) => {
        const dateA = new Date(a.contribution_date).getTime();
        const dateB = new Date(b.contribution_date).getTime();
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [contributions, associate.id, searchTerm, sortDirection]);

  // Données pour le graphique d'évolution cumulative
  const evolutionData = useMemo(() => {
    const sorted = [...contributions]
      .filter(c => c.associate_id === associate.id)
      .sort((a, b) => new Date(a.contribution_date).getTime() - new Date(b.contribution_date).getTime());
    
    let cumulative = 0;
    return sorted.map(c => {
      cumulative += c.amount;
      return {
        date: formatDate(c.contribution_date),
        montant: c.amount,
        cumul: cumulative,
      };
    });
  }, [contributions, associate.id]);

  // Données par mois
  const monthlyData = useMemo(() => {
    const monthly: Record<string, number> = {};
    contributions
      .filter(c => c.associate_id === associate.id)
      .forEach(c => {
        const date = new Date(c.contribution_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + c.amount;
      });
    
    return Object.entries(monthly)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => {
        const [year, month] = key.split('-');
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        return {
          mois: `${monthNames[parseInt(month) - 1]} ${year}`,
          montant: value,
        };
      });
  }, [contributions, associate.id]);

  // Données par type d'apport
  const typeData = useMemo(() => {
    const byType: Record<string, number> = {};
    contributions
      .filter(c => c.associate_id === associate.id)
      .forEach(c => {
        const type = c.contribution_type || 'Non spécifié';
        byType[type] = (byType[type] || 0) + c.amount;
      });
    
    return Object.entries(byType).map(([type, montant]) => ({
      type,
      montant,
    }));
  }, [contributions, associate.id]);

  const toggleSort = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const getTypeBadgeVariant = (type: string | null | undefined) => {
    switch (type) {
      case 'capital':
      case 'Apport en capital':
        return 'default';
      case 'nature':
      case 'Apport en nature':
        return 'secondary';
      case 'Levée de fonds':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const totalApports = associateContributions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historique des apports - {associate.full_name}
          </DialogTitle>
          <DialogDescription>
            Suivi détaillé des apports et évolution de la participation
          </DialogDescription>
        </DialogHeader>

        {/* Cards résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total apports</p>
                  <p className="text-xl font-bold">{formatCurrency(totalApports)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taux participation</p>
                  <p className="text-xl font-bold">{(associate.participation_rate || 0).toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[hsl(217_91%_60%)]/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-[hsl(217_91%_60%)]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nombre d'apports</p>
                  <p className="text-xl font-bold">{associateContributions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Évolution cumulative */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Évolution cumulative</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="cumul" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Apports mensuels */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Apports par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="montant" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des apports */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle className="text-sm">Détail des apports</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={toggleSort} className="flex items-center gap-1 p-0 h-auto font-medium">
                        Date
                        {sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="hidden sm:table-cell">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {associateContributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell className="font-medium">
                        {formatDate(contribution.contribution_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(contribution.contribution_type)}>
                          {contribution.contribution_type || 'Apport'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(contribution.amount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {contribution.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {associateContributions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Aucun apport enregistré
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
