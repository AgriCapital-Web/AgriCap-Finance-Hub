import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Mail, Shield, Edit2, CheckCircle, XCircle, Loader2, Eye, EyeOff, Search, Filter } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/useDepartments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, { label: string; color: string; description: string }> = {
  super_admin: { 
    label: 'Super Admin', 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Accès complet à toutes les fonctionnalités'
  },
  admin: { 
    label: 'Administrateur', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Gestion des utilisateurs et paramètres'
  },
  comptable: { 
    label: 'Comptable', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Saisie et gestion des transactions'
  },
  raf: { 
    label: 'RAF', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Validation des transactions'
  },
  cabinet: { 
    label: 'Cabinet Comptable', 
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    description: 'Consultation des rapports'
  },
  auditeur: { 
    label: 'Auditeur', 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Audit et vérification'
  },
};

const ACCESS_MODULES = [
  { id: 'dashboard', label: 'Tableau de bord', description: 'Voir les statistiques' },
  { id: 'income', label: 'Entrées', description: 'Gérer les revenus' },
  { id: 'expenses', label: 'Sorties', description: 'Gérer les dépenses' },
  { id: 'transactions', label: 'Transactions', description: 'Voir toutes les transactions' },
  { id: 'reports', label: 'Rapports', description: 'Générer des rapports' },
  { id: 'documents', label: 'Documents', description: 'Gérer les justificatifs' },
  { id: 'associates', label: 'Associés', description: 'Gérer les associés' },
  { id: 'stakeholders', label: 'Intervenants', description: 'Gérer les intervenants' },
  { id: 'users', label: 'Utilisateurs', description: 'Gérer les comptes' },
  { id: 'settings', label: 'Paramètres', description: 'Configuration' },
];

const DEFAULT_ACCESS_BY_ROLE: Record<string, string[]> = {
  super_admin: ACCESS_MODULES.map(m => m.id),
  admin: ACCESS_MODULES.map(m => m.id),
  comptable: ['dashboard', 'income', 'expenses', 'transactions', 'documents', 'stakeholders'],
  raf: ['dashboard', 'income', 'expenses', 'transactions', 'reports', 'documents', 'stakeholders'],
  cabinet: ['dashboard', 'transactions', 'reports', 'documents'],
  auditeur: ['dashboard', 'transactions', 'reports', 'documents'],
};

const Users = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '' as AppRole,
    title: '',
    phone: '',
    access: [] as string[],
  });

  const { users, loading, roleCounts, createUser, updateUserRole, toggleUserStatus } = useUsers();
  const { departments } = useDepartments();
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const handleRoleChange = (role: AppRole) => {
    setFormData({ 
      ...formData, 
      role,
      access: DEFAULT_ACCESS_BY_ROLE[role] || []
    });
  };

  const toggleAccess = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      access: prev.access.includes(moduleId)
        ? prev.access.filter(a => a !== moduleId)
        : [...prev.access, moduleId]
    }));
  };

  const handleCreateUser = async () => {
    if (!formData.full_name || !formData.email || !formData.password || !formData.role) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 6 caractères',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      await createUser(
        formData.email,
        formData.password,
        formData.full_name,
        formData.role,
        formData.phone,
        formData.title
      );
      setIsDialogOpen(false);
      setFormData({ full_name: '', email: '', password: '', role: '' as AppRole, title: '', phone: '', access: [] });
      toast({
        title: 'Succès',
        description: `L'utilisateur ${formData.full_name} a été créé avec succès`,
      });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de créer l\'utilisateur',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRole = async (newRole: AppRole) => {
    if (editingUser) {
      await updateUserRole(editingUser.id, newRole);
      setIsEditDialogOpen(false);
      setEditingUser(null);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <MainLayout 
      title="Utilisateurs" 
      subtitle="Gestion des accès et permissions"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-9 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {Object.entries(roleLabels).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un utilisateur</DialogTitle>
                <DialogDescription>
                  Créez un nouveau compte utilisateur avec les permissions appropriées.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informations</TabsTrigger>
                  <TabsTrigger value="access">Accès</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="full_name">Nom complet *</Label>
                      <Input
                        id="full_name"
                        placeholder="KOUAKOU Kouame Jacques"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="utilisateur@agricapital.ci"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimum 6 caractères"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        placeholder="+225 XX XX XX XX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rôle *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(val) => handleRoleChange(val as AppRole)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([key, { label, description }]) => (
                            <SelectItem key={key} value={key}>
                              <div>
                                <span className="font-medium">{label}</span>
                                <p className="text-xs text-muted-foreground">{description}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fonction</Label>
                      <Select
                        value={formData.title}
                        onValueChange={(val) => setFormData({ ...formData, title: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DG / PDG">DG / PDG</SelectItem>
                          <SelectItem value="Comptable">Comptable</SelectItem>
                          <SelectItem value="RAF">RAF</SelectItem>
                          <SelectItem value="Secrétaire">Secrétaire</SelectItem>
                          <SelectItem value="RH">RH</SelectItem>
                          <SelectItem value="Assistant(e)">Assistant(e)</SelectItem>
                          <SelectItem value="Cabinet comptable">Cabinet comptable</SelectItem>
                          <SelectItem value="Auditeur">Auditeur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="access" className="space-y-4 py-4">
                  <div className="p-4 bg-muted/50 rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez les modules auxquels cet utilisateur aura accès. 
                      Les accès par défaut sont définis selon le rôle choisi.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {ACCESS_MODULES.map((module) => (
                      <div
                        key={module.id}
                        className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.access.includes(module.id) 
                            ? 'bg-primary/5 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleAccess(module.id)}
                      >
                        <Checkbox
                          checked={formData.access.includes(module.id)}
                          onCheckedChange={() => toggleAccess(module.id)}
                        />
                        <div className="space-y-1">
                          <Label className="font-medium cursor-pointer">{module.label}</Label>
                          <p className="text-xs text-muted-foreground">{module.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleCreateUser} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer l'utilisateur
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(roleLabels).map(([role, { label, color }]) => {
          const count = roleCounts[role as keyof typeof roleCounts] || 0;
          return (
            <Card 
              key={role} 
              className={`hover:shadow-md transition-all cursor-pointer ${filterRole === role ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilterRole(filterRole === role ? 'all' : role)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Liste des utilisateurs</CardTitle>
          <Badge variant="outline">{filteredUsers.length} utilisateur(s)</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Chargement...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterRole !== 'all' ? 'Aucun utilisateur trouvé avec ces critères' : 'Aucun utilisateur trouvé'}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Statut</TableHead>
                    {isSuperAdmin && <TableHead className="w-24">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const role = user.role ? roleLabels[user.role] : null;
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-primary">
                                {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {role ? (
                            <Badge variant="outline" className={role.color}>{role.label}</Badge>
                          ) : (
                            <Badge variant="outline">Sans rôle</Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.title || '-'}</TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                              <XCircle className="h-3 w-3" />
                              Inactif
                            </Badge>
                          )}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => toggleUserStatus(user.id, !user.is_active)}
                              >
                                {user.is_active ? (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez le rôle de {editingUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rôle actuel</Label>
              <Badge variant="outline" className={editingUser?.role ? roleLabels[editingUser.role as AppRole]?.color : ''}>
                {editingUser?.role ? roleLabels[editingUser.role as AppRole]?.label : 'Sans rôle'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Nouveau rôle</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(roleLabels).map(([key, { label, color }]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className={`justify-start ${color} ${editingUser?.role === key ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleUpdateRole(key as AppRole)}
                    disabled={editingUser?.role === key}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Users;
