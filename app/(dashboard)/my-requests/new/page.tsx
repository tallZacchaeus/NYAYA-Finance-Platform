import { redirect } from 'next/navigation';
import { auth, toFrontendRole } from '@/lib/auth';
import { RequestForm } from '@/components/requests/request-form';

export default async function NewRequestPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = toFrontendRole(session.user.role);
  if (role === 'admin') redirect('/admin');

  return (
    <div className="p-5 sm:p-7">
      <RequestForm />
    </div>
  );
}
