import { useState, useEffect, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/mockData';
import { exportAssociatesExcel, exportAssociatesPDF, exportAssociateDetailPDF } from '@/lib/associateExports';
import { Plus, Users, TrendingUp, Wallet, FileText, Download, Printer, Calendar, Phone, Mail, Pencil, History, FileSpreadsheet, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AssociateForm } from '@/components/associates/AssociateForm';
import { AssociateContributionHistory } from '@/components/associates/AssociateContributionHistory';

interface AssociateData {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  entry_date: string;
  total_contribution: number | null;
  participation_rate: number | null;
  notes?: string | null;
  is_active: boolean | null;
  photo_url?: string | null;
  contact_person_name?: string | null;
  contact_person_phone?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ApportData {
  id: string;
  associate_id: string;
  amount: number;
  contribution_date: string;
  contribution_type?: string | null;
  description?: string | null;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(217 91% 60%)', 'hsl(262 83% 58%)', 'hsl(330 81% 60%)', 'hsl(172 66% 50%)', 'hsl(24 95% 53%)', 'hsl(239 84% 67%)'];

const Associates = () => {
  const [associates, setAssociates] = useState<AssociateData[]>([]);
  const [apports, setApports] = useState<ApportData[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isApportDialogOpen, setIsApportDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAssociate, setSelectedAssociate] = useState<AssociateData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user, isSuperAdmin } = useAuth();

  const [apportForm, setApportForm] = useState({
    associate_id: '',
    amount: '',
    contribution_date: new Date().toISOString().split('T')[0],
    contribution_type: 'Apport en capital',
    description: '',
  });

  const fetchAssociates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('associates')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setAssociates(data || []);
    } catch (error) {
      console.error('Error fetching associates:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les associés',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchApports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('associate_contributions')
        .select('*')
        .order('contribution_date', { ascending: false });

      if (error) throw error;
      setApports(data || []);
    } catch (error) {
      console.error('Error fetching apports:', error);
    }
  }, []);

  useEffect(() => {
    fetchAssociates();
    fetchApports();
  }, [fetchAssociates, fetchApports]);

  const handleAddApport = async () => {
    if (!apportForm.associate_id || !apportForm.amount) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('associate_contributions')
        .insert({
          associate_id: apportForm.associate_id,
          amount: parseFloat(apportForm.amount),
          contribution_date: apportForm.contribution_date,
          contribution_type: apportForm.contribution_type,
          description: apportForm.description,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Apport enregistré avec succès',
      });

      setIsApportDialogOpen(false);
      setApportForm({
        associate_id: '',
        amount: '',
        contribution_date: new Date().toISOString().split('T')[0],
        contribution_type: 'Apport en capital',
        description: '',
      });
      fetchAssociates();
      fetchApports();
    } catch (error) {
      console.error('Error adding apport:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer l\'apport',
        variant: 'destructive',
      });
    }
  };

  const handleOpenNewAssociate = () => {
    setSelectedAssociate(null);
    setIsFormOpen(true);
  };

  const handleEditAssociate = (associate: AssociateData) => {
    setSelectedAssociate({
      ...associate,
      first_name: associate.first_name || '',
      last_name: associate.last_name || '',
      email: associate.email || '',
      phone: associate.phone || '',
      address: associate.address || '',
      notes: associate.notes || '',
      photo_url: associate.photo_url || '',
      contact_person_name: associate.contact_person_name || '',
      contact_person_phone: associate.contact_person_phone || '',
    });
    setIsFormOpen(true);
  };

  const handleViewHistory = (associate: AssociateData) => {
    setSelectedAssociate(associate);
    setIsHistoryOpen(true);
  };

  const handleFormSuccess = () => {
    fetchAssociates();
  };

  const handleExportExcel = () => {
    exportAssociatesExcel(associates, apports);
    toast({
      title: 'Export réussi',
      description: 'Le fichier Excel a été téléchargé',
    });
  };

  const handleExportPDF = () => {
    exportAssociatesPDF(associates, apports);
    toast({
      title: 'Export réussi',
      description: 'Le fichier PDF a été téléchargé',
    });
  };

  const totalApports = associates.reduce((sum, a) => sum + (a.total_contribution || 0), 0);

  const filteredAssociates = useMemo(() => {
    if (!searchTerm) return associates;
    const term = searchTerm.toLowerCase();
    return associates.filter(a => 
      a.full_name.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.phone?.includes(term)
    );
  }, [associates, searchTerm]);

  const pieChartData = associates.map((associate, index) => ({
    name: associate.full_name,
    value: associate.total_contribution || 0,
    color: COLORS[index % COLORS.length],
  }));

  const barChartData = associates.map(associate => ({
    name: associate.full_name.split(' ').slice(-1)[0],
    apport: associate.total_contribution || 0,
  }));

  const getInitials = (associate: AssociateData) => {
    const first = associate.first_name?.charAt(0) || associate.full_name?.charAt(0) || '';
    const last = associate.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'AS';
  };

  return (
    <MainLayout title="Gestion des Associés" subtitle="Suivi des apports et participations des associés">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre d'associés</p>
                <p className="text-2xl font-bold">{associates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total apports</p>
                <p className="text-2xl font-bold">{formatCurrency(totalApports)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[hsl(217_91%_60%)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[hsl(217_91%_60%)]/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-[hsl(217_91%_60%)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre d'apports</p>
                <p className="text-2xl font-bold">{apports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[hsl(262_83%_58%)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[hsl(262_83%_58%)]/10 rounded-lg">
                <FileText className="h-5 w-5 text-[hsl(262_83%_58%)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Associés actifs</p>
                <p className="text-2xl font-bold">{associates.filter(a => a.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {isSuperAdmin && (
          <>
            <Button onClick={handleOpenNewAssociate}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Associé
            </Button>

            <Dialog open={isApportDialogOpen} onOpenChange={setIsApportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Wallet className="h-4 w-4 mr-2" />
                  Enregistrer un apport
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer un apport</DialogTitle>
                  <DialogDescription>Enregistrez un nouvel apport d'un associé</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="associate">Associé *</Label>
                    <select
                      id="associate"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      value={apportForm.associate_id}
                      onChange={(e) => setApportForm({ ...apportForm, associate_id: e.target.value })}
                    >
                      <option value="">Sélectionner un associé</option>
                      {associates.map((associate) => (
                        <option key={associate.id} value={associate.id}>
                          {associate.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Montant (FCFA) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={apportForm.amount}
                      onChange={(e) => setApportForm({ ...apportForm, amount: e.target.value })}
                      placeholder="1000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contribution_date">Date de l'apport</Label>
                    <Input
                      id="contribution_date"
                      type="date"
                      value={apportForm.contribution_date}
                      onChange={(e) => setApportForm({ ...apportForm, contribution_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contribution_type">Type d'apport</Label>
                    <select
                      id="contribution_type"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      value={apportForm.contribution_type}
                      onChange={(e) => setApportForm({ ...apportForm, contribution_type: e.target.value })}
                    >
                      <option value="Apport en capital">Apport en capital</option>
                      <option value="Apport en nature">Apport en nature</option>
                      <option value="Levée de fonds">Levée de fonds</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={apportForm.description}
                      onChange={(e) => setApportForm({ ...apportForm, description: e.target.value })}
                      placeholder="Description de l'apport..."
                    />
                  </div>
                  <Button onClick={handleAddApport} className="w-full">
                    Enregistrer l'apport
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
        <Button variant="outline" onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
        <Button variant="outline" onClick={handleExportPDF}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer PDF
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition des apports</CardTitle>
            <CardDescription>Part de chaque associé dans le capital</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' ').slice(-1)[0]} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Apports par associé</CardTitle>
            <CardDescription>Comparaison des apports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="apport" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Associates Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg">Liste des associés</CardTitle>
              <CardDescription>Détails et taux de participation</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un associé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associé</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden sm:table-cell">Date d'entrée</TableHead>
                  <TableHead className="text-right">Apport total</TableHead>
                  <TableHead className="text-right">Participation</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssociates.map((associate) => (
                  <TableRow key={associate.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={associate.photo_url || undefined} alt={associate.full_name} loading="lazy" />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(associate)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{associate.full_name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{associate.phone || associate.email || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        {associate.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {associate.phone}
                          </div>
                        )}
                        {associate.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {associate.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(associate.entry_date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(associate.total_contribution || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono">
                        {(associate.participation_rate || 0).toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={associate.is_active ? 'default' : 'secondary'}>
                        {associate.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewHistory(associate)}
                          title="Voir l'historique des apports"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAssociate(associate)}
                            title="Modifier l'associé"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAssociates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Aucun associé trouvé' : 'Aucun associé enregistré'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Associate Form Dialog */}
      <AssociateForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        associate={selectedAssociate ? {
          id: selectedAssociate.id,
          full_name: selectedAssociate.full_name,
          first_name: selectedAssociate.first_name || '',
          last_name: selectedAssociate.last_name || '',
          email: selectedAssociate.email || '',
          phone: selectedAssociate.phone || '',
          address: selectedAssociate.address || '',
          entry_date: selectedAssociate.entry_date,
          notes: selectedAssociate.notes || '',
          photo_url: selectedAssociate.photo_url || '',
          contact_person_name: selectedAssociate.contact_person_name || '',
          contact_person_phone: selectedAssociate.contact_person_phone || '',
        } : null}
        onSuccess={handleFormSuccess}
        userId={user?.id}
      />

      {/* Contribution History Dialog */}
      {selectedAssociate && (
        <AssociateContributionHistory
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          associate={{
            id: selectedAssociate.id,
            full_name: selectedAssociate.full_name,
            total_contribution: selectedAssociate.total_contribution,
            participation_rate: selectedAssociate.participation_rate,
          }}
          contributions={apports}
        />
      )}
    </MainLayout>
  );
};

export default Associates;
