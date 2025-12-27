import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, CheckCircle } from 'lucide-react';
import logoDark from '@/assets/logo-agricapital-dark.png';

const InitSuperAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Pre-filled data for super admin
  const adminData = {
    email: 'admin@agricapital.ci',
    password: '@AgriCapitaladmin',
    full_name: 'KOFFI Inocent',
    phone: '0759566087',
    title: 'Fondateur / PDG'
  };

  useEffect(() => {
    checkIfAdminExists();
  }, []);

  const checkIfAdminExists = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'super_admin')
        .limit(1);

      if (error) throw error;
      setAdminExists(data && data.length > 0);
    } catch (error) {
      console.error('Error checking admin:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleInitialize = async () => {
    setLoading(true);
    try {
      // 1. Create the auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: adminData.full_name,
            phone: adminData.phone,
            title: adminData.title
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // 2. Wait a moment for trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Create super_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'super_admin'
        });

      if (roleError) throw roleError;

      setSuccess(true);
      toast({
        title: "Super Admin créé avec succès !",
        description: `Le compte ${adminData.email} a été initialisé.`,
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);

    } catch (error: any) {
      console.error('Error initializing admin:', error);
      
      if (error.message?.includes('already registered')) {
        toast({
          title: "Compte déjà existant",
          description: "Un compte avec cet email existe déjà. Veuillez vous connecter.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        toast({
          title: "Erreur d'initialisation",
          description: error.message || "Une erreur s'est produite.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={logoDark} alt="AgriCapital" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-xl text-primary">Super Admin Existe</CardTitle>
            <CardDescription>
              Un super administrateur a déjà été configuré pour cette application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/auth')}
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-xl text-primary">Initialisation réussie !</CardTitle>
            <CardDescription>
              Le compte Super Admin a été créé. Redirection vers la page de connexion...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Email: <strong>{adminData.email}</strong>
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoDark} alt="AgriCapital" className="h-16 w-auto" />
          </div>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Initialisation du Super Admin</CardTitle>
          <CardDescription>
            Configuration du premier administrateur pour AgriCapital Finance Hub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium">{adminData.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mot de passe</Label>
                <p className="font-medium">••••••••••••</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Nom complet</Label>
                <p className="font-medium">{adminData.full_name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Téléphone</Label>
                <p className="font-medium">{adminData.phone}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Titre</Label>
              <p className="font-medium">{adminData.title}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rôle</Label>
              <p className="font-medium text-primary">Super Admin (PDG / Fondateur)</p>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg gap-2" 
            onClick={handleInitialize}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Créer le Super Admin
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cette action ne peut être effectuée qu'une seule fois.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InitSuperAdmin;
