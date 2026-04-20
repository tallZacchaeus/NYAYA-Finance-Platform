import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, toFrontendRole } from '@/lib/auth';
import { serverApi } from '@/lib/api-server';
import type { FinanceRequest } from '@/lib/api-client';
import {
  PlusCircle, ClipboardList, CheckCircle, Clock, XCircle, AlertCircle,
} from 'lucide-react';
import { StaggerList, StaggerItem } from '@/components/ui/animate-in';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { NairaAmount } from '@/components/ui/naira-amount';
import { EmptyState } from '@/components/ui/empty-state';
import { GoldButton } from '@/components/ui/gold-button';

function getFirstName(name: string | null | undefined): string {
  if (!name?.trim()) return 'there';
  return name.trim().split(/\s+/)[0] || 'there';
}

export default async function RequesterDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = toFrontendRole(session.user.role);
  if (role === 'admin')   redirect('/admin');
  if (role === 'finance') redirect('/finance');

  const user = session.user;

  let requests: FinanceRequest[] = [];
  let loadError: string | null = null;

  try {
    const res = await serverApi.requests.list({ per_page: 100 });
    requests = res?.data ?? [];
  } catch {
    loadError = 'Could not load your requests right now. Please try again shortly.';
  }

  const pending  = requests.filter(r => r.status === 'submitted' || r.status === 'finance_reviewed');
  const approved = requests.filter(r => ['satgo_approved','partial_payment','paid','receipted','completed'].includes(r.status));
  const rejected = requests.filter(r => r.status === 'finance_rejected' || r.status === 'satgo_rejected');
  const approvedAmt = approved.reduce((s, r) => s + r.amount, 0);

  const tableHeaders = ['Reference', 'Title', 'Amount', 'Status', ''];

  return (
    <div className="p-5 sm:p-7 space-y-7">
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 bg-[#13093B] border border-[#2D1A73]">
        <div className="absolute top-2 right-8 w-20 h-20 rounded-full bg-[#1F1450]  pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-[#F5E8D3]">
              Welcome back, {getFirstName(user.name)}
            </h1>
            <p className="font-body text-sm text-[#A89FB8] mt-1">
              Track and manage your financial requests from here.
            </p>
          </div>
          <Link href="/requester/new-request">
            <GoldButton className="gap-2 whitespace-nowrap">
              <PlusCircle className="w-4 h-4" />
              New Request
            </GoldButton>
          </Link>
        </div>
      </div>

      {/* Error alert */}
      {loadError && (
        <div className="rounded-xl p-4 bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.18)] flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-medium text-[#A89FB8]">Requests unavailable</p>
            <p className="font-body text-xs text-[#A89FB8] mt-0.5">{loadError}</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard title="Total Requests" value={requests.length} icon={<ClipboardList className="w-4 h-4" />} accentColor="#D4A843" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Pending Review" value={pending.length}  icon={<Clock       className="w-4 h-4" />} accentColor="#FBBF24" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Approved"       value={approved.length} icon={<CheckCircle className="w-4 h-4" />} accentColor="#34D399" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Rejected"       value={rejected.length} icon={<XCircle     className="w-4 h-4" />} accentColor="#F87171" />
        </StaggerItem>
      </StaggerList>

      {/* Approved value banner */}
      {approvedAmt > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3 bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.15)]">
          <div className="w-8 h-8 rounded-lg bg-[rgba(52,211,153,0.12)] flex items-center justify-center text-[#34D399]">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-body text-xs text-[#A89FB8]">Total approved amount</p>
            <NairaAmount amount={approvedAmt} compact className="text-base" />
          </div>
        </div>
      )}

      {/* Request history */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-[#F5E8D3]">Request History</h2>
          {requests.length > 0 && (
            <Link href="/requester/new-request" className="font-body text-xs text-[#D4A843] hover:opacity-80 transition-opacity flex items-center gap-1">
              <PlusCircle className="w-3.5 h-3.5" />
              New Request
            </Link>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
            <EmptyState
              title="No requests yet"
              description="Submit your first financial request to get started."
              icon={<ClipboardList className="w-7 h-7" />}
              action={
                <Link href="/requester/new-request">
                  <GoldButton className="gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Submit a Request
                  </GoldButton>
                </Link>
              }
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
                {requests.slice(0, 15).map((r) => (
                  <tr key={r.id} className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-[#D4A843]">{r.reference}</td>
                    <td className="px-4 py-3.5 text-[#A89FB8] max-w-[200px] truncate">{r.title}</td>
                    <td className="px-4 py-3.5">
                      <NairaAmount amount={r.amount} compact className="text-sm" />
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/my-requests/requests/${r.id}`}
                        className="font-body text-xs text-[#A89FB8] hover:text-[#D4A843] transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
