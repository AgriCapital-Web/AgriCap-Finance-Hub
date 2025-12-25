import { ArrowDownCircle, ArrowUpCircle, FileText, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const QuickActions = () => {
  const actions = [
    {
      icon: ArrowDownCircle,
      label: 'Nouvelle Entrée',
      description: 'Enregistrer un crédit',
      path: '/income',
      variant: 'income' as const,
    },
    {
      icon: ArrowUpCircle,
      label: 'Nouvelle Sortie',
      description: 'Enregistrer une dépense',
      path: '/expenses',
      variant: 'expense' as const,
    },
    {
      icon: Upload,
      label: 'Téléverser',
      description: 'Ajouter une facture',
      path: '/transactions',
      variant: 'default' as const,
    },
    {
      icon: FileText,
      label: 'Rapport',
      description: 'Générer un état',
      path: '/reports',
      variant: 'default' as const,
    },
  ];

  const buttonVariants = {
    income: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    expense: 'bg-red-500 hover:bg-red-600 text-white',
    default: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  };

  return (
    <Card className="animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Actions Rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.path + action.label}
              asChild
              className={`h-auto py-4 flex-col gap-2 ${buttonVariants[action.variant]}`}
            >
              <Link to={action.path}>
                <action.icon className="h-6 w-6" />
                <span className="font-medium">{action.label}</span>
                <span className="text-xs opacity-80">{action.description}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
