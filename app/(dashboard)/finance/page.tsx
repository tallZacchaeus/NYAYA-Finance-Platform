'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ClipboardList, Clock, CheckCircle, XCircle, ThumbsUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FinanceRequest } from '@/lib/api-client';
import { api } from '@/lib/api-client';
import { StaggerList, StaggerItem } from '@/components/ui/animate-in';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { NairaAmount } from '@/components/ui/naira-amount';
import { EmptyState } from '@/components/ui/empty-state';
import { GoldButton } from '@/components/ui/gold-button';

export default function FinanceDashboard() {
  const router = useRouter();
  const [requests,  setRequests]  = useState<FinanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
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

  const pending     = requests.filter(r => r.status === 'submitted');
  const recommended = requests.filter(r => r.status === 'finance_reviewed');
  const approved    = requests.filter(r => ['satgo_approved','partial_payment','paid','receipted','completed'].includes(r.status));
  const rejected    = requests.filter(r => r.status === 'finance_rejected' || r.status === 'satgo_rejected');
  const pendingAmt  = pending.reduce((s, r) => s + r.amount, 0);

  const tableHeaders = ['Reference', 'Title', 'Amount', 'Dept', 'Status', ''];

  return (
    <div className="p-5 sm:p-7 space-y-7">
      {/* Page title */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl text-[#F5E8D3]">Finance Dashboard</h1>
        <p className="font-body text-sm text-[#A89FB8] mt-0.5">Review and approve financial requests</p>
      </motion.div>

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard title="Awaiting Review"  value={pending.length}     icon={<Clock        className="w-4 h-4" />} accentColor="#FBBF24" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Finance Reviewed" value={recommended.length} icon={<ThumbsUp     className="w-4 h-4" />} accentColor="#60A5FA" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Approved / Paid"  value={approved.length}    icon={<CheckCircle  className="w-4 h-4" />} accentColor="#34D399" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Rejected"         value={rejected.length}    icon={<XCircle      className="w-4 h-4" />} accentColor="#F87171" />
        </StaggerItem>
      </StaggerList>

      {/* Pending value banner */}
      {pendingAmt > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl p-4 flex items-center justify-between bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.15)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(251,191,36,0.12)] flex items-center justify-center text-[#FBBF24]">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="font-body text-xs text-[#A89FB8]">Total value pending your review</p>
              <NairaAmount amount={pendingAmt} animated compact className="text-lg" />
            </div>
          </div>
          <Link href="/finance/requests?status=submitted">
            <GoldButton variant="outline" className="text-xs py-1.5">Review now</GoldButton>
          </Link>
        </motion.div>
      )}

      {/* Pending queue table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-[#F5E8D3]">Pending Review</h2>
          <Link href="/finance/requests" className="font-body text-xs text-[#D4A843] hover:opacity-80 transition-opacity">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-10 text-center font-body text-sm text-[#A89FB8]">
            Loading…
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
            <EmptyState
              title="All caught up"
              description="No requests are currently awaiting your review."
              icon={<CheckCircle className="w-7 h-7" />}
            />
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-[#2D1A73]">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-[#13093B] border-b border-[#2D1A73]">
                  {tableHeaders.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#A89FB8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 8).map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#1A0F4D] hover:bg-[#13093B] transition-colors cursor-pointer"
                    onClick={() => router.push(`/finance/requests/${r.id}`)}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-[#D4A843]">{r.reference}</td>
                    <td className="px-4 py-3.5 text-[#A89FB8] max-w-[160px] truncate">{r.title}</td>
                    <td className="px-4 py-3.5"><NairaAmount amount={r.amount} compact className="text-sm" /></td>
                    <td className="px-4 py-3.5 text-[#A89FB8] text-xs">{r.department?.name ?? '—'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/finance/requests/${r.id}`}
                        className="font-body text-xs text-[#A89FB8] hover:text-[#D4A843] transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently recommended */}
      {recommended.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-[#F5E8D3]">Recently Recommended</h2>
            <Link href="/finance/requests?status=finance_reviewed" className="font-body text-xs text-[#D4A843] hover:opacity-80 transition-opacity">
              View all →
            </Link>
          </div>
          <div className="rounded-xl overflow-hidden border border-[#2D1A73]">
            <table className="w-full text-sm font-body">
              <tbody>
                {recommended.slice(0, 5).map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors cursor-pointer"
                    onClick={() => router.push(`/finance/requests/${r.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#D4A843]">{r.reference}</td>
                    <td className="px-4 py-3 text-[#A89FB8] truncate max-w-[200px]">{r.title}</td>
                    <td className="px-4 py-3"><NairaAmount amount={r.amount} compact className="text-sm" /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
