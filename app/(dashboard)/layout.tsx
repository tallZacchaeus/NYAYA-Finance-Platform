import { redirect } from 'next/navigation';
import { auth, toFrontendRole } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/sidebar-layout';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;
  const role      = toFrontendRole(user.role);
  const userName  = user.name?.trim() || 'User';
  const userEmail = user.email ?? '';

  return (
    <SidebarLayout role={role} userName={userName} userEmail={userEmail}>
      {children}
    </SidebarLayout>
  );
}
