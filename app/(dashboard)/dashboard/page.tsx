import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const role = (session.user as { role?: string }).role;
  if (role === 'admin') redirect('/admin');
  if (role === 'finance') redirect('/finance');
  redirect('/requester');
}
