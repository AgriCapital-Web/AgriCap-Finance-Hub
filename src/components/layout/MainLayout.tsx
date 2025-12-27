import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const MainLayout = ({ children, title, subtitle }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header 
          title={title} 
          subtitle={subtitle} 
        />
        
        <main className="flex-1 p-4 sm:p-6 pt-16 lg:pt-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 px-4 sm:px-6 bg-card">
          <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
            <p className="font-medium">AGRICAPITAL SARL</p>
            <p className="text-xs mt-1">
              Capital social : 5 000 000 F CFA | Siège social : Gonaté, Daloa – Côte d'Ivoire
            </p>
            <p className="text-xs">
              RCCM : CI-DAL-01-2025-B12-13435 | Tél : +225 07 59 56 60 87 | contact@agricapital.ci
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
