import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import logo from '@/assets/logo-agricapital-hub.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt after delay
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex justify-center mb-4">
            <img src={logo} alt="AGRICAPITAL FINANCE" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-center text-lg">Installer AGRICAPITAL FINANCE</CardTitle>
          <CardDescription className="text-center">
            Accédez rapidement à la plateforme depuis votre écran d'accueil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isIOS ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Pour installer sur iOS :
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Appuyez sur le bouton Partager <span className="inline-block">⬆️</span></li>
                <li>Sélectionnez "Sur l'écran d'accueil"</li>
                <li>Confirmez en appuyant sur "Ajouter"</li>
              </ol>
              <Button variant="outline" className="w-full mt-4" onClick={handleDismiss}>
                J'ai compris
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleDismiss}>
                Plus tard
              </Button>
              <Button className="flex-1 gap-2" onClick={handleInstall}>
                <Download className="h-4 w-4" />
                Installer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
