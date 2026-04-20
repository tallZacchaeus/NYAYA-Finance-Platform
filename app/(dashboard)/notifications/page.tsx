'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { EmptyState } from '@/components/ui/empty-state';
import { GoldButton } from '@/components/ui/gold-button';
import { format } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  request_id?: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data.data ?? data.notifications ?? []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    setIsMarkingRead(true);
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      toast.error('Failed to mark notifications as read');
    } finally {
      setIsMarkingRead(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-5 sm:p-7 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl text-[#F5E8D3]">Notifications</h1>
          {!isLoading && (
            <p className="font-body text-sm text-[#A89FB8] mt-0.5">
              {notifications.length} total
              {unreadCount > 0 && <span className="text-[#FBBF24]"> · {unreadCount} unread</span>}
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <GoldButton
            variant="outline"
            onClick={markAllRead}
            loading={isMarkingRead}
            className="gap-2 text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </GoldButton>
        )}
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-12 text-center font-body text-sm text-[#A89FB8]">
          Loading notifications…
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
          <EmptyState
            title="No notifications yet"
            description="You'll be notified here when request statuses change."
            icon={<Bell className="w-7 h-7" />}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl overflow-hidden border border-[#2D1A73]"
        >
          <AnimatePresence initial={false}>
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className={[
                  'flex items-start gap-4 px-5 py-4 border-b border-[#1A0F4D] last:border-0 transition-colors',
                  !n.read
                    ? 'bg-[#1F1450] border-l-2 border-l-[#BB913B]'
                    : 'hover:bg-[#13093B]',
                ].join(' ')}
              >
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0">
                  <div className={[
                    'w-2 h-2 rounded-full',
                    !n.read ? 'bg-[#D4A843]' : 'bg-[#3D2590]',
                  ].join(' ')} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={[
                    'font-body text-sm font-medium',
                    !n.read ? 'text-[#A89FB8]' : 'text-[#A89FB8]',
                  ].join(' ')}>
                    {n.title}
                  </p>
                  <p className="font-body text-sm text-[#A89FB8] mt-0.5">
                    {n.message}
                  </p>
                  {n.created_at && (
                    <p className="font-body text-xs text-[#A89FB8] mt-1">
                      {format(new Date(n.created_at), 'dd MMM yyyy, h:mm a')}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
