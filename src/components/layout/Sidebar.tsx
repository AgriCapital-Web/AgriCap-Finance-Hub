import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  BarChart3,
  UsersRound,
  Briefcase,
  Menu,
  FolderOpen,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo-agricapital-finance-hub.png';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard', roles: ['super_admin', 'admin', 'comptable', 'raf', 'cabinet', 'auditeur'] },
  { icon: ArrowDownCircle, label: 'Entrées', path: '/income', roles: ['super_admin', 'admin', 'comptable', 'raf'] },
  { icon: ArrowUpCircle, label: 'Sorties', path: '/expenses', roles: ['super_admin', 'admin', 'comptable', 'raf'] },
  { icon: FileText, label: 'Transactions', path: '/transactions', roles: ['super_admin', 'admin', 'comptable', 'raf', 'cabinet', 'auditeur'] },
  { icon: BarChart3, label: 'Rapports', path: '/reports', roles: ['super_admin', 'admin', 'comptable', 'raf', 'cabinet', 'auditeur'] },
  { icon: FolderOpen, label: 'Documents', path: '/documents', roles: ['super_admin', 'admin', 'comptable', 'raf', 'cabinet', 'auditeur'] },
  { icon: UsersRound, label: 'Associés', path: '/associates', roles: ['super_admin'] },
  { icon: Briefcase, label: 'Intervenants', path: '/stakeholders', roles: ['super_admin', 'admin', 'comptable', 'raf'] },
  { icon: Users, label: 'Utilisateurs', path: '/users', roles: ['super_admin'] },
  { icon: Bell, label: 'Notifications', path: '/notifications', roles: ['super_admin', 'admin', 'comptable', 'raf', 'cabinet', 'auditeur'] },
  { icon: Settings, label: 'Paramètres', path: '/settings', roles: ['super_admin', 'admin', 'comptable', 'raf', 'cabinet', 'auditeur'] },
];

interface SidebarContentProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  onNavigate?: () => void;
}

const SidebarContent = ({ collapsed, setCollapsed, onNavigate }: SidebarContentProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredMenuItems = menuItems.filter(item => 
    !role || item.roles.includes(role)
  );

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <>
      {/* Logo Section */}
      <div className="flex items-center justify-center h-20 border-b border-sidebar-border px-4">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <img src={logo} alt="AgriCapital Finance Hub" className="h-12 w-auto object-contain" />
            <div className="leading-tight">
              <p className="text-xs font-bold text-sidebar-foreground">FINANCE HUB</p>
            </div>
          </div>
        ) : (
          <img src={logo} alt="AgriCapital Finance Hub" className="h-10 w-auto object-contain" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
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
              <span className="text-accent-foreground font-semibold text-sm">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || 'Utilisateur'}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{role?.replace('_', ' ') || 'Non défini'}</p>
            </div>
          </div>
        )}
        <button 
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent transition-smooth",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>

      {/* Toggle Button - Desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-card border border-border rounded-full items-center justify-center shadow-md hover:bg-muted transition-smooth"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-foreground" />
        )}
      </button>
    </>
  );
};

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden fixed top-4 left-4 z-50 bg-background shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar">
          <div className="h-full flex flex-col">
            <SidebarContent 
              collapsed={false} 
              setCollapsed={() => {}} 
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out flex-col",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
};