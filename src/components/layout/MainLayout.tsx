import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const MainLayout = ({ children, title, subtitle }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "lg:block",
        sidebarOpen ? "block" : "hidden"
      )}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 px-6 bg-card">
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
