import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { serializeDoc } from '@/lib/firestore';
import { Request } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Download, TrendingUp, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as { id: string; role?: string };
  if (user.role !== 'admin') redirect('/requester');

  const db = getAdminDb();
  const snap = await db.collection('requests').orderBy('created_at', 'desc').get();
  const requests = snap.docs.map((doc) =>
    serializeDoc(doc.id, doc.data())
  ) as unknown as Request[];

  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'pending');
  const approved = requests.filter((r) => ['approved', 'paid', 'completed'].includes(r.status));
  const rejected = requests.filter((r) => r.status === 'rejected');
  const completed = requests.filter((r) => r.status === 'completed');

  const totalRequested = requests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalApproved = approved.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalPending = pending.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalRejected = rejected.reduce((sum, r) => sum + (r.amount || 0), 0);

  // By category
  const categories = ['travel', 'supplies', 'events', 'utilities', 'personnel', 'other'] as const;
  const byCategory = categories.map((cat) => {
    const catRequests = requests.filter((r) => r.category === cat);
    return {
      category: cat,
      count: catRequests.length,
      total: catRequests.reduce((sum, r) => sum + (r.amount || 0), 0),
    };
  }).filter((c) => c.count > 0).sort((a, b) => b.total - a.total);

  return (
    <div>
      <Header title="Reports" userId={user.id} />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Export */}
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/export"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export All (CSV)
          </a>
          <a
            href="/api/export?status=pending"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export Pending
          </a>
          <a
            href="/api/export?status=completed"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export Completed
          </a>
        </div>

        {/* Summary stats */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Requested</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalRequested)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{total} requests</p>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalPending)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pending.length} requests</p>
                </div>
                <div className="p-2.5 rounded-lg bg-yellow-50 text-yellow-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalApproved)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{approved.length} requests</p>
                </div>
                <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalRejected)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{rejected.length} requests</p>
                </div>
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Completion rate */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">Approval Rate</h2>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          {total === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Approved / Paid / Completed', count: approved.length, color: 'bg-green-500' },
                { label: 'Pending Review', count: pending.length, color: 'bg-yellow-400' },
                { label: 'Rejected', count: rejected.length, color: 'bg-red-400' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">
                      {count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <meter
                      className={`block h-full w-full rounded-full appearance-none ${color}`}
                      value={count}
                      min={0}
                      max={total > 0 ? total : 1}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* By category */}
        {byCategory.length > 0 && (
          <Card>
            <h2 className="text-base font-semibold text-gray-700 mb-4">By Category</h2>
            <div className="divide-y divide-gray-100">
              {byCategory.map(({ category, count, total: catTotal }) => (
                <div key={category} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{category}</p>
                    <p className="text-xs text-gray-400">{count} request{count !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(catTotal)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <p className="text-xs text-gray-400">
          Use{' '}
          <Link href="/admin/requests" className="text-blue-500 hover:underline">
            All Requests
          </Link>{' '}
          to filter and review individual records.
        </p>
      </div>
    </div>
  );
}
