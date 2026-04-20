'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DollarSign, CreditCard, Building2, FileText, CheckCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FinanceRequest, Payment } from '@/lib/api-client';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { NairaAmount } from '@/components/ui/naira-amount';
import { EmptyState } from '@/components/ui/empty-state';
import { StaggerList, StaggerItem } from '@/components/ui/animate-in';
import { StatCard } from '@/components/ui/stat-card';
import { formatDate } from '@/lib/utils';

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash:          'Cash',
  bank_transfer: 'Bank Transfer',
  cheque:        'Cheque',
  pos:           'POS',
};

const PAYMENT_METHOD_ICON: Record<string, React.ReactNode> = {
  cash:          <DollarSign className="w-3.5 h-3.5" />,
  bank_transfer: <Building2  className="w-3.5 h-3.5" />,
  cheque:        <FileText   className="w-3.5 h-3.5" />,
  pos:           <CreditCard className="w-3.5 h-3.5" />,
};

export default function FinancePaymentsPage() {
  const router = useRouter();
  const [requests,    setRequests]    = useState<FinanceRequest[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.financeRequests.list({ per_page: 200 });
      setRequests(res.data ?? []);
    } catch {
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Requests in payment pipeline (satgo_approved → partial_payment → paid)
  const inPaymentPipeline = requests.filter(r =>
    ['satgo_approved', 'partial_payment', 'paid', 'receipted', 'completed'].includes(r.status)
  );

  const awaitingPayment = requests.filter(r => r.status === 'satgo_approved');
  const partiallyPaid   = requests.filter(r => r.status === 'partial_payment');
  const fullyPaid       = requests.filter(r => ['paid', 'receipted', 'completed'].includes(r.status));

  const totalPaidAmount = inPaymentPipeline.reduce((s, r) => s + (r.total_paid ?? 0), 0);
  const totalApprovedAmount = inPaymentPipeline.reduce((s, r) => s + r.amount, 0);

  // Flatten all payments from requests that have them
  const allPayments: (Payment & { request: FinanceRequest })[] = inPaymentPipeline
    .filter(r => r.payments && r.payments.length > 0)
    .flatMap(r => (r.payments ?? []).map(p => ({ ...p, request: r })))
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  const filtered = awaitingPayment.filter(r => {
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
        <h1 className="font-display text-2xl text-[#F5E8D3]">Payments</h1>
        <p className="font-body text-sm text-[#A89FB8] mt-0.5">Manage disbursements and payment records</p>
      </motion.div>

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard title="Awaiting Payment"  value={awaitingPayment.length} icon={<DollarSign  className="w-4 h-4" />} accentColor="#FBBF24" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Partial Payments"  value={partiallyPaid.length}   icon={<CreditCard  className="w-4 h-4" />} accentColor="#60A5FA" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Fully Paid"        value={fullyPaid.length}        icon={<CheckCircle className="w-4 h-4" />} accentColor="#34D399" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Total Disbursed"   value={`₦${(totalPaidAmount / 1000).toFixed(0)}k`} icon={<Building2  className="w-4 h-4" />} accentColor="#D4A843" />
        </StaggerItem>
      </StaggerList>

      {/* Progress banner */}
      {totalApprovedAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-4 bg-[#1F1450] border border-[#1A0F4D]"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-xs text-[#A89FB8]">Payment progress (approved requests)</p>
            <p className="font-body text-xs text-[#D4A843]">
              {Math.round((totalPaidAmount / totalApprovedAmount) * 100)}%
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-[#2D1A73]">
            <div
              className="h-full rounded-full bg-[#D4A843] transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round((totalPaidAmount / totalApprovedAmount) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <NairaAmount amount={totalPaidAmount} compact className="text-xs text-[#A89FB8]" />
            <NairaAmount amount={totalApprovedAmount} compact className="text-xs text-[#A89FB8]" />
          </div>
        </motion.div>
      )}

      {/* Awaiting payment queue */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg text-[#F5E8D3]">Awaiting Payment</h2>
            {awaitingPayment.length > 0 && (
              <span className="px-2 py-0.5 rounded-full font-body text-xs font-semibold bg-[rgba(251,191,36,0.12)] text-[#FBBF24] border border-[rgba(251,191,36,0.25)]">
                {awaitingPayment.length}
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
              title="No requests awaiting payment"
              description="All SATGO-approved requests have been paid or none are awaiting payment."
              icon={<CheckCircle className="w-7 h-7" />}
            />
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-[#2D1A73]">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-[#13093B] border-b border-[#2D1A73]">
                  {['Reference', 'Title', 'Amount', 'Department', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#A89FB8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors cursor-pointer"
                    onClick={() => router.push(`/finance/requests/${r.id}`)}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-[#D4A843]">{r.reference}</td>
                    <td className="px-4 py-3.5 text-[#A89FB8] max-w-[160px] truncate">{r.title}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <NairaAmount amount={r.amount} compact className="text-sm" />
                    </td>
                    <td className="px-4 py-3.5 text-[#A89FB8] text-xs">{r.department?.name ?? '—'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-body text-xs text-[#A89FB8] hover:text-[#D4A843] transition-colors">
                        Record payment →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent payments log */}
      {allPayments.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-[#F5E8D3] mb-4">Recent Payment Records</h2>
          <div className="rounded-xl overflow-hidden border border-[#2D1A73]">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-[#13093B] border-b border-[#2D1A73]">
                  {['Date', 'Request', 'Amount Paid', 'Method', 'Recorded By', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#A89FB8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPayments.slice(0, 20).map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors cursor-pointer"
                    onClick={() => router.push(`/finance/requests/${p.request.id}`)}
                  >
                    <td className="px-4 py-3.5 text-[#A89FB8] text-xs whitespace-nowrap">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-[#A89FB8] truncate max-w-[180px]">{p.request.title}</p>
                      <p className="font-mono text-xs text-[#D4A843] mt-0.5">{p.request.reference}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <NairaAmount amount={p.amount} compact className="text-sm text-[#34D399]" />
                    </td>
                    <td className="px-4 py-3.5">
                      {p.payment_method ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1A0F4D] border border-[#2D1A73] text-xs text-[#A89FB8]">
                          {PAYMENT_METHOD_ICON[p.payment_method]}
                          {PAYMENT_METHOD_LABEL[p.payment_method]}
                        </span>
                      ) : (
                        <span className="text-xs text-[#A89FB8]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#A89FB8] text-xs">{p.recorded_by?.name ?? '—'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-body text-xs text-[#A89FB8] hover:text-[#D4A843] transition-colors">
                        View →
                      </span>
                    </td>
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
