'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CalendarDays, Plus, X, MapPin, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { api, ApiError, type ApiEvent } from '@/lib/api-client';
import { NairaAmount } from '@/components/ui/naira-amount';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { GoldButton } from '@/components/ui/gold-button';

const inputCls  = 'w-full px-4 py-2.5 rounded-lg font-body text-sm text-[#F5E8D3] placeholder-[#A89FB8] bg-[#1A0F4D] border border-[#2D1A73] focus:outline-none focus:border-[#BB913B] focus:bg-[#2D1A73] transition-all';
const labelCls  = 'block font-body text-xs font-medium text-[#A89FB8] mb-1.5';

const emptyForm = { name: '', description: '', event_date: '', venue: '', total_budget: '', expected_attendance: '' };

export default function AdminEventsPage() {
  const [events,    setEvents]    = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.events.list();
      setEvents(res.data ?? []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.event_date) return;
    setIsCreating(true);
    try {
      const res = await api.events.create({
        name:               form.name.trim(),
        description:        form.description.trim() || undefined,
        event_date:         form.event_date,
        venue:              form.venue.trim() || undefined,
        total_budget_kobo:  form.total_budget ? Math.round(Number(form.total_budget) * 100) : undefined,
        expected_attendance: form.expected_attendance ? Number(form.expected_attendance) : undefined,
      });
      setEvents(prev => [res.data, ...prev]);
      setForm(emptyForm);
      setShowCreate(false);
      toast.success('Event created');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl text-[#F5E8D3]">Events</h1>
          {!isLoading && (
            <p className="font-body text-sm text-[#A89FB8] mt-0.5">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <GoldButton onClick={() => setShowCreate(true)} className="gap-2 text-sm">
          <Plus className="w-4 h-4" />
          New Event
        </GoldButton>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleCreate}
            className="rounded-xl p-5 bg-[#1F1450] border border-[#1A0F4D] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base text-[#F5E8D3]">New Event</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Close"
                className="p-1 text-[#A89FB8] hover:text-[#A89FB8] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Event Name *</label>
                <input type="text" value={form.name} onChange={set('name')} className={inputCls}
                  placeholder="e.g. Annual Youth Conference 2026" required autoFocus />
              </div>
              <div>
                <label className={labelCls}>Event Date *</label>
                <input type="date" value={form.event_date} onChange={set('event_date')} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Venue</label>
                <input type="text" value={form.venue} onChange={set('venue')} className={inputCls} placeholder="e.g. Main Auditorium" />
              </div>
              <div>
                <label className={labelCls}>Total Budget (₦)</label>
                <input type="number" min="0" step="0.01" value={form.total_budget} onChange={set('total_budget')} className={inputCls} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Expected Attendance</label>
                <input type="number" min="0" step="1" value={form.expected_attendance} onChange={set('expected_attendance')} className={inputCls} placeholder="0" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={set('description')} className={`${inputCls} resize-none`} rows={3} placeholder="Brief description of the event…" />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg font-body text-sm text-[#A89FB8] border border-[#2D1A73] hover:bg-[#1A0F4D] transition-colors">
                Cancel
              </button>
              <GoldButton type="submit" disabled={isCreating} className="gap-2">
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Event
              </GoldButton>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Event grid */}
      {isLoading ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B] p-12 text-center font-body text-sm text-[#A89FB8]">
          Loading events…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-[#2D1A73] bg-[#13093B]">
          <EmptyState
            title="No events yet"
            description="Create your first event to start managing budgets and requests."
            icon={<CalendarDays className="w-7 h-7" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <Link
                href={`/admin/events/${event.id}/dashboard`}
                className="block rounded-xl p-5 bg-[#13093B] border border-[#2D1A73] hover:border-[#1A0F4D] hover:bg-[#1F1450] transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-display text-base text-[#A89FB8] leading-snug group-hover:text-[#F5E8D3] transition-colors">
                    {event.name}
                  </p>
                  {event.status && <StatusBadge status={event.status} />}
                </div>

                {event.description && (
                  <p className="font-body text-xs text-[#A89FB8] mb-3 line-clamp-2">{event.description}</p>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-body text-xs text-[#A89FB8]">
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                    {format(new Date(event.event_date), 'dd MMM yyyy')}
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2 font-body text-xs text-[#A89FB8]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {event.venue}
                    </div>
                  )}
                  {event.expected_attendance != null && event.expected_attendance > 0 && (
                    <div className="flex items-center gap-2 font-body text-xs text-[#A89FB8]">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      {event.expected_attendance.toLocaleString()} attendees
                    </div>
                  )}
                  {event.total_budget > 0 && (
                    <div className="pt-2 mt-2 border-t border-[#1A0F4D]">
                      <p className="font-body text-xs text-[#A89FB8] mb-0.5">Budget</p>
                      <NairaAmount amount={event.total_budget} compact className="text-sm" />
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
