'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context';
import { Sidebar } from './sidebar';

interface DashboardShellProps {
  role: 'requester' | 'finance' | 'admin';
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

function Shell({ role, userName, userEmail, children }: DashboardShellProps) {
  const { open, setOpen } = useSidebar();
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        isOpen={open}
        onClose={() => setOpen(false)}
      />

      <div className="lg:ml-64 flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <SidebarProvider>
      <Shell {...props} />
    </SidebarProvider>
  );
}
