import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo-agricapital-transparent.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="AGRICAPITAL FINANCE – logo"
              className="h-12 w-auto"
              loading="eager"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">AGRICAPITAL FINANCE</p>
              <p className="text-xs text-muted-foreground">Plateforme comptable & financière</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="AGRICAPITAL FINANCE – logo"
              className="h-24 w-auto"
              loading="eager"
            />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              AGRICAPITAL <span className="text-primary">FINANCE</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Accompagnement agricole et services intégrés
            </p>
            <p className="text-base text-muted-foreground max-w-lg mx-auto">
              Plateforme de gestion comptable et financière sécurisée pour la gestion des entrées, sorties, pièces justificatives, validations et reporting.
            </p>
          </div>

          <Button asChild size="lg" className="text-base px-8">
            <Link to="/auth">Accéder à la plateforme</Link>
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
            <Card className="p-6 border-primary/20 text-left">
              <h2 className="text-lg font-semibold text-foreground mb-4">Fonctionnalités clés</h2>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Gestion des entrées et sorties
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Suivi des apports des associés
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Circuit de validation (RAF → DG)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Rapports et états financiers
                </li>
              </ul>
            </Card>

            <Card className="p-6 text-left">
              <h2 className="text-base font-semibold text-foreground">Accès sécurisé</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Connexion email + mot de passe</li>
                <li>• Rôles et permissions (RBAC)</li>
                <li>• Traçabilité & audit</li>
                <li>• Données cryptées</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
          <p className="font-medium">AGRICAPITAL SARL</p>
          <p>Capital social : 5 000 000 F CFA | Gonaté, Daloa – Côte d'Ivoire</p>
          <p className="mt-1">RCCM : CI-DAL-01-2025-B12-13435 | Tél : +225 07 59 56 60 87</p>
          <p>Email : contact@agricapital.ci | www.agricapital.ci</p>
        </div>
      </footer>
    </div>
  );
}
