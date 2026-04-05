import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { RequestForm } from '@/components/requests/request-form';
import { ArrowLeft } from 'lucide-react';

export default async function NewRequestPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as { id: string; role?: string };
  if (user.role === 'admin') redirect('/admin');

  return (
    <div>
      <Header title="New Request" userId={user.id} />

      <div className="p-6 max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/requester"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Requests
        </Link>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Submit Financial Request</h2>
            <p className="text-gray-500 text-sm mt-1">
              Fill in the details below. Your request will be reviewed by the finance team.
            </p>
          </div>

          <RequestForm />
        </div>

        {/* Note */}
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Note:</span> Requests are typically reviewed within 2-3
            business days. You will receive an email notification once your request has been
            reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}
