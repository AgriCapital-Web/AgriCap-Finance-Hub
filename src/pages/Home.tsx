import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo-agricapital-transparent.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
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
          <nav>
            <Button asChild>
              <Link to="/auth">Accéder</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <article className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Gestion comptable <span className="text-primary">AGRICAPITAL</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Entrées, sorties, pièces justificatives, validations et reporting — 
              dans un espace sécurisé et professionnel.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="text-base">
                <Link to="/auth">Accéder à la plateforme</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Première installation ?{" "}
              <Link className="underline text-primary hover:text-primary/80" to="/init-admin">
                Initialiser le Super Admin
              </Link>
            </p>
          </article>

          <aside className="space-y-4">
            <Card className="p-6 border-primary/20">
              <h2 className="text-lg font-semibold text-foreground mb-4">Fonctionnalités clés</h2>
              <ul className="space-y-3 text-muted-foreground">
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
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Gestion documentaire
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-semibold text-foreground">Accès sécurisé</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Connexion email + mot de passe</li>
                <li>• Rôles et permissions (RBAC)</li>
                <li>• Traçabilité & audit</li>
              </ul>
            </Card>
          </aside>
        </section>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
          <p className="font-medium">AGRICAPITAL SARL</p>
          <p>Capital social : 5 000 000 F CFA | Gonaté, Daloa – Côte d'Ivoire</p>
          <p className="mt-1">RCCM : CI-DAL-01-2025-B12-13435 | Tél : +225 07 59 56 60 87</p>
        </div>
      </footer>
    </div>
  );
}