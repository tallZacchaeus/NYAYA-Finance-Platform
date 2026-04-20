'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User as UserIcon, Phone, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, ApiError, type ApiUser } from '@/lib/api-client';
import { GoldButton } from '@/components/ui/gold-button';

const ROLE_LABELS: Record<string, string> = {
  super_admin:   'Super Admin',
  finance_admin: 'Finance Admin',
  team_lead:     'Team Lead',
  member:     'Requester',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin:   'bg-[rgba(167,139,250,0.12)] text-[#A78BFA] border-[rgba(167,139,250,0.25)]',
  finance_admin: 'bg-[rgba(96,165,250,0.12)] text-[#60A5FA] border-[rgba(96,165,250,0.25)]',
  team_lead:     'bg-[rgba(52,211,153,0.12)] text-[#34D399] border-[rgba(52,211,153,0.25)]',
  member:     'bg-[#2D1A73] text-[#A89FB8] border-[#3D2590]',
};

const inputCls = 'w-full px-4 py-2.5 rounded-lg font-body text-sm text-[#F5E8D3] placeholder-[#A89FB8] bg-[#1A0F4D] border border-[#2D1A73] focus:outline-none focus:border-[#BB913B] focus:bg-[#2D1A73] transition-all';
const labelCls = 'block font-body text-xs font-medium text-[#A89FB8] mb-1.5';

export default function SettingsPage() {
  const [profile,   setProfile]   = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');

  useEffect(() => {
    api.auth.me()
      .then((res) => {
        const user = res.data;
        setProfile(user);
        setName(user.name || '');
        setPhone(user.phone || '');
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (name.trim().length < 2) { toast.error('Name must be at least 2 characters'); return; }

    setIsSaving(true);
    try {
      const res = await api.users.update(profile.id, {
        name:  name.trim(),
        phone: phone.trim() || undefined,
      });
      setProfile(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (profile?.name || profile?.email || 'U')[0].toUpperCase();
  const roleKey  = profile?.role ?? 'member';

  return (
    <div className="p-5 sm:p-7 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl text-[#F5E8D3]">Settings</h1>
        <p className="font-body text-sm text-[#A89FB8] mt-0.5">Manage your account profile</p>
      </motion.div>

      {isLoading ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-12 flex items-center justify-center gap-2 font-body text-sm text-[#A89FB8]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading profile…
        </div>
      ) : !profile ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-12 text-center font-body text-sm text-[#A89FB8]">
          Could not load profile.
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          <form onSubmit={handleSave} className="space-y-6">
            {/* Profile card */}
            <div className="rounded-xl p-6 bg-[#13093B] border border-[#2D1A73] space-y-5">
              {/* Avatar + info */}
              <div className="flex items-center gap-4 pb-5 border-b border-[#2D1A73]">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-display text-lg font-bold bg-gold text-[#0A0616]">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-[#A89FB8] truncate">{profile.name || profile.email}</p>
                  <p className="font-body text-xs text-[#A89FB8] truncate mt-0.5">{profile.email}</p>
                </div>
                <span className={[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-semibold border shrink-0',
                  ROLE_COLORS[roleKey] ?? ROLE_COLORS.member,
                ].join(' ')}>
                  <ShieldCheck className="w-3 h-3" />
                  {ROLE_LABELS[roleKey] ?? roleKey}
                </span>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className={labelCls}>
                  <span className="inline-flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" />
                    Full name
                  </span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Your full name"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className={labelCls}>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Phone number
                  </span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>

            <GoldButton type="submit" loading={isSaving} className="w-full">
              Save changes
            </GoldButton>

            <p className="font-body text-xs text-center text-[#A89FB8]">
              To change your email or password, contact your administrator.
            </p>
          </form>
        </motion.div>
      )}
    </div>
  );
}
