import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };

  const role = user.role === 'admin' ? 'admin' : 'requester';
  const userName =
    typeof user.name === 'string' && user.name.trim().length > 0
      ? user.name
      : 'User';
  const userEmail = typeof user.email === 'string' ? user.email : '';

  return (
    <DashboardShell role={role} userName={userName} userEmail={userEmail}>
      {children}
    </DashboardShell>
  );
}
