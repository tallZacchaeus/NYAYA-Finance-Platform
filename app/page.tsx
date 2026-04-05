import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }
  const user = session.user as any;
  const role = user?.role;
  if (role === 'admin') {
    redirect('/admin');
  }
  redirect('/requester');
}
