import { FileX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-[#1F1450] text-[#BB913B]">
        {icon ?? <FileX className="w-7 h-7" />}
      </div>
      <h3 className="font-display text-lg text-[#F5E8D3] mb-1">
        {title}
      </h3>
      {description && (
        <p className="font-body text-sm text-[#A89FB8] max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
