import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, toFrontendRole } from '@/lib/auth';
import { serverApi } from '@/lib/api-server';
import type { FinanceRequest } from '@/lib/api-client';
import { Download, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { StaggerList, StaggerItem } from '@/components/ui/animate-in';
import { StatCard } from '@/components/ui/stat-card';
import { NairaAmount } from '@/components/ui/naira-amount';
import { GoldButton } from '@/components/ui/gold-button';
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar';
import { BarFill } from '@/components/ui/bar-fill';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001';

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = toFrontendRole(session.user.role);
  if (role !== 'admin') redirect('/my-requests');

  let requests: FinanceRequest[] = [];
  try {
    const res = await serverApi.requests.list({ per_page: 500 });
    requests = res?.data ?? [];
  } catch { /* show empty state */ }

  const total    = requests.length;
  const pending  = requests.filter(r => r.status === 'submitted' || r.status === 'finance_reviewed');
  const approved = requests.filter(r => ['satgo_approved','partial_payment','paid','receipted','completed'].includes(r.status));
  const rejected = requests.filter(r => r.status === 'finance_rejected' || r.status === 'satgo_rejected');

  const totalRequested = requests.reduce((s, r) => s + r.amount, 0);
  const totalApproved  = approved.reduce((s, r) => s + r.amount, 0);
  const totalPending   = pending.reduce((s, r) => s + r.amount, 0);
  const totalRejected  = rejected.reduce((s, r) => s + r.amount, 0);

  const deptMap = new Map<string, { count: number; total: number }>();
  for (const r of requests) {
    const name = r.department?.name ?? 'Unknown';
    const ex = deptMap.get(name) ?? { count: 0, total: 0 };
    deptMap.set(name, { count: ex.count + 1, total: ex.total + r.amount });
  }
  const byDept = Array.from(deptMap.entries())
    .map(([dept, s]) => ({ dept, ...s }))
    .sort((a, b) => b.total - a.total);

  const maxDeptTotal = byDept[0]?.total ?? 1;

  const bars = [
    { label: 'Approved / Paid / Completed', count: approved.length, colorClass: 'bg-[#34D399]' },
    { label: 'Pending Review',              count: pending.length,  colorClass: 'bg-[#FBBF24]' },
    { label: 'Rejected',                    count: rejected.length, colorClass: 'bg-[#F87171]' },
  ];

  return (
    <div className="p-5 sm:p-7 space-y-7">
      {/* Header + exports */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[#F5E8D3]">Reports</h1>
          <p className="font-body text-sm text-[#A89FB8] mt-0.5">Financial request analytics and exports</p>
        </div>
        <div className="flex gap-3">
          <a href={`${API_BASE}/api/export/requests`} target="_blank" rel="noreferrer">
            <GoldButton variant="outline" className="gap-2 text-sm">
              <Download className="w-3.5 h-3.5" />
              Export Requests
            </GoldButton>
          </a>
          <a href={`${API_BASE}/api/export/budget-summary`} target="_blank" rel="noreferrer">
            <GoldButton variant="ghost" className="gap-2 text-sm border border-[#2D1A73]">
              <Download className="w-3.5 h-3.5" />
              Budget Summary
            </GoldButton>
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard title="Total Requested" value={totalRequested} icon={<TrendingUp  className="w-4 h-4" />} accentColor="#D4A843"
            format="currency-compact" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Pending"         value={totalPending}   icon={<Clock       className="w-4 h-4" />} accentColor="#FBBF24"
            format="currency-compact" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Approved"        value={totalApproved}  icon={<CheckCircle className="w-4 h-4" />} accentColor="#34D399"
            format="currency-compact" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Rejected"        value={totalRejected}  icon={<XCircle     className="w-4 h-4" />} accentColor="#F87171"
            format="currency-compact" />
        </StaggerItem>
      </StaggerList>

      {/* Approval rate */}
      <div className="rounded-xl p-5 bg-[#13093B] border border-[#2D1A73] space-y-4">
        <h2 className="font-display text-lg text-[#F5E8D3]">Approval Rate</h2>
        {total === 0 ? (
          <p className="font-body text-sm text-[#A89FB8]">No data yet.</p>
        ) : (
          <div className="space-y-4">
            {bars.map(({ label, count, colorClass }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between font-body text-sm mb-2">
                    <span className="text-[#A89FB8]">{label}</span>
                    <span className="font-medium text-[#A89FB8]">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#2D1A73] overflow-hidden">
                    <BarFill pct={pct} colorClass={colorClass} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* By department */}
      {byDept.length > 0 && (
        <div className="rounded-xl p-5 bg-[#13093B] border border-[#2D1A73]">
          <h2 className="font-display text-lg text-[#F5E8D3] mb-4">By Department</h2>
          <div className="space-y-3">
            {byDept.map(({ dept, count, total: deptTotal }) => (
              <div key={dept}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="font-body text-sm font-medium text-[#A89FB8]">{dept}</p>
                    <p className="font-body text-xs text-[#A89FB8]">{count} request{count !== 1 ? 's' : ''}</p>
                  </div>
                  <NairaAmount amount={deptTotal} compact className="text-sm" />
                </div>
                <div className="h-1.5 rounded-full bg-[#2D1A73] overflow-hidden">
                  <BarFill pct={(deptTotal / maxDeptTotal) * 100} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="font-body text-xs text-[#A89FB8]">
        Use{' '}
        <Link href="/admin/requests" className="text-[#D4A843] hover:opacity-80">
          All Requests
        </Link>{' '}
        to filter and review individual records.
      </p>
    </div>
  );
}
