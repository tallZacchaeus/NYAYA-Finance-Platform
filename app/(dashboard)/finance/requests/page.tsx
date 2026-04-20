'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FinanceRequest } from '@/lib/api-client';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { NairaAmount } from '@/components/ui/naira-amount';
import { EmptyState } from '@/components/ui/empty-state';

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

export default function FinanceAllRequestsPage() {
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
      const res = await api.financeRequests.list({ per_page: 100 });
      setRequests(res.data ?? []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    const matchesStatus = activeFilter === 'all' || r.status === activeFilter;
    if (!searchQuery.trim()) return matchesStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.title.toLowerCase().includes(q) ||
      r.reference.toLowerCase().includes(q) ||
      r.requester?.name?.toLowerCase().includes(q) ||
      r.department?.name?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl text-[#F5E8D3]">All Requests</h1>
        <p className="font-body text-sm text-[#A89FB8] mt-0.5">Review and action finance requests</p>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89FB8]" />
          <input
            type="text"
            placeholder="Search by title, reference, requester…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>

        {/* Filter icon (decorative, filters below) */}
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
              {f.value !== 'all' && (
                <span className="ml-1.5 opacity-60">
                  {requests.filter(r => r.status === f.value).length}
                </span>
              )}
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
            description={searchQuery ? 'Try a different search term or clear filters.' : 'No requests match the selected filter.'}
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
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors cursor-pointer"
                    onClick={() => router.push(`/finance/requests/${r.id}`)}
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
                      <span
                        className="font-body text-xs text-[#A89FB8] hover:text-[#D4A843] transition-colors"
                        onClick={(e) => { e.stopPropagation(); router.push(`/finance/requests/${r.id}`); }}
                      >
                        Review →
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Result count */}
      {!isLoading && filtered.length > 0 && (
        <p className="font-body text-xs text-[#A89FB8] text-right">
          Showing {filtered.length} of {requests.length} requests
        </p>
      )}
    </div>
  );
}
