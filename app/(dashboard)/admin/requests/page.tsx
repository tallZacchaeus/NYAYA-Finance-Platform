'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Download, Search, Filter } from 'lucide-react';
import { Request, RequestStatus } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { RequestTable } from '@/components/requests/request-table';
import { Button } from '@/components/ui/button';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<RequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'all') params.set('status', activeFilter);

      const res = await fetch(`/api/requests?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.purpose.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <Header title="All Requests" userId="" />

      <div className="p-4 sm:p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by purpose, requester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {/* Export */}
          <a href="/api/export" className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap">
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            Loading requests...
          </div>
        ) : (
          <RequestTable
            requests={filteredRequests}
            showRequester={true}
            onStatusFilter={setActiveFilter}
            activeFilter={activeFilter}
            linkBase="/admin/requests"
          />
        )}
      </div>
    </div>
  );
}
