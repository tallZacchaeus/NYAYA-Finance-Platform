'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Users,
  BarChart3,
  LogOut,
  DollarSign,
  Bell,
  Settings,
  X,
} from 'lucide-react';
import { firebaseApp } from '@/lib/firebase';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: 'requester' | 'admin';
  userName: string;
  userEmail: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const requesterNav: NavItem[] = [
  {
    href: '/requester',
    label: 'My Requests',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    href: '/requester/new-request',
    label: 'New Request',
    icon: <PlusCircle className="w-5 h-5" />,
  },
];

const adminNav: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: '/admin/requests',
    label: 'All Requests',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: '/admin/reports',
    label: 'Reports',
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

export function Sidebar({ role, userName, userEmail, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === 'admin' ? adminNav : requesterNav;

  const isActive = (href: string) => {
    if (href === '/requester' || href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/session/logout', { method: 'POST' });
    } finally {
      await firebaseSignOut(getAuth(firebaseApp)).catch(() => undefined);
      router.replace('/login');
      router.refresh();
    }
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-30',
        'transition-transform duration-300 ease-in-out',
        // Mobile: controlled by isOpen. Desktop: always visible.
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo + mobile close */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">NYAYA Finance</p>
          <p className="text-xs text-gray-500 truncate capitalize">{role} Portal</p>
        </div>
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <span className={cn(isActive(item.href) ? 'text-blue-600' : 'text-gray-400')}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-3 border-t border-gray-200 space-y-1">
        <Link
          href="/notifications"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive('/notifications')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Bell className={cn('w-5 h-5', isActive('/notifications') ? 'text-blue-600' : 'text-gray-400')} />
          Notifications
        </Link>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive('/settings')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Settings className={cn('w-5 h-5', isActive('/settings') ? 'text-blue-600' : 'text-gray-400')} />
          Settings
        </Link>
      </div>

      {/* User profile + sign out */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
