'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { Request, RequestStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { cn } from '@/lib/utils';

type SortField = 'created_at' | 'amount' | 'status' | 'purpose';
type SortDir = 'asc' | 'desc';

interface RequestTableProps {
  requests: Request[];
  showRequester?: boolean;
  onStatusFilter?: (status: RequestStatus | 'all') => void;
  activeFilter?: RequestStatus | 'all';
  linkBase?: string;
}

const STATUS_FILTERS: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
  { value: 'completed', label: 'Completed' },
];

export function RequestTable({
  requests,
  showRequester = false,
  onStatusFilter,
  activeFilter = 'all',
  linkBase = '/admin/requests',
}: RequestTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...requests].sort((a, b) => {
    let aVal: string | number = a[sortField] as string | number;
    let bVal: string | number = b[sortField] as string | number;
    if (sortField === 'amount') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    } else {
      aVal = String(aVal);
      bVal = String(bVal);
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="ml-1 w-3 h-3 inline text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="ml-1 w-3 h-3 inline text-blue-600" />
      : <ChevronDown className="ml-1 w-3 h-3 inline text-blue-600" />;
  };

  return (
    <div>
      {/* Filter bar */}
      {onStatusFilter && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onStatusFilter(filter.value)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                activeFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
          No requests found
        </div>
      ) : (
        <>
          {/* ── Mobile card list (hidden on md+) ── */}
          <div className="md:hidden space-y-3">
            {sorted.map((request) => (
              <Link
                key={request.id}
                href={`${linkBase}/${request.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
                    {request.purpose}
                  </p>
                  <StatusBadge status={request.status} />
                </div>

                {showRequester && request.user && (
                  <p className="text-xs text-gray-500 mb-2">
                    {request.user.name}
                    {request.user.department ? ` · ${request.user.department}` : ''}
                  </p>
                )}

                <div className="flex items-center justify-between mt-1">
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrency(request.amount)}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">
                    {request.category} · {formatDate(request.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Desktop table (hidden below md) ── */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {showRequester && (
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Requester</th>
                  )}
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('purpose')}
                  >
                    Purpose <SortIcon field="purpose" />
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('amount')}
                  >
                    Amount <SortIcon field="amount" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('status')}
                  >
                    Status <SortIcon field="status" />
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('created_at')}
                  >
                    Submitted <SortIcon field="created_at" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    {showRequester && (
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{request.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{request.user?.department || ''}</p>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 max-w-xs truncate">{request.purpose}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(request.amount)}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{request.category}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(request.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`${linkBase}/${request.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {sorted.length > 0 && (
        <p className="mt-3 text-sm text-gray-400">
          {sorted.length} {sorted.length === 1 ? 'request' : 'requests'}
        </p>
      )}
    </div>
  );
}
