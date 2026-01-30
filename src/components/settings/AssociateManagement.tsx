import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, Edit, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/mockData';
import { AssociateForm } from '@/components/associates/AssociateForm';

interface Associate {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  total_contribution: number | null;
  participation_rate: number | null;
  is_active: boolean | null;
  entry_date: string;
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  contact_person_name?: string | null;
  contact_person_phone?: string | null;
}

export function AssociateManagement() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAssociates = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('associates').select('*').order('full_name');
      if (error) throw error;
      setAssociates(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssociates();
  }, [fetchAssociates]);

  const handleOpenNew = () => {
    setSelectedAssociate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (associate: Associate) => {
    setSelectedAssociate(associate);
    setIsFormOpen(true);
  };

  const filteredAssociates = associates.filter(a =>
    a.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestion des Associés
          </CardTitle>
          <CardDescription>Fondateurs et associés de la société</CardDescription>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel associé
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
                  <TableHead>Associé</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Apport total</TableHead>
                  <TableHead className="text-right">Part</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssociates.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email || a.phone || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(a.total_contribution || 0)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{(a.participation_rate || 0).toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

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
          onSuccess={fetchAssociates}
          userId={user?.id}
        />
      </CardContent>
    </Card>
  );
}
