import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, Briefcase, Building, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import type { Stakeholder, OperationalStatus } from '@/types';
import { operationalStatusLabels } from '@/types';

const Stakeholders = () => {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    operational_status: 'employe_interne' as OperationalStatus,
    contract_type: '',
    department_id: '',
    email: '',
    phone: '',
    address: '',
    bank_account: '',
  });

  useEffect(() => {
    fetchStakeholders();
    fetchDepartments();
  }, []);

  const fetchStakeholders = async () => {
    try {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*')
        .order('name');

      if (error) throw error;
      setStakeholders(data || []);
    } catch (error) {
      console.error('Error fetching stakeholders:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les intervenants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleAddStakeholder = async () => {
    if (!formData.name) {
      toast({
        title: 'Erreur',
        description: 'Le nom est requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('stakeholders')
        .insert({
          ...formData,
          department_id: formData.department_id || null,
        });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Intervenant ajouté avec succès',
      });

      setIsDialogOpen(false);
      setFormData({
        name: '',
        operational_status: 'employe_interne',
        contract_type: '',
        department_id: '',
        email: '',
        phone: '',
        address: '',
        bank_account: '',
      });
      fetchStakeholders();
    } catch (error) {
      console.error('Error adding stakeholder:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'intervenant',
        variant: 'destructive',
      });
    }
  };

  const filteredStakeholders = stakeholders.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || s.operational_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    employe_interne: stakeholders.filter(s => s.operational_status === 'employe_interne').length,
    prestataire_interne: stakeholders.filter(s => s.operational_status === 'prestataire_interne').length,
    prestataire_externe: stakeholders.filter(s => s.operational_status === 'prestataire_externe').length,
    consultant: stakeholders.filter(s => s.operational_status === 'consultant').length,
    fournisseur: stakeholders.filter(s => s.operational_status === 'fournisseur').length,
    autre: stakeholders.filter(s => s.operational_status === 'autre').length,
  };

  return (
    <MainLayout title="Gestion des Intervenants" subtitle="Employés, prestataires, fournisseurs et consultants">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilterStatus('all')}>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stakeholders.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilterStatus('employe_interne')}>
          <CardContent className="p-4 text-center">
            <Briefcase className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{statusCounts.employe_interne}</p>
            <p className="text-xs text-muted-foreground">Employés</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilterStatus('prestataire_externe')}>
          <CardContent className="p-4 text-center">
            <Building className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{statusCounts.prestataire_externe}</p>
            <p className="text-xs text-muted-foreground">Prestataires ext.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilterStatus('consultant')}>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{statusCounts.consultant}</p>
            <p className="text-xs text-muted-foreground">Consultants</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilterStatus('fournisseur')}>
          <CardContent className="p-4 text-center">
            <Building className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{statusCounts.fournisseur}</p>
            <p className="text-xs text-muted-foreground">Fournisseurs</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilterStatus('autre')}>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-gray-500" />
            <p className="text-2xl font-bold">{statusCounts.autre}</p>
            <p className="text-xs text-muted-foreground">Autres</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un intervenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(operationalStatusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvel intervenant</DialogTitle>
                <DialogDescription>Enregistrez un nouvel intervenant dans le système</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Nom / Raison sociale *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom complet ou raison sociale"
                  />
                </div>
                <div>
                  <Label htmlFor="operational_status">Statut opérationnel *</Label>
                  <Select
                    value={formData.operational_status}
                    onValueChange={(value: OperationalStatus) => setFormData({ ...formData, operational_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(operationalStatusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="contract_type">Type de contrat</Label>
                    <Input
                      id="contract_type"
                      value={formData.contract_type}
                      onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                      placeholder="CDI, CDD, Prestation..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Département</Label>
                    <Select
                      value={formData.department_id}
                      onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemple.com"
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
                </div>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>
                <div>
                  <Label htmlFor="bank_account">Compte bancaire / RIB</Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    placeholder="Informations bancaires"
                  />
                </div>
                <Button onClick={handleAddStakeholder} className="w-full">
                  Enregistrer l'intervenant
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stakeholders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intervenant</TableHead>
                  <TableHead className="hidden md:table-cell">Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden sm:table-cell">Contrat</TableHead>
                  <TableHead className="text-center">État</TableHead>
                  {isAdmin && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStakeholders.map((stakeholder) => (
                  <TableRow key={stakeholder.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{stakeholder.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {operationalStatusLabels[stakeholder.operational_status]}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {operationalStatusLabels[stakeholder.operational_status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1 text-sm">
                        {stakeholder.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {stakeholder.phone}
                          </div>
                        )}
                        {stakeholder.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {stakeholder.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {stakeholder.contract_type || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={stakeholder.is_active ? 'default' : 'secondary'}>
                        {stakeholder.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filteredStakeholders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun intervenant trouvé
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

export default Stakeholders;
