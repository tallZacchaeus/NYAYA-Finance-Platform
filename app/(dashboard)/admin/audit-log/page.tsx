'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ScrollText, Search, CheckCircle, XCircle, DollarSign, ThumbsUp, ShieldCheck, FileText, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FinanceRequest, ReviewNote, ReviewAction } from '@/lib/api-client';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { NairaAmount } from '@/components/ui/naira-amount';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/utils';

const ACTION_META: Record<ReviewAction, { label: string; icon: React.ReactNode; color: string }> = {
  lead_approve:          { label: 'Lead Approved',       icon: <ThumbsUp    className="w-3.5 h-3.5" />, color: 'text-[#34D399] bg-[rgba(52,211,153,0.1)]'   },
  lead_reject:           { label: 'Lead Rejected',       icon: <XCircle     className="w-3.5 h-3.5" />, color: 'text-[#F87171] bg-[rgba(248,113,113,0.1)]'  },
  lead_revision_request: { label: 'Revision Requested',  icon: <Clock       className="w-3.5 h-3.5" />, color: 'text-[#FBBF24] bg-[rgba(251,191,36,0.1)]'  },
  finance_review:        { label: 'Finance Reviewed',    icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-[#60A5FA] bg-[rgba(96,165,250,0.1)]'   },
  finance_reject:        { label: 'Finance Rejected',    icon: <XCircle     className="w-3.5 h-3.5" />, color: 'text-[#F87171] bg-[rgba(248,113,113,0.1)]'  },
  satgo_approve:         { label: 'SATGO Approved',      icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'text-[#34D399] bg-[rgba(52,211,153,0.1)]'   },
  satgo_reject:          { label: 'SATGO Rejected',      icon: <XCircle     className="w-3.5 h-3.5" />, color: 'text-[#F87171] bg-[rgba(248,113,113,0.1)]'  },
  payment_recorded:      { label: 'Payment Recorded',    icon: <DollarSign  className="w-3.5 h-3.5" />, color: 'text-[#D4A843] bg-[#1A0F4D]'   },
  receipt_uploaded:      { label: 'Receipt Uploaded',    icon: <FileText    className="w-3.5 h-3.5" />, color: 'text-[#60A5FA] bg-[rgba(96,165,250,0.1)]'   },
  refund_confirmed:      { label: 'Refund Confirmed',    icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-[#34D399] bg-[rgba(52,211,153,0.1)]'   },
};

interface AuditEntry extends ReviewNote {
  request: FinanceRequest;
}

export default function AdminAuditLogPage() {
  const router = useRouter();
  const [requests,    setRequests]    = useState<FinanceRequest[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ReviewAction | 'all'>('all');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.financeRequests.list({ per_page: 200 });
      setRequests(res.data ?? []);
    } catch {
      toast.error('Failed to load audit log');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Flatten all review notes into a single timeline
  const allEntries: AuditEntry[] = requests
    .filter(r => r.review_notes && r.review_notes.length > 0)
    .flatMap(r => (r.review_notes ?? []).map(n => ({ ...n, request: r })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const uniqueActors = Array.from(new Set(allEntries.map(e => e.user.name)));

  const filtered = allEntries.filter(e => {
    const matchesAction = actionFilter === 'all' || e.action === actionFilter;
    if (!searchQuery.trim()) return matchesAction;
    const q = searchQuery.toLowerCase();
    return matchesAction && (
      e.request.title.toLowerCase().includes(q) ||
      e.request.reference.toLowerCase().includes(q) ||
      e.user.name.toLowerCase().includes(q) ||
      e.notes.toLowerCase().includes(q)
    );
  });

  const actionOptions: { value: ReviewAction | 'all'; label: string }[] = [
    { value: 'all',            label: 'All actions' },
    { value: 'finance_review', label: 'Finance Review' },
    { value: 'satgo_approve',  label: 'SATGO Approve' },
    { value: 'satgo_reject',   label: 'SATGO Reject' },
    { value: 'payment_recorded', label: 'Payment Recorded' },
    { value: 'receipt_uploaded', label: 'Receipt Uploaded' },
  ];

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl text-[#F5E8D3]">Audit Log</h1>
        <p className="font-body text-sm text-[#A89FB8] mt-0.5">
          Complete history of all approval actions · {uniqueActors.length} actors · {allEntries.length} entries
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89FB8]" />
          <input
            type="text"
            placeholder="Search by request, actor, or note…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as ReviewAction | 'all')}
          className="input-field sm:w-48"
        >
          {actionOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </motion.div>

      {/* Log */}
      {isLoading ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-10 text-center font-body text-sm text-[#A89FB8]">
          Loading audit log…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
          <EmptyState
            title="No entries found"
            description={searchQuery || actionFilter !== 'all' ? 'Try adjusting your filters.' : 'No audit events have been recorded yet.'}
            icon={<ScrollText className="w-7 h-7" />}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const meta = ACTION_META[entry.action];
            return (
              <motion.div
                key={`${entry.id}-${entry.request.id}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 border border-[#2D1A73] bg-[#13093B] hover:border-[#3D2590] transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/requests/${entry.request.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Action badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body font-medium shrink-0 mt-0.5 ${meta?.color ?? 'text-[#A89FB8] bg-[#1A0F4D]'}`}>
                    {meta?.icon}
                    {meta?.label ?? entry.action.replace(/_/g, ' ')}
                  </span>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="font-body text-sm font-medium text-[#A89FB8]">{entry.user.name}</p>
                      <span className="font-body text-xs text-[#A89FB8]">·</span>
                      <p className="font-mono text-xs text-[#D4A843]">{entry.request.reference}</p>
                      <span className="font-body text-xs text-[#A89FB8]">·</span>
                      <p className="font-body text-xs text-[#A89FB8] truncate max-w-[200px]">{entry.request.title}</p>
                    </div>
                    {entry.notes && (
                      <p className="font-body text-xs text-[#A89FB8] mt-1 line-clamp-2">{entry.notes}</p>
                    )}
                  </div>

                  {/* Meta right */}
                  <div className="text-right shrink-0">
                    <StatusBadge status={entry.request.status} />
                    <p className="font-body text-xs text-[#A89FB8] mt-1.5">{formatDateTime(entry.created_at)}</p>
                    <NairaAmount amount={entry.request.amount} compact className="text-xs text-[#A89FB8] mt-0.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="font-body text-xs text-[#A89FB8] text-right">
          Showing {filtered.length} of {allEntries.length} entries
        </p>
      )}
    </div>
  );
}
