import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';

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

  const role = user.role as 'requester' | 'admin';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        role={role}
        userName={user.name || 'User'}
        userEmail={user.email || ''}
      />
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
