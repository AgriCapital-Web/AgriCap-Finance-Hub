import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/mockData';
import { Plus, Users, TrendingUp, Wallet, FileText, Download, Printer, User, Calendar, Phone, Mail } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { Associate, AssociateContribution } from '@/types';

const COLORS = ['#1B7A3D', '#F5A623', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

const Associates = () => {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [contributions, setContributions] = useState<AssociateContribution[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const { toast } = useToast();
  const { user, isSuperAdmin } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    entry_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [contributionForm, setContributionForm] = useState({
    associate_id: '',
    amount: '',
    contribution_date: new Date().toISOString().split('T')[0],
    contribution_type: 'Apport en capital',
    description: '',
  });

  useEffect(() => {
    fetchAssociates();
    fetchContributions();
  }, []);

  const fetchAssociates = async () => {
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
  };

  const fetchContributions = async () => {
    try {
      const { data, error } = await supabase
        .from('associate_contributions')
        .select('*')
        .order('contribution_date', { ascending: false });

      if (error) throw error;
      setContributions(data || []);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  };

  const handleAddAssociate = async () => {
    if (!formData.full_name) {
      toast({
        title: 'Erreur',
        description: 'Le nom complet est requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('associates')
        .insert({
          ...formData,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Associé ajouté avec succès',
      });

      setIsDialogOpen(false);
      setFormData({
        full_name: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        entry_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchAssociates();
    } catch (error) {
      console.error('Error adding associate:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'associé',
        variant: 'destructive',
      });
    }
  };

  const handleAddContribution = async () => {
    if (!contributionForm.associate_id || !contributionForm.amount) {
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
          associate_id: contributionForm.associate_id,
          amount: parseFloat(contributionForm.amount),
          contribution_date: contributionForm.contribution_date,
          contribution_type: contributionForm.contribution_type,
          description: contributionForm.description,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Apport enregistré avec succès',
      });

      setIsContributionDialogOpen(false);
      setContributionForm({
        associate_id: '',
        amount: '',
        contribution_date: new Date().toISOString().split('T')[0],
        contribution_type: 'Apport en capital',
        description: '',
      });
      fetchAssociates();
      fetchContributions();
    } catch (error) {
      console.error('Error adding contribution:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer l\'apport',
        variant: 'destructive',
      });
    }
  };

  const totalContributions = associates.reduce((sum, a) => sum + (a.total_contribution || 0), 0);

  const pieChartData = associates.map((associate, index) => ({
    name: associate.full_name,
    value: associate.total_contribution || 0,
    color: COLORS[index % COLORS.length],
  }));

  const barChartData = associates.map(associate => ({
    name: associate.full_name.split(' ').slice(-1)[0],
    apport: associate.total_contribution || 0,
  }));

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
                <p className="text-2xl font-bold">{formatCurrency(totalContributions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contributions</p>
                <p className="text-2xl font-bold">{contributions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-purple-500" />
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel Associé
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter un associé</DialogTitle>
                  <DialogDescription>Enregistrez un nouvel associé dans le système</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="full_name">Nom complet *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="KOFFI Inocent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="first_name">Prénom</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Inocent"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Nom</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="KOFFI"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="associe@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+225 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry_date">Date d'entrée</Label>
                    <Input
                      id="entry_date"
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informations complémentaires..."
                    />
                  </div>
                  <Button onClick={handleAddAssociate} className="w-full">
                    Ajouter l'associé
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isContributionDialogOpen} onOpenChange={setIsContributionDialogOpen}>
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
                      value={contributionForm.associate_id}
                      onChange={(e) => setContributionForm({ ...contributionForm, associate_id: e.target.value })}
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
                      value={contributionForm.amount}
                      onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
                      placeholder="1000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contribution_date">Date de l'apport</Label>
                    <Input
                      id="contribution_date"
                      type="date"
                      value={contributionForm.contribution_date}
                      onChange={(e) => setContributionForm({ ...contributionForm, contribution_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contribution_type">Type d'apport</Label>
                    <select
                      id="contribution_type"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      value={contributionForm.contribution_type}
                      onChange={(e) => setContributionForm({ ...contributionForm, contribution_type: e.target.value })}
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
                      value={contributionForm.description}
                      onChange={(e) => setContributionForm({ ...contributionForm, description: e.target.value })}
                      placeholder="Description de l'apport..."
                    />
                  </div>
                  <Button onClick={handleAddContribution} className="w-full">
                    Enregistrer l'apport
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
        <Button variant="outline">
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
            <CardDescription>Comparaison des contributions</CardDescription>
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
          <CardTitle className="text-lg">Liste des associés</CardTitle>
          <CardDescription>Détails et taux de participation</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {associates.map((associate) => (
                  <TableRow key={associate.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
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
                  </TableRow>
                ))}
                {associates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun associé enregistré
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Associates;
