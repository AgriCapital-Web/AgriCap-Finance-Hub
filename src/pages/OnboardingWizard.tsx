import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Shield, Building2, FolderKanban, BookOpen, Users, 
  CheckCircle, ChevronRight, ChevronLeft, Plus, Trash2, Eye, EyeOff 
} from 'lucide-react';
import logo from '@/assets/logo-agricapital-hub.png';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';

// Validation schemas
const adminSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial"),
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

const STEPS = [
  { id: 'admin', title: 'Super Admin', icon: Shield, description: 'Créer le compte administrateur principal' },
  { id: 'departments', title: 'Départements', icon: Building2, description: 'Configurer les départements' },
  { id: 'projects', title: 'Projets', icon: FolderKanban, description: 'Créer les projets' },
  { id: 'accounts', title: 'Plan Comptable', icon: BookOpen, description: 'Configurer le plan comptable' },
  { id: 'users', title: 'Utilisateurs', icon: Users, description: 'Ajouter les utilisateurs' },
];

const DEFAULT_ACCOUNTS = [
  { account_number: '101', account_name: 'Capital social', account_type: 'passif' },
  { account_number: '106', account_name: 'Réserves', account_type: 'passif' },
  { account_number: '120', account_name: 'Résultat de l\'exercice', account_type: 'passif' },
  { account_number: '401', account_name: 'Fournisseurs', account_type: 'passif' },
  { account_number: '411', account_name: 'Clients', account_type: 'actif' },
  { account_number: '512', account_name: 'Banque', account_type: 'actif' },
  { account_number: '530', account_name: 'Caisse', account_type: 'actif' },
  { account_number: '601', account_name: 'Achats de marchandises', account_type: 'charge' },
  { account_number: '607', account_name: 'Achats de matières premières', account_type: 'charge' },
  { account_number: '616', account_name: 'Assurances', account_type: 'charge' },
  { account_number: '626', account_name: 'Frais postaux et télécommunications', account_type: 'charge' },
  { account_number: '641', account_name: 'Rémunérations du personnel', account_type: 'charge' },
  { account_number: '701', account_name: 'Ventes de produits finis', account_type: 'produit' },
  { account_number: '706', account_name: 'Prestations de services', account_type: 'produit' },
  { account_number: '707', account_name: 'Ventes de marchandises', account_type: 'produit' },
];

const ROLES = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'raf', label: 'RAF' },
  { value: 'cabinet', label: 'Cabinet Comptable' },
  { value: 'auditeur', label: 'Auditeur' },
];

const OnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Admin form
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    title: 'PDG / Fondateur'
  });

  // Departments
  const [departments, setDepartments] = useState([
    { name: 'Direction Générale', code: 'DG', description: 'Direction de l\'entreprise' },
    { name: 'Comptabilité', code: 'COMPTA', description: 'Service comptable' },
  ]);

  // Projects
  const [projects, setProjects] = useState([
    { name: 'Projet Principal', code: 'MAIN', description: 'Activités principales', department_id: '' },
  ]);

  // Chart of accounts
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);

  // Users
  const [users, setUsers] = useState([
    { full_name: '', email: '', password: '', role: 'comptable', phone: '' }
  ]);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Check if admin exists
      const { data: adminData } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'super_admin')
        .limit(1);

      if (adminData && adminData.length > 0) {
        setCompletedSteps(prev => [...prev, 'admin']);
        setCurrentStep(1);
      }

      // Check onboarding_status table
      const { data: statusData } = await supabase
        .from('onboarding_status')
        .select('step_completed');

      if (statusData) {
        const completed = statusData.map(s => s.step_completed);
        setCompletedSteps(prev => [...new Set([...prev, ...completed])]);
        
        // Find the first incomplete step
        const firstIncomplete = STEPS.findIndex(s => !completed.includes(s.id) && s.id !== 'admin');
        if (firstIncomplete > 0) {
          setCurrentStep(firstIncomplete);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    } finally {
      setChecking(false);
    }
  };

  const markStepComplete = async (stepId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('onboarding_status').upsert({
        step_completed: stepId,
        completed_by: user?.id,
        completed_at: new Date().toISOString()
      }, { onConflict: 'step_completed' });

      setCompletedSteps(prev => [...new Set([...prev, stepId])]);
    } catch (error) {
      console.error('Error marking step complete:', error);
    }
  };

  // Step 1: Create Admin
  const handleCreateAdmin = async () => {
    const newErrors: Record<string, string> = {};

    try {
      adminSchema.parse(adminForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
      }
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: adminForm.email,
        password: adminForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: adminForm.full_name,
            phone: adminForm.phone,
            title: adminForm.title
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('User creation failed');

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create super_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: 'super_admin' });

      if (roleError) throw roleError;

      await markStepComplete('admin');
      toast({ title: 'Super Admin créé avec succès !' });
      setCurrentStep(1);
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast({
          title: "Compte déjà existant",
          description: "Veuillez vous connecter avec ce compte.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create Departments
  const handleCreateDepartments = async () => {
    if (departments.length === 0) {
      toast({ title: "Ajoutez au moins un département", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('departments').insert(
        departments.map(d => ({
          name: d.name,
          code: d.code,
          description: d.description,
          is_active: true
        }))
      );

      if (error) throw error;

      await markStepComplete('departments');
      toast({ title: 'Départements créés avec succès !' });
      setCurrentStep(2);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create Projects
  const handleCreateProjects = async () => {
    if (projects.length === 0) {
      toast({ title: "Ajoutez au moins un projet", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: depts } = await supabase.from('departments').select('id, name');
      
      const projectsToInsert = projects.map(p => ({
        name: p.name,
        code: p.code,
        description: p.description,
        department_id: p.department_id || (depts && depts.length > 0 ? depts[0].id : null),
        is_active: true
      }));

      const { error } = await supabase.from('projects').insert(projectsToInsert);
      if (error) throw error;

      await markStepComplete('projects');
      toast({ title: 'Projets créés avec succès !' });
      setCurrentStep(3);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Create Chart of Accounts
  const handleCreateAccounts = async () => {
    if (accounts.length === 0) {
      toast({ title: "Ajoutez au moins un compte", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('chart_of_accounts').insert(
        accounts.map(a => ({
          account_number: a.account_number,
          account_name: a.account_name,
          account_type: a.account_type,
          is_active: true
        }))
      );

      if (error) throw error;

      await markStepComplete('accounts');
      toast({ title: 'Plan comptable créé avec succès !' });
      setCurrentStep(4);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Create Users
  const handleCreateUsers = async () => {
    const validUsers = users.filter(u => u.full_name && u.email && u.password);
    
    if (validUsers.length === 0) {
      // Skip if no users to create
      await markStepComplete('users');
      toast({ title: 'Configuration terminée !', description: 'Vous pouvez maintenant utiliser l\'application.' });
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      for (const user of validUsers) {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: user.full_name,
              phone: user.phone
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) continue;

        // Wait for profile creation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create role
        await supabase.from('user_roles').insert([{
          user_id: authData.user.id,
          role: user.role as 'admin' | 'comptable' | 'raf' | 'cabinet' | 'auditeur'
        }]);
      }

      await markStepComplete('users');
      toast({ title: 'Utilisateurs créés avec succès !', description: 'Redirection vers la connexion...' });
      
      setTimeout(() => navigate('/auth'), 2000);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    switch (STEPS[currentStep].id) {
      case 'admin':
        handleCreateAdmin();
        break;
      case 'departments':
        handleCreateDepartments();
        break;
      case 'projects':
        handleCreateProjects();
        break;
      case 'accounts':
        handleCreateAccounts();
        break;
      case 'users':
        handleCreateUsers();
        break;
    }
  };

  const canSkip = currentStep > 0;

  const handleSkip = async () => {
    await markStepComplete(STEPS[currentStep].id);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/auth');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <img src={logo} alt="AgriCapital" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Assistant de Configuration</h1>
          <p className="text-muted-foreground">Configurez votre application en quelques étapes</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  completedSteps.includes(step.id) 
                    ? 'bg-primary text-primary-foreground' 
                    : index === currentStep 
                      ? 'bg-primary/20 text-primary border-2 border-primary' 
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {completedSteps.includes(step.id) ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-12 h-1 mx-1 ${
                  completedSteps.includes(step.id) ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <StepIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Admin */}
            {currentStep === 0 && (
              <div className="space-y-4">
                {completedSteps.includes('admin') ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium">Super Admin déjà configuré</p>
                    <p className="text-muted-foreground">Passez à l'étape suivante</p>
                    <Button className="mt-4" onClick={() => setCurrentStep(1)}>
                      Continuer <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Nom complet *</Label>
                        <Input
                          placeholder="Ex: KOFFI Innocent"
                          value={adminForm.full_name}
                          onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                          className={errors.full_name ? 'border-destructive' : ''}
                        />
                        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          placeholder="admin@agricapital.ci"
                          value={adminForm.email}
                          onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                          className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Mot de passe *</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 12 caractères"
                            value={adminForm.password}
                            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                            className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Confirmer *</Label>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirmer le mot de passe"
                          value={adminForm.confirmPassword}
                          onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                          className={errors.confirmPassword ? 'border-destructive' : ''}
                        />
                        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input
                          placeholder="+225 07 XX XX XX"
                          value={adminForm.phone}
                          onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fonction</Label>
                        <Input
                          placeholder="PDG / Fondateur"
                          value={adminForm.title}
                          onChange={(e) => setAdminForm({ ...adminForm, title: e.target.value })}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      * Le mot de passe doit contenir: 12+ caractères, majuscule, minuscule, chiffre et caractère spécial
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Departments */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {departments.map((dept, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Nom"
                        value={dept.name}
                        onChange={(e) => {
                          const updated = [...departments];
                          updated[index].name = e.target.value;
                          setDepartments(updated);
                        }}
                      />
                      <Input
                        placeholder="Code"
                        value={dept.code}
                        onChange={(e) => {
                          const updated = [...departments];
                          updated[index].code = e.target.value.toUpperCase();
                          setDepartments(updated);
                        }}
                      />
                      <Input
                        placeholder="Description"
                        value={dept.description}
                        onChange={(e) => {
                          const updated = [...departments];
                          updated[index].description = e.target.value;
                          setDepartments(updated);
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDepartments(departments.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDepartments([...departments, { name: '', code: '', description: '' }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un département
                </Button>
              </div>
            )}

            {/* Step 3: Projects */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Nom du projet"
                        value={project.name}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].name = e.target.value;
                          setProjects(updated);
                        }}
                      />
                      <Input
                        placeholder="Code"
                        value={project.code}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].code = e.target.value.toUpperCase();
                          setProjects(updated);
                        }}
                      />
                      <Input
                        placeholder="Description"
                        value={project.description}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[index].description = e.target.value;
                          setProjects(updated);
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setProjects(projects.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setProjects([...projects, { name: '', code: '', description: '', department_id: '' }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un projet
                </Button>
              </div>
            )}

            {/* Step 4: Chart of Accounts */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {accounts.map((account, index) => (
                    <div key={index} className="flex gap-2 items-center p-2 border rounded-lg">
                      <Input
                        className="w-24"
                        placeholder="N°"
                        value={account.account_number}
                        onChange={(e) => {
                          const updated = [...accounts];
                          updated[index].account_number = e.target.value;
                          setAccounts(updated);
                        }}
                      />
                      <Input
                        className="flex-1"
                        placeholder="Libellé"
                        value={account.account_name}
                        onChange={(e) => {
                          const updated = [...accounts];
                          updated[index].account_name = e.target.value;
                          setAccounts(updated);
                        }}
                      />
                      <Select
                        value={account.account_type}
                        onValueChange={(val) => {
                          const updated = [...accounts];
                          updated[index].account_type = val;
                          setAccounts(updated);
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actif">Actif</SelectItem>
                          <SelectItem value="passif">Passif</SelectItem>
                          <SelectItem value="charge">Charge</SelectItem>
                          <SelectItem value="produit">Produit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAccounts(accounts.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setAccounts([...accounts, { account_number: '', account_name: '', account_type: 'charge' }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un compte
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Plan comptable SYSCOHADA pré-configuré. Personnalisez selon vos besoins.
                </p>
              </div>
            )}

            {/* Step 5: Users */}
            {currentStep === 4 && (
              <div className="space-y-4">
                {users.map((user, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Utilisateur {index + 1}</Badge>
                      {users.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUsers(users.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Nom complet"
                        value={user.full_name}
                        onChange={(e) => {
                          const updated = [...users];
                          updated[index].full_name = e.target.value;
                          setUsers(updated);
                        }}
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={user.email}
                        onChange={(e) => {
                          const updated = [...users];
                          updated[index].email = e.target.value;
                          setUsers(updated);
                        }}
                      />
                      <Input
                        type="password"
                        placeholder="Mot de passe"
                        value={user.password}
                        onChange={(e) => {
                          const updated = [...users];
                          updated[index].password = e.target.value;
                          setUsers(updated);
                        }}
                      />
                      <Select
                        value={user.role}
                        onValueChange={(val) => {
                          const updated = [...users];
                          updated[index].role = val;
                          setUsers(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setUsers([...users, { full_name: '', email: '', password: '', role: 'comptable', phone: '' }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un utilisateur
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Vous pouvez ignorer cette étape et créer les utilisateurs plus tard.
                </p>
              </div>
            )}

            {/* Navigation */}
            {!(currentStep === 0 && completedSteps.includes('admin')) && (
              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-2" /> Précédent
                    </Button>
                  )}
                  {canSkip && (
                    <Button variant="ghost" onClick={handleSkip}>
                      Ignorer
                    </Button>
                  )}
                </div>
                <Button onClick={handleNext} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {currentStep === STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                  {currentStep < STEPS.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingWizard;
