import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-agricapital-hub.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <main className="text-center max-w-lg mx-auto space-y-8">
        <div className="flex justify-center">
          <img
            src={logo}
            alt="AgriCapital Finance Hub"
            className="h-32 w-auto"
            loading="eager"
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            AGRICAPITAL <span className="text-primary">FINANCE HUB</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Application Comptable Privée & Sécurisée
          </p>
        </div>

        <Button asChild size="lg" className="text-base px-10">
          <Link to="/auth">Connexion</Link>
        </Button>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-muted-foreground">
          <p className="font-medium">AGRICAPITAL SARL</p>
          <p>Capital social : 5 000 000 F CFA | Gonaté, Daloa – Côte d'Ivoire</p>
          <p className="mt-1">RCCM : CI-DAL-01-2025-B12-13435 | Tél : +225 07 59 56 60 87</p>
          <p>contact@agricapital.ci | www.agricapital.ci</p>
        </div>
      </footer>
    </div>
  );
}