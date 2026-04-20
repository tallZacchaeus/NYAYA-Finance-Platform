import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export function Card({ children, className, padding = 'md', hoverable = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-bg-card rounded-xl border border-royal',
        'transition-all duration-200',
        hoverable && 'hover:border-gold hover:-translate-y-0.5',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 rounded-t-xl',
        'bg-bg-hover border-b border-royal',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('font-display text-lg text-text-primary', className)}>
      {children}
    </h3>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  accent?: 'gold' | 'green' | 'purple' | 'teal' | 'red';
}

const accentClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  gold:   'bg-bg-hover text-gold-bright border-royal',
  green:  'bg-forest-deep text-forest-bright border-forest',
  purple: 'bg-bg-subtle text-purple-400 border-royal-light',
  teal:   'bg-[#0F3D38] text-teal-300 border-[#0F3D38]',
  red:    'bg-[#3D1F1F] text-red-400 border-[#3D1F1F]',
};

export function StatCard({ title, value, icon, trend, accent = 'gold' }: StatCardProps) {
  return (
    <Card hoverable>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-body font-medium text-text-muted">{title}</p>
          <p className="mt-1 text-2xl font-display text-gold-bright">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-text-muted">
              <span className={trend.value >= 0 ? 'text-forest-light' : 'text-red-400'}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>{' '}
              {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-lg border', accentClasses[accent])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
