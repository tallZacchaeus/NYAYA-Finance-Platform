'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Request } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { RequestTable } from '@/components/requests/request-table';

export default function FinanceDashboard() {
  const [pending, setPending] = useState<Request[]>([]);
  const [reviewed, setReviewed] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const all: Request[] = data.requests || [];
      setPending(all.filter((r) => r.status === 'pending'));
      setReviewed(all.filter((r) => ['recommended', 'not_recommended'].includes(r.status)));
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div>
      <Header title="Finance Dashboard" userId="" />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-50 text-yellow-600 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Awaiting Review</p>
              <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Recommended</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviewed.filter((r) => r.status === 'recommended').length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600 flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Not Recommended</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviewed.filter((r) => r.status === 'not_recommended').length}
              </p>
            </div>
          </div>
        </div>

        {/* Pending queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Pending Review</h2>
          </div>
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
              Loading...
            </div>
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No requests awaiting your review.</p>
            </div>
          ) : (
            <RequestTable
              requests={pending}
              showRequester
              linkBase="/finance/requests"
            />
          )}
        </div>

        {/* Recently reviewed */}
        {reviewed.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Recently Reviewed</h2>
              <Link href="/finance/requests" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            <RequestTable
              requests={reviewed.slice(0, 5)}
              showRequester
              linkBase="/finance/requests"
            />
          </div>
        )}
      </div>
    </div>
  );
}
