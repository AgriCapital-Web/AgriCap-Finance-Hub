import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export const Header = ({ title, subtitle, onMenuClick }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-smooth"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              className="pl-10 w-64 bg-muted/50 border-transparent focus:border-primary focus:bg-background"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground border-2 border-background">
              3
            </Badge>
          </Button>

          {/* Current Date */}
          <div className="hidden sm:block px-4 py-2 bg-secondary rounded-lg">
            <p className="text-sm font-medium text-secondary-foreground">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
