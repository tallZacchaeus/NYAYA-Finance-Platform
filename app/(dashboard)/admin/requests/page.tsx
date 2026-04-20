'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Search, Download, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FinanceRequest } from '@/lib/api-client';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { NairaAmount } from '@/components/ui/naira-amount';
import { EmptyState } from '@/components/ui/empty-state';
import { GoldButton } from '@/components/ui/gold-button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001';

type StatusFilter = FinanceRequest['status'] | 'all';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',              label: 'All' },
  { value: 'submitted',        label: 'Submitted' },
  { value: 'finance_reviewed', label: 'Finance Reviewed' },
  { value: 'satgo_approved',   label: 'SATGO Approved' },
  { value: 'partial_payment',  label: 'Partial Payment' },
  { value: 'paid',             label: 'Paid' },
  { value: 'receipted',        label: 'Receipted' },
  { value: 'completed',        label: 'Completed' },
  { value: 'finance_rejected', label: 'Finance Rejected' },
  { value: 'satgo_rejected',   label: 'SATGO Rejected' },
];

export default function AdminRequestsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') ?? 'all') as StatusFilter;

  const [requests,     setRequests]     = useState<FinanceRequest[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>(initialStatus);
  const [searchQuery,  setSearchQuery]  = useState('');

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { per_page: '100' };
      if (activeFilter !== 'all') params.status = activeFilter;
      const res = await api.financeRequests.list(params);
      setRequests(res.data ?? []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.reference.toLowerCase().includes(q) ||
      r.requester?.name?.toLowerCase().includes(q) ||
      r.department?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl text-[#F5E8D3]">All Requests</h1>
          <p className="font-body text-sm text-[#A89FB8] mt-0.5">Manage and action all finance requests</p>
        </div>
        <a href={`${API_BASE}/api/export/requests`} target="_blank" rel="noreferrer">
          <GoldButton variant="outline" className="gap-2 text-sm shrink-0">
            <Download className="w-3.5 h-3.5" />
            Export
          </GoldButton>
        </a>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="flex gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89FB8]" />
          <input
            type="text"
            placeholder="Search by title, reference, requester, department…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2D1A73] bg-[#13093B] text-[#A89FB8] text-sm font-body select-none">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter</span>
        </div>
      </motion.div>

      {/* Status pill filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex gap-2 flex-wrap"
      >
        {STATUS_FILTERS.map((f) => {
          const count   = f.value !== 'all' ? requests.filter(r => r.status === f.value).length : requests.length;
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={[
                'px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200',
                isActive
                  ? 'bg-[#1A0F4D] text-[#D4A843] border border-[#2D1A73]'
                  : 'bg-[#13093B] text-[#A89FB8] border border-[#2D1A73] hover:border-[#3D2590] hover:text-[#A89FB8]',
              ].join(' ')}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-12 text-center font-body text-sm text-[#A89FB8]">
          Loading requests…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
          <EmptyState
            title="No requests found"
            description={searchQuery ? 'Try a different search term.' : 'No requests match the selected filter.'}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl overflow-hidden border border-[#2D1A73]"
        >
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-[#13093B] border-b border-[#2D1A73]">
                {['Reference', 'Title', 'Amount', 'Requester', 'Dept', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#A89FB8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.25 }}
                    className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/requests/${r.id}`)}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-[#D4A843] whitespace-nowrap">{r.reference}</td>
                    <td className="px-4 py-3.5 text-[#A89FB8] max-w-[180px] truncate">{r.title}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <NairaAmount amount={r.amount} compact className="text-sm" />
                    </td>
                    <td className="px-4 py-3.5 text-[#A89FB8] text-xs">{r.requester?.name ?? '—'}</td>
                    <td className="px-4 py-3.5 text-[#A89FB8] text-xs">{r.department?.name ?? '—'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-body text-xs text-[#A89FB8] hover:text-[#D4A843] transition-colors">
                        View →
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="font-body text-xs text-[#A89FB8] text-right">
          Showing {filtered.length} of {requests.length} requests
        </p>
      )}
    </div>
  );
}
