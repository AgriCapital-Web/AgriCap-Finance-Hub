import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Shield, Eye, EyeOff, Loader2, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { createUserViaAdmin, updateUserRoleViaAdmin, toggleUserStatusViaAdmin } from '@/lib/adminApi';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Administrateur', color: 'bg-blue-100 text-blue-700' },
  comptable: { label: 'Comptable', color: 'bg-emerald-100 text-emerald-700' },
  raf: { label: 'RAF', color: 'bg-amber-100 text-amber-700' },
  cabinet: { label: 'Cabinet Comptable', color: 'bg-cyan-100 text-cyan-700' },
  auditeur: { label: 'Auditeur', color: 'bg-gray-100 text-gray-700' },
};

export function UserManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '' as AppRole,
    title: '',
    phone: '',
  });

  const { users, loading, refetch } = useUsers();
  const { toast } = useToast();

  const handleCreateUser = async () => {
    if (!formData.full_name || !formData.email || !formData.password || !formData.role) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 6 caractères', variant: 'destructive' });
      return;
    }

    try {
      setCreating(true);
      await createUserViaAdmin({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone,
        title: formData.title,
      });
      
      toast({ title: 'Succès', description: `Utilisateur ${formData.full_name} créé` });
      setIsDialogOpen(false);
      setFormData({ full_name: '', email: '', password: '', role: '' as AppRole, title: '', phone: '' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRole = async (newRole: AppRole) => {
    if (!editingUser) return;
    try {
      await updateUserRoleViaAdmin(editingUser.id, newRole);
      toast({ title: 'Succès', description: 'Rôle mis à jour' });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await toggleUserStatusViaAdmin(userId, isActive);
      toast({ title: 'Succès', description: isActive ? 'Utilisateur activé' : 'Utilisateur désactivé' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Gestion des Utilisateurs
          </CardTitle>
          <CardDescription>Créez et gérez les comptes utilisateurs</CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role && (
                        <Badge className={roleLabels[user.role]?.color}>
                          {roleLabels[user.role]?.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">Actif</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingUser(user); setIsEditDialogOpen(true); }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(user.id, !user.is_active)}
                        >
                          {user.is_active ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvel utilisateur</DialogTitle>
              <DialogDescription>Créez un compte avec les permissions appropriées</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom complet *</Label>
                <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="KOUAKOU Jacques" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="utilisateur@agricapital.ci" />
              </div>
              <div className="relative">
                <Label>Mot de passe *</Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-6" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div>
                <Label>Rôle *</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val as AppRole })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+225 XX XX XX XX" />
              </div>
              <div>
                <Label>Fonction</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Comptable, RAF..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Modifier le rôle</DialogTitle>
              <DialogDescription>{editingUser?.full_name}</DialogDescription>
            </DialogHeader>
            <Select onValueChange={(val) => handleUpdateRole(val as AppRole)}>
              <SelectTrigger><SelectValue placeholder="Nouveau rôle" /></SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
