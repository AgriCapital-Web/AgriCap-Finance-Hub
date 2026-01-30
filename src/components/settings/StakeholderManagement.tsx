import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Briefcase, Edit, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { REGIONS_CI } from '@/lib/regions-ci';
import { operationalStatusLabels } from '@/types';
import type { OperationalStatus } from '@/types';

interface Stakeholder {
  id: string;
  name: string;
  operational_status: OperationalStatus;
  contract_type: string | null;
  email: string | null;
  phone: string | null;
  region: string | null;
  is_active: boolean | null;
}

export function StakeholderManagement() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    operational_status: 'employe_interne' as OperationalStatus,
    contract_type: '',
    email: '',
    phone: '',
    region: '',
  });

  const fetchStakeholders = async () => {
    try {
      const { data, error } = await supabase.from('stakeholders').select('*').order('name');
      if (error) throw error;
      setStakeholders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStakeholders();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', operational_status: 'employe_interne', contract_type: '', email: '', phone: '', region: '' });
    setEditingStakeholder(null);
  };

  const handleOpenDialog = (stakeholder?: Stakeholder) => {
    if (stakeholder) {
      setEditingStakeholder(stakeholder);
      setFormData({
        name: stakeholder.name,
        operational_status: stakeholder.operational_status,
        contract_type: stakeholder.contract_type || '',
        email: stakeholder.email || '',
        phone: stakeholder.phone || '',
        region: stakeholder.region || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: 'Erreur', description: 'Le nom est requis', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        operational_status: formData.operational_status,
        contract_type: formData.contract_type || null,
        email: formData.email || null,
        phone: formData.phone || null,
        region: formData.region || null,
      };

      if (editingStakeholder) {
        const { error } = await supabase.from('stakeholders').update(payload).eq('id', editingStakeholder.id);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Intervenant modifié' });
      } else {
        const { error } = await supabase.from('stakeholders').insert(payload);
        if (error) throw error;
        toast({ title: 'Succès', description: 'Intervenant ajouté' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchStakeholders();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredStakeholders = stakeholders.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Gestion des Intervenants
          </CardTitle>
          <CardDescription>Employés, prestataires, fournisseurs</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStakeholders.slice(0, 10).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{operationalStatusLabels[s.operational_status]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email || s.phone || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(s)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingStakeholder ? 'Modifier' : 'Nouvel'} intervenant</DialogTitle>
              <DialogDescription>Enregistrez les informations de l'intervenant</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom complet *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nom et prénoms" />
              </div>
              <div>
                <Label>Statut opérationnel</Label>
                <Select value={formData.operational_status} onValueChange={(val: OperationalStatus) => setFormData({ ...formData, operational_status: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(operationalStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Région</Label>
                <Select value={formData.region} onValueChange={(val) => setFormData({ ...formData, region: val })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {REGIONS_CI.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingStakeholder ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
