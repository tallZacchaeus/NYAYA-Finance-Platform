'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { Request, RequestStatus } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { RequestTable } from '@/components/requests/request-table';

export default function FinanceAllRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<RequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    const matchesStatus = activeFilter === 'all' || r.status === activeFilter;
    if (!searchQuery.trim()) return matchesStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.purpose.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <Header title="All Requests" userId="" />

      <div className="p-4 sm:p-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by purpose, requester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
            Loading requests...
          </div>
        ) : (
          <RequestTable
            requests={filtered}
            showRequester
            onStatusFilter={setActiveFilter}
            activeFilter={activeFilter}
            linkBase="/finance/requests"
          />
        )}
      </div>
    </div>
  );
}
