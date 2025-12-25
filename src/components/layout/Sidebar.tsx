import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  FileText, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo-agricapital.png';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
  { icon: ArrowDownCircle, label: 'Entrées', path: '/income' },
  { icon: ArrowUpCircle, label: 'Sorties', path: '/expenses' },
  { icon: FileText, label: 'Transactions', path: '/transactions' },
  { icon: BarChart3, label: 'Rapports', path: '/reports' },
  { icon: Users, label: 'Utilisateurs', path: '/users' },
  { icon: Settings, label: 'Paramètres', path: '/settings' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-center h-20 border-b border-sidebar-border px-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <img src={logo} alt="AgriCapital" className="h-12 w-auto object-contain brightness-0 invert" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-lg">A</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth group",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-accent")} />
              {!collapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-semibold text-sm">KJ</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">K. Jacques</p>
              <p className="text-xs text-sidebar-foreground/60">Administrateur</p>
            </div>
          </div>
        )}
        <button className={cn(
          "flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent transition-smooth",
          collapsed && "justify-center"
        )}>
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:bg-muted transition-smooth"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-foreground" />
        )}
      </button>
    </aside>
  );
};
