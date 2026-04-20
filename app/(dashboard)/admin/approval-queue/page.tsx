'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShieldCheck, Clock, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FinanceRequest } from '@/lib/api-client';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { NairaAmount } from '@/components/ui/naira-amount';
import { EmptyState } from '@/components/ui/empty-state';
import { StaggerList, StaggerItem } from '@/components/ui/animate-in';
import { StatCard } from '@/components/ui/stat-card';
import { formatDate } from '@/lib/utils';

export default function AdminApprovalQueuePage() {
  const router = useRouter();
  const [requests,    setRequests]    = useState<FinanceRequest[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.financeRequests.list({ per_page: 200 });
      setRequests(res.data ?? []);
    } catch {
      toast.error('Failed to load approval queue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Finance reviewed = awaiting SATGO approval
  const awaitingSatgo  = requests.filter(r => r.status === 'finance_reviewed');
  const expiringSoon   = awaitingSatgo.filter(r => {
    if (!r.approval_expires_at) return false;
    const expiresAt = new Date(r.approval_expires_at).getTime();
    const now       = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return expiresAt - now < threeDays && expiresAt > now;
  });
  const recentlyApproved = requests.filter(r =>
    r.status === 'satgo_approved' && r.satgo_approved_at &&
    Date.now() - new Date(r.satgo_approved_at).getTime() < 7 * 24 * 60 * 60 * 1000
  );

  const totalQueueValue = awaitingSatgo.reduce((s, r) => s + r.amount, 0);

  const filtered = awaitingSatgo.filter(r => {
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
    <div className="p-5 sm:p-7 space-y-7">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl text-[#F5E8D3]">SATGO Approval Queue</h1>
        <p className="font-body text-sm text-[#A89FB8] mt-0.5">Finance-reviewed requests awaiting SATGO approval</p>
      </motion.div>

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StaggerItem>
          <StatCard title="Awaiting Approval" value={awaitingSatgo.length}    icon={<ShieldCheck   className="w-4 h-4" />} accentColor="#D4A843" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Expiring Soon"      value={expiringSoon.length}     icon={<AlertTriangle className="w-4 h-4" />} accentColor="#F87171" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Approved This Week" value={recentlyApproved.length} icon={<CheckCircle   className="w-4 h-4" />} accentColor="#34D399" />
        </StaggerItem>
      </StaggerList>

      {/* Queue value banner */}
      {totalQueueValue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl p-4 flex items-center gap-3 bg-[#1F1450] border border-[#1A0F4D]"
        >
          <div className="w-8 h-8 rounded-lg bg-[#1A0F4D] flex items-center justify-center text-[#D4A843]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-body text-xs text-[#A89FB8]">Total value pending SATGO approval</p>
            <NairaAmount amount={totalQueueValue} animated compact className="text-lg" />
          </div>
        </motion.div>
      )}

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-xl p-4 bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.2)]"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-[#F87171]">
                {expiringSoon.length} request{expiringSoon.length !== 1 ? 's' : ''} expiring within 3 days
              </p>
              <p className="font-body text-xs text-[rgba(248,113,113,0.6)] mt-0.5">
                Review these requests urgently to prevent approval expiry.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Queue table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg text-[#F5E8D3]">Pending Approval</h2>
            {awaitingSatgo.length > 0 && (
              <span className="px-2 py-0.5 rounded-full font-body text-xs font-semibold bg-[#1A0F4D] text-[#D4A843] border border-[#1A0F4D]">
                {awaitingSatgo.length}
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A89FB8]" />
            <input
              type="text"
              placeholder="Search requests…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-sm py-1.5 w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-10 text-center font-body text-sm text-[#A89FB8]">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
            <EmptyState
              title="Queue is clear"
              description="No finance-reviewed requests are currently awaiting SATGO approval."
              icon={<CheckCircle className="w-7 h-7" />}
            />
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-[#2D1A73]">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-[#13093B] border-b border-[#2D1A73]">
                  {['Reference', 'Title', 'Amount', 'Department', 'Reviewed By', 'Expires', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#A89FB8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isExpiringSoon = expiringSoon.some(e => e.id === r.id);
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/requests/${r.id}`)}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-[#D4A843]">{r.reference}</td>
                      <td className="px-4 py-3.5 text-[#A89FB8] max-w-[160px] truncate">{r.title}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <NairaAmount amount={r.amount} compact className="text-sm" />
                      </td>
                      <td className="px-4 py-3.5 text-[#A89FB8] text-xs">{r.department?.name ?? '—'}</td>
                      <td className="px-4 py-3.5 text-[#A89FB8] text-xs">{r.finance_reviewed_by?.name ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        {r.approval_expires_at ? (
                          <span className={[
                            'font-body text-xs',
                            isExpiringSoon ? 'text-[#F87171] font-semibold' : 'text-[#A89FB8]',
                          ].join(' ')}>
                            {isExpiringSoon && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                            {formatDate(r.approval_expires_at)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#A89FB8]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-body text-xs text-[#A89FB8] hover:text-[#D4A843] transition-colors">
                          Approve →
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently approved */}
      {recentlyApproved.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-[#F5E8D3] mb-4">Recently Approved (7 days)</h2>
          <div className="rounded-xl overflow-hidden border border-[#2D1A73]">
            <table className="w-full text-sm font-body">
              <tbody>
                {recentlyApproved.slice(0, 8).map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/requests/${r.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#D4A843]">{r.reference}</td>
                    <td className="px-4 py-3 text-[#A89FB8] truncate max-w-[200px]">{r.title}</td>
                    <td className="px-4 py-3">
                      <NairaAmount amount={r.amount} compact className="text-sm" />
                    </td>
                    <td className="px-4 py-3 text-[#A89FB8] text-xs">
                      {r.satgo_approved_by?.name ?? '—'} · {r.satgo_approved_at ? formatDate(r.satgo_approved_at) : '—'}
                    </td>
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
