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
              className="h-10 w-auto"
              loading="eager"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">AGRICAPITAL FINANCE</p>
              <p className="text-xs text-muted-foreground">Plateforme comptable & financière</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/auth">Accéder</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
          <article>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Gestion comptable AGRICAPITAL FINANCE
            </h1>
            <p className="mt-3 text-muted-foreground">
              Entrées, sorties, pièces justificatives, validations et reporting — dans un espace sécurisé.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/auth">Accéder</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">Se connecter</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Première installation ? <Link className="underline" to="/init-admin">Initialiser le Super Admin</Link>
            </p>
          </article>

          <aside>
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

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
          <p className="font-medium">AGRICAPITAL SARL</p>
          <p>Capital social : 5 000 000 F CFA | Gonaté, Daloa – Côte d'Ivoire</p>
        </div>
      </footer>
    </div>
  );
}
