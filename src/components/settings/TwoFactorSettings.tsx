import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Loader2, QrCode, Copy, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { generateTOTP, enableTOTP, disableTOTP } from '@/lib/totpApi';

export function TwoFactorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ uri: string; secret: string; recovery_codes: string[] } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.totp_enabled) {
      setIsEnabled(true);
    }
  }, [user]);

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const data = await generateTOTP();
      setSetupData(data);
      setIsSetupDialogOpen(true);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableTOTP = async () => {
    if (verificationCode.length !== 6) {
      toast({ title: 'Erreur', description: 'Veuillez entrer le code à 6 chiffres', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await enableTOTP(verificationCode);
      setIsEnabled(true);
      setIsSetupDialogOpen(false);
      setSetupData(null);
      setVerificationCode('');
      toast({ title: 'Succès', description: 'Authentification à deux facteurs activée' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableTOTP = async () => {
    setIsLoading(true);
    try {
      await disableTOTP();
      setIsEnabled(false);
      toast({ title: 'Succès', description: 'Authentification à deux facteurs désactivée' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Authentification à deux facteurs (2FA)
          </CardTitle>
          <CardDescription>
            Sécurisez votre compte avec une vérification supplémentaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <Badge className="bg-green-100 text-green-700">Activé</Badge>
              ) : (
                <Badge variant="outline">Désactivé</Badge>
              )}
              <div>
                <p className="font-medium">Application d'authentification (TOTP)</p>
                <p className="text-sm text-muted-foreground">
                  Utilisez Google Authenticator ou une app similaire
                </p>
              </div>
            </div>
            {isEnabled ? (
              <Button variant="destructive" onClick={handleDisableTOTP} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Désactiver
              </Button>
            ) : (
              <Button onClick={handleStartSetup} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Configurer
              </Button>
            )}
          </div>

          {isEnabled && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Votre compte est protégé par l'authentification à deux facteurs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Configurer l'authentification 2FA
            </DialogTitle>
            <DialogDescription>
              Scannez le QR code avec votre application d'authentification
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-4">
              {/* QR Code Placeholder - in real implementation, use a QR code library */}
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">QR Code</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Scannez avec Google Authenticator
                </p>
              </div>

              {/* Manual Entry */}
              <div>
                <Label className="text-sm">Clé secrète (entrée manuelle)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={setupData.secret} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Recovery Codes */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Codes de récupération</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Conservez ces codes en lieu sûr. Ils permettent de récupérer votre compte.
                    </p>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {setupData.recovery_codes.slice(0, 4).map((code, i) => (
                        <code key={i} className="text-xs bg-white px-2 py-1 rounded">{code}</code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification */}
              <div>
                <Label>Entrez le code de vérification</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono mt-1"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSetupDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEnableTOTP} disabled={isLoading || verificationCode.length !== 6}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Activer 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
