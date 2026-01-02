import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Users, Briefcase, Building, Search, Edit, Phone, Mail, MapPin, UserCheck } from 'lucide-react';
import type { Stakeholder, OperationalStatus } from '@/types';
import { operationalStatusLabels } from '@/types';
import { REGIONS_CI } from '@/lib/regions-ci';

const Stakeholders = () => {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    operational_status: 'employe_interne' as OperationalStatus,
    contract_type: '',
    department_id: '',
    project_id: '',
    email: '',
    phone: '',
    address: '',
    region: '',
    bank_account: '',
  });

  useEffect(() => {
    fetchStakeholders();
    fetchDepartments();
    fetchProjects();
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
    const { data } = await supabase.from('departments').select('id, name').order('name');
    setDepartments(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name').order('name');
    setProjects(data || []);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      operational_status: 'employe_interne',
      contract_type: '',
      department_id: '',
      project_id: '',
      email: '',
      phone: '',
      address: '',
      region: '',
      bank_account: '',
    });
    setEditingStakeholder(null);
  };

  const handleOpenDialog = (stakeholder?: Stakeholder) => {
    if (stakeholder) {
      setEditingStakeholder(stakeholder);
      setFormData({
        name: stakeholder.name,
        operational_status: stakeholder.operational_status,
        contract_type: stakeholder.contract_type || '',
        department_id: stakeholder.department_id || '',
        project_id: '',
        email: stakeholder.email || '',
        phone: stakeholder.phone || '',
        address: stakeholder.address || '',
        region: (stakeholder as any).region || '',
        bank_account: stakeholder.bank_account || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSaveStakeholder = async () => {
    if (!formData.name) {
      toast({ title: 'Erreur', description: 'Le nom est requis', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        name: formData.name,
        operational_status: formData.operational_status,
        contract_type: formData.contract_type || null,
        department_id: formData.department_id || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        region: formData.region || null,
        bank_account: formData.bank_account || null,
      };

      if (editingStakeholder) {
        const { error } = await supabase
          .from('stakeholders')
          .update(payload)
          .eq('id', editingStakeholder.id);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Intervenant modifié avec succès' });
      } else {
        const { error } = await supabase.from('stakeholders').insert(payload);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Intervenant ajouté avec succès' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchStakeholders();
    } catch (error: any) {
      console.error('Error saving stakeholder:', error);
      toast({ title: 'Erreur', description: error.message || 'Impossible de sauvegarder', variant: 'destructive' });
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
      {/* Summary Cards - including Prestataire interne */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
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
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFilterStatus('prestataire_interne')}>
          <CardContent className="p-4 text-center">
            <UserCheck className="h-6 w-6 mx-auto mb-2 text-teal-500" />
            <p className="text-2xl font-bold">{statusCounts.prestataire_interne}</p>
            <p className="text-xs text-muted-foreground">Prestataires int.</p>
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStakeholder ? 'Modifier l\'intervenant' : 'Nouvel intervenant'}</DialogTitle>
                <DialogDescription>
                  {editingStakeholder ? 'Modifiez les informations de l\'intervenant' : 'Enregistrez un nouvel intervenant dans le système'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nom et Prénoms *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom complet ou raison sociale"
                  />
                </div>
                <div>
                  <Label>Statut opérationnel *</Label>
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
                    <Label>Type de contrat</Label>
                    <Select
                      value={formData.contract_type}
                      onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CDI">CDI</SelectItem>
                        <SelectItem value="CDD">CDD</SelectItem>
                        <SelectItem value="Prestation">Prestation</SelectItem>
                        <SelectItem value="Stage">Stage</SelectItem>
                        <SelectItem value="Consultant">Consultant</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Département</Label>
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
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+225 XX XX XX XX"
                    />
                  </div>
                </div>
                <div>
                  <Label>Lieu de résidence (Région)</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS_CI.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Adresse complète</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>
                <div>
                  <Label>Compte bancaire / RIB</Label>
                  <Input
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    placeholder="Informations bancaires"
                  />
                </div>
                <Button onClick={handleSaveStakeholder} className="w-full">
                  {editingStakeholder ? 'Enregistrer les modifications' : 'Ajouter l\'intervenant'}
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
                  <TableHead className="hidden sm:table-cell">Région</TableHead>
                  <TableHead className="text-center">État</TableHead>
                  {isAdmin && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredStakeholders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun intervenant trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStakeholders.map((stakeholder) => (
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
                        {(stakeholder as any).region ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {(stakeholder as any).region}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={stakeholder.is_active ? 'default' : 'secondary'}>
                          {stakeholder.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(stakeholder)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
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
