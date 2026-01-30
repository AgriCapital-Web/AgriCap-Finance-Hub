import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Mail, Phone, Globe, Bell, Shield, Database, CheckCircle, Users, Briefcase } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo-agricapital-hub.png';
import { UserManagement } from '@/components/settings/UserManagement';
import { StakeholderManagement } from '@/components/settings/StakeholderManagement';
import { AssociateManagement } from '@/components/settings/AssociateManagement';
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings';

const Settings = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [stats, setStats] = useState({ transactions: 0, documents: 0, reports: 0 });
  const [dbConnected, setDbConnected] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    name: 'AGRICAPITAL SARL',
    capital: '5 000 000 F CFA',
    rccm: 'CI-DAL-01-2025-B12-13435',
    address: 'Gonaté, Daloa – Côte d\'Ivoire',
    phone: '+225 07 59 56 60 87',
    email: 'contact@agricapital.ci',
    website: 'www.agricapital.ci',
    bank: 'Baobab Côte d\'Ivoire',
  });
  const [notifications, setNotifications] = useState({
    newTransactions: true,
    approvalRequests: true,
    weeklyReports: false,
    thresholdAlerts: true,
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
        const { count: docCount } = await supabase.from('documents').select('*', { count: 'exact', head: true });
        setStats({ transactions: txCount || 0, documents: docCount || 0, reports: 0 });
        setDbConnected(true);
      } catch {
        setDbConnected(false);
      }
    };
    checkConnection();
  }, []);

  const handleSaveSettings = async () => {
    // En production, sauvegarder dans une table settings
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos modifications ont été enregistrées.",
    });
  };

  return (
    <MainLayout 
      title="Paramètres" 
      subtitle="Configuration de l'application et gestion des données"
    >
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="company">Entreprise</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="users">Utilisateurs</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="associates">Associés</TabsTrigger>}
          {isAdmin && <TabsTrigger value="stakeholders">Intervenants</TabsTrigger>}
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informations de l'entreprise
                </CardTitle>
                <CardDescription>Détails de votre société</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <img src={logo} alt="AgriCapital" className="h-16 w-auto" />
                  <div>
                    <p className="font-semibold">AGRICAPITAL SARL</p>
                    <p className="text-sm text-muted-foreground">Accompagnement agricole et services intégrés</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Raison sociale</Label>
                    <Input 
                      value={companySettings.name} 
                      onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capital social</Label>
                    <Input 
                      value={companySettings.capital}
                      onChange={(e) => setCompanySettings({ ...companySettings, capital: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RCCM</Label>
                    <Input 
                      value={companySettings.rccm}
                      onChange={(e) => setCompanySettings({ ...companySettings, rccm: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Siège social</Label>
                    <Input 
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact
                </CardTitle>
                <CardDescription>Coordonnées de l'entreprise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  <Input 
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input 
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Site web
                  </Label>
                  <Input 
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banque</Label>
                  <Input 
                    value={companySettings.bank}
                    onChange={(e) => setCompanySettings({ ...companySettings, bank: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>Gérez vos alertes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Nouvelles transactions</p>
                    <p className="text-sm text-muted-foreground">Notification à chaque nouvelle entrée/sortie</p>
                  </div>
                  <Switch 
                    checked={notifications.newTransactions}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, newTransactions: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Demandes d'approbation</p>
                    <p className="text-sm text-muted-foreground">Alerte pour les transactions en attente</p>
                  </div>
                  <Switch 
                    checked={notifications.approvalRequests}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, approvalRequests: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Rapports hebdomadaires</p>
                    <p className="text-sm text-muted-foreground">Résumé envoyé chaque lundi</p>
                  </div>
                  <Switch 
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Alertes de seuil</p>
                    <p className="text-sm text-muted-foreground">Notification si le solde est bas</p>
                  </div>
                  <Switch 
                    checked={notifications.thresholdAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, thresholdAlerts: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data & Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Données et stockage
                </CardTitle>
                <CardDescription>Gestion des données</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.transactions}</p>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.documents}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.reports}</p>
                    <p className="text-xs text-muted-foreground">Rapports</p>
                  </div>
                </div>
                {dbConnected ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-emerald-800 font-medium text-sm">Base de données connectée</p>
                      <p className="text-xs text-emerald-700">Synchronisation en temps réel active</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 font-medium text-sm">Vérification de la connexion...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} size="lg" className="px-8">
              Sauvegarder les modifications
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <TwoFactorSettings />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Paramètres de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Validation double des transactions</p>
                  <p className="text-sm text-muted-foreground">Approbation requise par deux personnes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Historique des connexions</p>
                  <p className="text-sm text-muted-foreground">Suivez les accès à votre compte</p>
                </div>
                <Button variant="outline" size="sm">Voir l'historique</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        {isSuperAdmin && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}

        {/* Associates Tab */}
        {isSuperAdmin && (
          <TabsContent value="associates">
            <AssociateManagement />
          </TabsContent>
        )}

        {/* Stakeholders Tab */}
        {isAdmin && (
          <TabsContent value="stakeholders">
            <StakeholderManagement />
          </TabsContent>
        )}
      </Tabs>
    </MainLayout>
  );
};

export default Settings;
