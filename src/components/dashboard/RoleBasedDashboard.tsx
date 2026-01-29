import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wallet, 
  Clock, 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Building,
  Calculator
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactionSummary } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/mockData';

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const QuickActionCard = ({ icon: Icon, label, description, onClick, variant = 'default' }: QuickActionProps) => {
  const variantStyles = {
    default: 'hover:border-primary/50 hover:bg-primary/5',
    success: 'hover:border-emerald-500/50 hover:bg-emerald-50',
    warning: 'hover:border-amber-500/50 hover:bg-amber-50',
    danger: 'hover:border-red-500/50 hover:bg-red-50',
  };

  const iconStyles = {
    default: 'text-primary',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${variantStyles[variant]}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${iconStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Dashboard pour Super Admin
export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { summary } = useTransactionSummary();

  return (
    <div className="space-y-6">
      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <ArrowDownCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Entrées</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <ArrowUpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Sorties</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Solde</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.balance)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">En attente</span>
            </div>
            <p className="text-xl font-bold">{summary.pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides Super Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Administration
          </CardTitle>
          <CardDescription>Actions réservées au Super Administrateur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickActionCard
              icon={Users}
              label="Gérer les utilisateurs"
              description="Créer, modifier les accès"
              onClick={() => navigate('/users')}
            />
            <QuickActionCard
              icon={Users}
              label="Associés fondateurs"
              description="Gérer les apports"
              onClick={() => navigate('/associates')}
              variant="success"
            />
            <QuickActionCard
              icon={Building}
              label="Intervenants"
              description="Fournisseurs, prestataires"
              onClick={() => navigate('/stakeholders')}
            />
            <QuickActionCard
              icon={CheckCircle2}
              label="Validations DG"
              description="Approuver les transactions"
              onClick={() => navigate('/transactions')}
              variant="warning"
            />
            <QuickActionCard
              icon={BarChart3}
              label="Rapports"
              description="Analyses financières"
              onClick={() => navigate('/reports')}
            />
            <QuickActionCard
              icon={FileText}
              label="Documents"
              description="GED et justificatifs"
              onClick={() => navigate('/documents')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard pour RAF (Responsable Administratif et Financier)
export const RAFDashboard = () => {
  const navigate = useNavigate();
  const { summary } = useTransactionSummary();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">À valider</span>
            </div>
            <p className="text-xl font-bold">{summary.pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Validées</span>
            </div>
            <p className="text-xl font-bold">{summary.approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Solde</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.balance)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-secondary-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Ce mois</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.totalIncome - summary.totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Validation & Finances
          </CardTitle>
          <CardDescription>Gérez les validations et le suivi financier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickActionCard
              icon={CheckCircle2}
              label="Valider transactions"
              description="Transactions en attente RAF"
              onClick={() => navigate('/transactions')}
              variant="warning"
            />
            <QuickActionCard
              icon={ArrowDownCircle}
              label="Nouvelles entrées"
              description="Enregistrer des recettes"
              onClick={() => navigate('/income')}
              variant="success"
            />
            <QuickActionCard
              icon={ArrowUpCircle}
              label="Nouvelles sorties"
              description="Enregistrer des dépenses"
              onClick={() => navigate('/expenses')}
              variant="danger"
            />
            <QuickActionCard
              icon={BarChart3}
              label="Rapports"
              description="Générer les états financiers"
              onClick={() => navigate('/reports')}
            />
            <QuickActionCard
              icon={FileText}
              label="Justificatifs"
              description="Lier les documents"
              onClick={() => navigate('/documents')}
            />
            <QuickActionCard
              icon={Building}
              label="Intervenants"
              description="Gérer les tiers"
              onClick={() => navigate('/stakeholders')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard pour Comptable
export const ComptableDashboard = () => {
  const navigate = useNavigate();
  const { summary } = useTransactionSummary();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <ArrowDownCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Entrées</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <ArrowUpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Sorties</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Brouillons</span>
            </div>
            <p className="text-xl font-bold">{summary.pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Solde</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.balance)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Saisie Comptable
          </CardTitle>
          <CardDescription>Enregistrez et gérez les transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickActionCard
              icon={ArrowDownCircle}
              label="Nouvelle entrée"
              description="Enregistrer une recette"
              onClick={() => navigate('/income')}
              variant="success"
            />
            <QuickActionCard
              icon={ArrowUpCircle}
              label="Nouvelle sortie"
              description="Enregistrer une dépense"
              onClick={() => navigate('/expenses')}
              variant="danger"
            />
            <QuickActionCard
              icon={FileText}
              label="Mes transactions"
              description="Voir mes saisies"
              onClick={() => navigate('/transactions')}
            />
            <QuickActionCard
              icon={FileText}
              label="Ajouter justificatif"
              description="Uploader un document"
              onClick={() => navigate('/documents')}
            />
            <QuickActionCard
              icon={Building}
              label="Intervenants"
              description="Gérer les fournisseurs"
              onClick={() => navigate('/stakeholders')}
            />
            <QuickActionCard
              icon={BarChart3}
              label="Rapports"
              description="Consulter les états"
              onClick={() => navigate('/reports')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard pour Auditeur (lecture seule)
export const AuditeurDashboard = () => {
  const navigate = useNavigate();
  const { summary } = useTransactionSummary();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <ArrowDownCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Entrées</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <ArrowUpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Sorties</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Solde</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.balance)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Validées</span>
            </div>
            <p className="text-xl font-bold">{summary.approvedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Audit & Consultation
          </CardTitle>
          <CardDescription>Consultez les données financières en lecture seule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickActionCard
              icon={FileText}
              label="Transactions"
              description="Consulter l'historique"
              onClick={() => navigate('/transactions')}
            />
            <QuickActionCard
              icon={BarChart3}
              label="Rapports"
              description="États financiers"
              onClick={() => navigate('/reports')}
            />
            <QuickActionCard
              icon={FileText}
              label="Documents"
              description="Justificatifs"
              onClick={() => navigate('/documents')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Composant principal qui sélectionne le dashboard selon le rôle
export const RoleBasedDashboard = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (role) {
    case 'super_admin':
    case 'admin':
      return <SuperAdminDashboard />;
    case 'raf':
      return <RAFDashboard />;
    case 'comptable':
      return <ComptableDashboard />;
    case 'auditeur':
    case 'cabinet':
      return <AuditeurDashboard />;
    default:
      return <ComptableDashboard />;
  }
};
