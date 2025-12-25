import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'income' | 'expense' | 'balance' | 'pending';
}

const variants = {
  default: 'bg-card border-border',
  income: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200',
  expense: 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200',
  balance: 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20',
  pending: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200',
};

const iconVariants = {
  default: 'bg-muted text-muted-foreground',
  income: 'bg-emerald-500 text-white',
  expense: 'bg-red-500 text-white',
  balance: 'bg-primary text-primary-foreground',
  pending: 'bg-amber-500 text-white',
};

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default' 
}: StatCardProps) => {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:shadow-lg animate-fadeIn",
        variants[variant]
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <Icon className="w-full h-full" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
            iconVariants[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">vs mois dernier</span>
          </div>
        )}
      </div>
    </div>
  );
};
