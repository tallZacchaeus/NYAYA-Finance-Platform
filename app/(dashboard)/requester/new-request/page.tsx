import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { serializeDoc } from '@/lib/firestore';
import { Request } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { RequestForm } from '@/components/requests/request-form';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const ACTIVE_STATUSES = ['pending', 'approved', 'paid'];

export default async function NewRequestPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as { id: string; role?: string };
  if (user.role === 'admin') redirect('/admin');

  // Check for an active (not yet completed) request
  const db = getAdminDb();
  const snap = await db
    .collection('requests')
    .where('user_id', '==', user.id)
    .orderBy('created_at', 'desc')
    .get();

  const activeDoc = snap.docs.find((doc) =>
    ACTIVE_STATUSES.includes(doc.data().status as string)
  );

  const activeRequest = activeDoc
    ? (serializeDoc(activeDoc.id, activeDoc.data()) as unknown as Request)
    : null;

  return (
    <div>
      <Header title="New Request" userId={user.id} />

      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <Link
          href="/requester"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Requests
        </Link>

        {activeRequest ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2.5 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  You have an active request
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  A new request cannot be submitted until your current request has been
                  fully processed and a receipt has been uploaded.
                </p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4 text-sm space-y-1">
                  <p>
                    <span className="text-gray-500">Purpose:</span>{' '}
                    <span className="font-medium text-gray-900">{activeRequest.purpose}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Status:</span>{' '}
                    <span className="inline-block capitalize px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      {activeRequest.status}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/requester/requests/${activeRequest.id}`}
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  View Active Request
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Submit Financial Request</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Fill in the details below. Your request will be reviewed and approved before
                  payment is processed.
                </p>
              </div>
              <RequestForm />
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Note:</span> You can only have one active request at
                a time. A new request can be submitted once your current request is completed and
                the receipt has been uploaded.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
