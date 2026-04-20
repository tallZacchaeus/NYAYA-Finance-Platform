'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Users, Shield, Banknote, UserCheck, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ApiUser } from '@/lib/api-client';
import { api, ApiError } from '@/lib/api-client';
import { format } from 'date-fns';
import { StaggerList, StaggerItem } from '@/components/ui/animate-in';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { GoldButton } from '@/components/ui/gold-button';

type FrontendRole = 'super_admin' | 'finance_admin' | 'team_lead' | 'member';

const ROLE_COLORS: Record<string, string> = {
  super_admin:   'bg-[rgba(167,139,250,0.12)] text-[#A78BFA] border-[rgba(167,139,250,0.25)]',
  finance_admin: 'bg-[rgba(96,165,250,0.12)] text-[#60A5FA] border-[rgba(96,165,250,0.25)]',
  team_lead:     'bg-[rgba(52,211,153,0.12)] text-[#34D399] border-[rgba(52,211,153,0.25)]',
  member:        'bg-[#2D1A73] text-[#A89FB8] border-[#3D2590]',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', finance_admin: 'Finance Admin', team_lead: 'Team Lead', member: 'Member',
};

export default function AdminUsersPage() {
  const [users,       setUsers]       = useState<ApiUser[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId,  setUpdatingId]  = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.users.list();
      setUsers(res.data ?? []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const setRole = async (userId: number, newRole: FrontendRole) => {
    setUpdatingId(userId);
    try {
      await api.users.update(userId, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, roles: [newRole] } : u));
      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    const r = u.role ?? 'member';
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl text-[#F5E8D3]">Users</h1>
        <p className="font-body text-sm text-[#A89FB8] mt-0.5">Manage roles and permissions</p>
      </motion.div>

      {/* Stats */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard title="Total Users"    value={users.length}                    icon={<Users      className="w-4 h-4" />} accentColor="#D4A843" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Super Admin"    value={roleCounts.super_admin   ?? 0}   icon={<Shield     className="w-4 h-4" />} accentColor="#A78BFA" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Finance Admins" value={roleCounts.finance_admin ?? 0}   icon={<Banknote   className="w-4 h-4" />} accentColor="#60A5FA" />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Requesters"     value={roleCounts.member     ?? 0}   icon={<UserCheck  className="w-4 h-4" />} accentColor="#34D399" />
        </StaggerItem>
      </StaggerList>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89FB8]" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input-field pl-9 w-full"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-12 text-center font-body text-sm text-[#A89FB8]">
          Loading users…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
          <EmptyState title="No users found" description="Try a different search term." icon={<Users className="w-7 h-7" />} />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[#2D1A73] overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-[#13093B] border-b border-[#2D1A73]">
                {['Name', 'Email', 'Joined', 'Role', 'Assign Role'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#A89FB8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[#1A0F4D] last:border-0 hover:bg-[#13093B] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-display text-xs font-bold bg-gold text-[#0A0616]">
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-body text-sm text-[#A89FB8]">{user.name || '—'}</p>
                        <p className="font-body text-xs text-[#A89FB8] sm:hidden">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-body text-sm text-[#A89FB8] hidden sm:table-cell">{user.email}</td>
                  <td className="px-4 py-3.5 font-body text-xs text-[#A89FB8] hidden md:table-cell">
                    {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={[
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                      ROLE_COLORS[user.role ?? 'member'] ?? ROLE_COLORS.member,
                    ].join(' ')}>
                      {ROLE_LABELS[user.role ?? 'member'] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {updatingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4A843]" />
                      ) : (
                        <>
                          {user.role !== 'finance_admin' && (
                            <GoldButton variant="outline" onClick={() => setRole(user.id, 'finance_admin')} className="text-xs py-1 px-2.5">
                              Finance Admin
                            </GoldButton>
                          )}
                          {user.role !== 'team_lead' && (
                            <GoldButton variant="outline" onClick={() => setRole(user.id, 'team_lead')} className="text-xs py-1 px-2.5">
                              Team Lead
                            </GoldButton>
                          )}
                          {user.role !== 'member' && (
                            <GoldButton variant="ghost" onClick={() => setRole(user.id, 'member')} className="text-xs py-1 px-2.5">
                              Reset
                            </GoldButton>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
