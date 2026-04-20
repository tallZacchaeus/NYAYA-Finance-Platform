import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, toFrontendRole } from '@/lib/auth';
import { serverApi } from '@/lib/api-server';
import type { FinanceRequest } from '@/lib/api-client';
import { ClipboardList, Clock, CheckCircle, Users, Download, CalendarDays, Building2, TrendingUp } from 'lucide-react';
import { StaggerList, StaggerItem } from '@/components/ui/animate-in';
import { StatCard } from '@/components/ui/stat-card';
import { NairaAmount } from '@/components/ui/naira-amount';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { GoldButton } from '@/components/ui/gold-button';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = toFrontendRole(session.user.role);
  if (role !== 'admin') redirect('/my-requests');

  let requests: FinanceRequest[] = [];
  try {
    const res = await serverApi.requests.list({ per_page: 50 });
    requests = res?.data ?? [];
  } catch { /* silent */ }

  const pending   = requests.filter(r => r.status === 'submitted' || r.status === 'finance_reviewed');
  const approved  = requests.filter(r => ['satgo_approved','partial_payment','paid','receipted','completed'].includes(r.status));
  const totalAmt  = requests.reduce((s, r) => s + r.amount, 0);
  const pendingAmt = pending.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="p-5 sm:p-7 space-y-7">
      {/* Event banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 bg-[#13093B] border border-[#2D1A73]">
        {/* Floating ambient blobs */}
        <div className="absolute top-2 right-12 w-24 h-24 rounded-full bg-[#1F1450]  pointer-events-none" />
        <div className="absolute bottom-2 right-32 w-16 h-16 rounded-full bg-[#2D1A73]  pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-body font-semibold px-2.5 py-1 rounded-full bg-[rgba(52,211,153,0.1)] text-[#34D399] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse-dot" />
            <span className="text-[#D4A843]">Active Event</span>
          </span>
          <h2 className="font-display text-2xl text-[#F5E8D3] mb-1">Mega Music Festival 2026</h2>
          <p className="font-body text-sm text-[#A89FB8] mb-4">June 1–3, 2026 · 16 departments · 100,000+ attendees</p>
          <div className="flex flex-wrap gap-5">
            <div>
              <p className="font-body text-xs text-[#A89FB8] mb-0.5">Total Budget</p>
              <NairaAmount amount={513_000_000} animated compact className="text-xl" />
            </div>
            <div>
              <p className="font-body text-xs text-[#A89FB8] mb-0.5">Requests Filed</p>
              <p className="font-display text-xl text-[#F5E8D3]">{requests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard title="Total Requests" value={requests.length} icon={<ClipboardList className="w-4 h-4" />} accentColor="#D4A843" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Pending Review" value={pending.length} icon={<Clock className="w-4 h-4" />} accentColor="#FBBF24" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Approved" value={approved.length} icon={<CheckCircle className="w-4 h-4" />} accentColor="#34D399" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Total Value"
            value={totalAmt}
            icon={<TrendingUp className="w-4 h-4" />}
            accentColor="#A78BFA"
            format="currency-compact"
          />
        </StaggerItem>
      </StaggerList>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/departments">
          <GoldButton variant="outline" className="gap-2 text-sm">
            <Building2 className="w-4 h-4" /> Departments
          </GoldButton>
        </Link>
        <Link href="/admin/events">
          <GoldButton variant="outline" className="gap-2 text-sm">
            <CalendarDays className="w-4 h-4" /> Events
          </GoldButton>
        </Link>
        <Link href="/admin/users">
          <GoldButton variant="outline" className="gap-2 text-sm">
            <Users className="w-4 h-4" /> Users
          </GoldButton>
        </Link>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'}/api/export/requests`}
          target="_blank"
          rel="noreferrer"
        >
          <GoldButton variant="ghost" className="gap-2 text-sm border border-[#2D1A73]">
            <Download className="w-4 h-4" /> Export
          </GoldButton>
        </a>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending requests table */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-[#F5E8D3]">Pending Review</h2>
            <Link href="/admin/requests?status=submitted" className="font-body text-xs text-[#D4A843] hover:opacity-80 transition-opacity">
              View all →
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
              <EmptyState title="No pending requests" description="All requests have been reviewed." icon={<CheckCircle className="w-7 h-7" />} />
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-[#2D1A73]">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="bg-[#13093B] border-b border-[#2D1A73]">
                    {['Reference', 'Title', 'Amount', 'Dept', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#A89FB8]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 8).map((r) => (
                    <tr key={r.id} className="border-b border-[#1A0F4D] hover:bg-[#13093B] transition-colors">
                      <td className="px-4 py-3.5">
                        <Link href={`/admin/requests/${r.id}`} className="font-body text-xs text-[#D4A843] hover:opacity-80 font-mono">
                          {r.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[#A89FB8] max-w-[180px] truncate">{r.title}</td>
                      <td className="px-4 py-3.5">
                        <NairaAmount amount={r.amount} compact className="text-sm" />
                      </td>
                      <td className="px-4 py-3.5 text-[#A89FB8] text-xs">{r.department?.name ?? '—'}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          <h2 className="font-display text-lg text-[#F5E8D3]">Summary</h2>

          {[
            { label: 'Pending value',  amount: pendingAmt,                               dotClass: 'bg-[#FBBF24]' },
            { label: 'Approved value', amount: approved.reduce((s,r) => s+r.amount, 0), dotClass: 'bg-[#34D399]' },
          ].map(({ label, amount, dotClass }) => (
            <div key={label} className="rounded-xl p-4 bg-[#13093B] border border-[#2D1A73]">
              <p className="font-body text-xs text-[#A89FB8] mb-1">{label}</p>
              <NairaAmount amount={amount} animated compact className="text-xl" gold={false} />
              <div className={`w-2 h-2 rounded-full mt-2 ${dotClass}`} />
            </div>
          ))}

          <Link href="/admin/requests" className="block">
            <GoldButton className="w-full">View All Requests</GoldButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
