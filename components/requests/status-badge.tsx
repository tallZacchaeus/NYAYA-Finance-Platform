import { RequestStatus } from '@/lib/types';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
  showDot?: boolean;
}

const dotColors: Record<RequestStatus, string> = {
  pending: 'bg-yellow-500',
  approved: 'bg-blue-500',
  rejected: 'bg-red-500',
  paid: 'bg-purple-500',
  completed: 'bg-green-500',
};

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        getStatusColor(status),
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[status])} />
      )}
      {getStatusLabel(status)}
    </span>
  );
}
