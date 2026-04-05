import Link from 'next/link';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import { Request } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from './status-badge';

interface RequestCardProps {
  request: Request;
  showRequester?: boolean;
  linkBase?: string;
}

const categoryIcons: Record<string, string> = {
  travel: '✈️',
  supplies: '📦',
  events: '🎪',
  utilities: '⚡',
  personnel: '👥',
  other: '📋',
};

export function RequestCard({
  request,
  showRequester = false,
  linkBase = '/admin/requests',
}: RequestCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{request.purpose}</p>
          {showRequester && request.user && (
            <p className="text-xs text-gray-500 mt-0.5">
              {request.user.name}
              {request.user.department && ` • ${request.user.department}`}
            </p>
          )}
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Amount */}
      <div className="text-2xl font-bold text-gray-900 mb-3">
        {formatCurrency(request.amount)}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" />
          <span className="capitalize">
            {categoryIcons[request.category]} {request.category}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(request.created_at)}
        </span>
      </div>

      {/* Rejection reason */}
      {request.status === 'rejected' && request.rejection_reason && (
        <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-700">
            <span className="font-medium">Reason: </span>
            {request.rejection_reason}
          </p>
        </div>
      )}

      {/* Description preview */}
      {request.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{request.description}</p>
      )}

      {/* Link */}
      <Link
        href={`${linkBase}/${request.id}`}
        className="flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-700 group"
      >
        View details
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
