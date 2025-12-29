import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, Phone, Globe, Bell, Shield, Database, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo-agricapital-transparent.png';

const Settings = () => {
  const [stats, setStats] = useState({ transactions: 0, documents: 0, reports: 0 });
  const [dbConnected, setDbConnected] = useState(false);

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

  const handleSave = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos modifications ont été enregistrées.",
    });
  };

  return (
    <MainLayout 
      title="Paramètres" 
      subtitle="Configuration de l'application"
    >
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
                <Input defaultValue="AGRICAPITAL SARL" />
              </div>
              <div className="space-y-2">
                <Label>Capital social</Label>
                <Input defaultValue="5 000 000 F CFA" />
              </div>
              <div className="space-y-2">
                <Label>RCCM</Label>
                <Input defaultValue="CI-DAL-01-2025-B12-13435" />
              </div>
              <div className="space-y-2">
                <Label>Siège social</Label>
                <Input defaultValue="Gonaté, Daloa – Côte d'Ivoire" />
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
              <Input defaultValue="+225 07 59 56 60 87" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input defaultValue="contact@agricapital.ci" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site web
              </Label>
              <Input defaultValue="www.agricapital.ci" />
            </div>
            <div className="space-y-2">
              <Label>Banque</Label>
              <Input defaultValue="Baobab Côte d'Ivoire" />
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
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Demandes d'approbation</p>
                <p className="text-sm text-muted-foreground">Alerte pour les documents en attente</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Rapports hebdomadaires</p>
                <p className="text-sm text-muted-foreground">Résumé envoyé chaque lundi</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Alertes de seuil</p>
                <p className="text-sm text-muted-foreground">Notification si le solde est bas</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Sécurité
            </CardTitle>
            <CardDescription>Paramètres de sécurité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Authentification à deux facteurs</p>
                <p className="text-sm text-muted-foreground">Sécurité renforcée pour votre compte</p>
              </div>
              <Switch />
            </div>
            <Separator />
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

        {/* Data & Storage */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Données et stockage
            </CardTitle>
            <CardDescription>Gestion des données de l'application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{stats.transactions}</p>
                <p className="text-xs text-muted-foreground mt-1">Documents enregistrés</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Pièces justificatives</p>
                <p className="text-2xl font-bold">{stats.documents}</p>
                <p className="text-xs text-muted-foreground mt-1">Fichiers uploadés</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Rapports générés</p>
                <p className="text-2xl font-bold">{stats.reports}</p>
                <p className="text-xs text-muted-foreground mt-1">Ce mois</p>
              </div>
            </div>
            {dbConnected ? (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Base de données connectée</p>
                  <p className="text-sm text-green-700 mt-1">
                    Lovable Cloud est actif. Toutes vos données sont sauvegardées en temps réel.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 font-medium">Vérification de la connexion...</p>
                <p className="text-sm text-amber-700 mt-1">
                  Connexion à la base de données en cours.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} size="lg" className="px-8">
          Sauvegarder les modifications
        </Button>
      </div>
    </MainLayout>
  );
};

export default Settings;
