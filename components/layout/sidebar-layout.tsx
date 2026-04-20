'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, PlusCircle, Users, BarChart3,
  LogOut, Bell, Settings, Building2, CalendarDays, Menu, X, ChevronRight,
  DollarSign, Tag, ShieldCheck, ScrollText,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import type { FrontendRole } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const memberNav: NavItem[] = [
  { href: '/my-requests',     label: 'My Requests', icon: <ClipboardList className="w-4 h-4" /> },
  { href: '/my-requests/new', label: 'New Request',  icon: <PlusCircle    className="w-4 h-4" /> },
];

const financeNav: NavItem[] = [
  { href: '/finance',               label: 'Dashboard',     icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/finance/requests',      label: 'All Requests',  icon: <ClipboardList   className="w-4 h-4" /> },
  { href: '/finance/payments',      label: 'Payments',      icon: <DollarSign      className="w-4 h-4" /> },
  { href: '/finance/request-types', label: 'Request Types', icon: <Tag             className="w-4 h-4" /> },
];

const teamLeadNav: NavItem[] = [
  { href: '/team-lead',        label: 'Dashboard',           icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/finance/requests', label: 'Department Requests', icon: <ClipboardList   className="w-4 h-4" /> },
];

const adminNav: NavItem[] = [
  { href: '/admin',                label: 'Dashboard',      icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/requests',       label: 'All Requests',   icon: <ClipboardList   className="w-4 h-4" /> },
  { href: '/admin/approval-queue', label: 'Approval Queue', icon: <ShieldCheck     className="w-4 h-4" /> },
  { href: '/admin/events',         label: 'Events',         icon: <CalendarDays    className="w-4 h-4" /> },
  { href: '/admin/departments',    label: 'Departments',    icon: <Building2       className="w-4 h-4" /> },
  { href: '/admin/users',          label: 'Users',          icon: <Users           className="w-4 h-4" /> },
  { href: '/admin/reports',        label: 'Reports',        icon: <BarChart3       className="w-4 h-4" /> },
  { href: '/admin/audit-log',      label: 'Audit Log',      icon: <ScrollText      className="w-4 h-4" /> },
];

const roleLabel: Record<FrontendRole, string> = {
  admin:     'Super Admin',
  finance:   'Finance Admin',
  team_lead: 'Team Lead',
  member:    'Member',
};

interface SidebarLayoutProps {
  role: FrontendRole;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function SidebarLayout({ role, userName, userEmail, children }: SidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navItems =
    role === 'admin'     ? adminNav :
    role === 'finance'   ? financeNav :
    role === 'team_lead' ? teamLeadNav :
    memberNav;

  const isActive = (href: string) => {
    const roots = ['/my-requests', '/admin', '/finance', '/team-lead'];
    if (roots.includes(href)) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try { await api.auth.logout(); } catch {}
    window.location.href = '/login';
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #2D1A73' }}>
        <div className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="RCCG YAYA"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm truncate leading-tight" style={{ color: '#F5E8D3' }}>
            YAYA Finance
          </p>
          <p className="font-body text-[10px] truncate" style={{ color: '#BB913B' }}>
            {roleLabel[role]} Portal
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all duration-150 relative group"
              style={{
                color:      active ? '#F5E8D3' : '#A89FB8',
                background: active ? '#2D1A73' : 'transparent',
              }}
            >
              {active && <span className="nav-active-bar" />}
              <span style={{ color: active ? '#D4A843' : '#A89FB8' }}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <ChevronRight className="w-3 h-3 ml-auto" style={{ color: '#BB913B' }} />
              )}
              {/* Hover state */}
              {!active && (
                <span
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ background: '#1A0F4D' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom utility links */}
      <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid #2D1A73' }}>
        {[
          { href: '/notifications', label: 'Notifications', icon: <Bell     className="w-4 h-4" /> },
          { href: '/settings',      label: 'Settings',      icon: <Settings className="w-4 h-4" /> },
        ].map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all duration-150 relative group"
              style={{
                color:      active ? '#F5E8D3' : '#A89FB8',
                background: active ? '#2D1A73' : 'transparent',
              }}
            >
              {active && <span className="nav-active-bar" />}
              <span style={{ color: active ? '#D4A843' : '#A89FB8' }}>{item.icon}</span>
              {item.label}
              {!active && (
                <span
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ background: '#1A0F4D' }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* User profile */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid #2D1A73' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-sm border"
            style={{ background: '#1A0F4D', color: '#D4A843', borderColor: '#3D2590' }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-body font-medium truncate" style={{ color: '#F5E8D3' }}>{userName}</p>
            <p className="text-xs font-body truncate" style={{ color: '#A89FB8' }}>{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg transition-colors hover:bg-[#1A0F4D]"
            style={{ color: '#A89FB8' }}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0616' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 h-full"
        style={{ background: '#13093B', borderRight: '1px solid #2D1A73' }}
      >
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex flex-col w-60 lg:hidden"
              style={{ background: '#13093B', borderRight: '1px solid #2D1A73' }}
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#1A0F4D] transition-colors"
                style={{ color: '#A89FB8' }}
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="h-14 flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-30"
          style={{
            background: '#0A0616',
            borderBottom: '1px solid #2D1A73',
          }}
        >
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[#1A0F4D] transition-colors"
            style={{ color: '#A89FB8' }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Image src="/logo.png" alt="YAYA" width={24} height={24} className="object-contain" />
            <span className="font-display text-sm" style={{ color: '#F5E8D3' }}>RCCG YAYA Finance</span>
          </div>

          {/* Desktop breadcrumb */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="font-body text-xs" style={{ color: '#A89FB8' }}>
              RCCG YAYA Finance Portal
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="p-2 rounded-lg hover:bg-[#1A0F4D] transition-colors"
              style={{ color: '#A89FB8' }}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs border"
              style={{ background: '#1A0F4D', color: '#D4A843', borderColor: '#3D2590' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
