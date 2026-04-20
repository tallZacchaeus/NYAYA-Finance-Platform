import { redirect } from 'next/navigation';
import { auth, toFrontendRole } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = toFrontendRole(session.user.role);
  if (role === 'admin') redirect('/admin');
  if (role === 'finance') redirect('/finance');
  if (role === 'team_lead') redirect('/team-lead');
  redirect('/my-requests');
}
