import { cn, getStatusColor, getStatusLabel, normalizeRequestStatus } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const safeStatus = normalizeRequestStatus(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        getStatusColor(safeStatus),
        className
      )}
    >
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
      )}
      {getStatusLabel(safeStatus)}
    </span>
  );
}
