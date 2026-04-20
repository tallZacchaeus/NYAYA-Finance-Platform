'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle,
  Loader2, Clock, ThumbsUp, DollarSign, Package, User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FinanceRequest } from '@/lib/api-client';
import { api, ApiError } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { NairaAmount } from '@/components/ui/naira-amount';
import { GoldButton } from '@/components/ui/gold-button';

/* ── Status Timeline ─────────────────────────────────────────────── */

type TimelineStep = {
  key:     string;
  label:   string;
  icon:    React.ReactNode;
  actor?:  string;
  at?:     string | null;
  active:  boolean;
  done:    boolean;
};

function StatusTimeline({ request }: { request: FinanceRequest }) {
  const steps: TimelineStep[] = [
    {
      key:    'submitted',
      label:  'Submitted',
      icon:   <Clock className="w-3.5 h-3.5" />,
      actor:  request.requester?.name,
      at:     request.created_at,
      active: true,
      done:   true,
    },
    {
      key:    'finance_reviewed',
      label:  'Finance Reviewed',
      icon:   <ThumbsUp className="w-3.5 h-3.5" />,
      actor:  request.finance_reviewed_by?.name,
      at:     request.finance_reviewed_at,
      active: ['finance_reviewed','satgo_approved','partial_payment','paid','receipted','completed'].includes(request.status),
      done:   !!request.finance_reviewed_at,
    },
    {
      key:    'satgo_approved',
      label:  'SATGO Approved',
      icon:   <CheckCircle className="w-3.5 h-3.5" />,
      actor:  request.satgo_approved_by?.name,
      at:     request.satgo_approved_at,
      active: ['satgo_approved','partial_payment','paid','receipted','completed'].includes(request.status),
      done:   !!request.satgo_approved_at,
    },
    {
      key:    'paid',
      label:  'Paid',
      icon:   <DollarSign className="w-3.5 h-3.5" />,
      actor:  request.paid_confirmed_by?.name,
      at:     request.fully_paid_at,
      active: ['paid','receipted','completed'].includes(request.status),
      done:   !!request.fully_paid_at,
    },
    {
      key:    'completed',
      label:  'Completed',
      icon:   <CheckCircle className="w-3.5 h-3.5" />,
      at:     request.completed_at,
      active: request.status === 'completed',
      done:   !!request.completed_at,
    },
  ];

  if (request.status === 'finance_rejected' || request.status === 'satgo_rejected') {
    return (
      <div className="rounded-xl p-4 bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.18)]">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[rgba(248,113,113,0.15)] flex items-center justify-center shrink-0 text-[#F87171]">
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-[#F87171]">Rejected</p>
            {request.rejected_by?.name && (
              <p className="font-body text-xs text-[#A89FB8] mt-0.5">by {request.rejected_by.name}</p>
            )}
            {request.rejected_at && (
              <p className="font-body text-xs text-[#A89FB8] mt-0.5">{formatDateTime(request.rejected_at)}</p>
            )}
            {request.rejection_reason && (
              <p className="font-body text-xs text-[rgba(248,113,113,0.8)] mt-2 leading-relaxed">{request.rejection_reason}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.key} className="flex gap-3">
          {/* Line + dot */}
          <div className="flex flex-col items-center">
            <div className={[
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
              step.done
                ? 'bg-[rgba(52,211,153,0.15)] text-[#34D399] border border-[rgba(52,211,153,0.25)]'
                : step.active
                  ? 'bg-[#1A0F4D] text-[#D4A843] border border-[#1A0F4D]'
                  : 'bg-[#1A0F4D] text-[#A89FB8] border border-[#2D1A73]',
            ].join(' ')}>
              {step.icon}
            </div>
            {i < steps.length - 1 && (
              <div className={[
                'w-px flex-1 my-1 min-h-[20px]',
                step.done ? 'bg-[rgba(52,211,153,0.2)]' : 'bg-[#2D1A73]',
              ].join(' ')} />
            )}
          </div>
          {/* Content */}
          <div className="pb-4 flex-1 min-w-0">
            <p className={[
              'font-body text-sm font-medium',
              step.done ? 'text-[#A89FB8]' : step.active ? 'text-[#D4A843]' : 'text-[#A89FB8]',
            ].join(' ')}>
              {step.label}
            </p>
            {step.actor && (
              <p className="font-body text-xs text-[#A89FB8] mt-0.5">{step.actor}</p>
            )}
            {step.at && (
              <p className="font-body text-xs text-[#A89FB8] mt-0.5">{formatDateTime(step.at)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function FinanceRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request,     setRequest]     = useState<FinanceRequest | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes,       setNotes]       = useState('');

  const fetchRequest = useCallback(async () => {
    try {
      const res = await api.financeRequests.get(Number(id));
      setRequest(res.data);
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.message : 'Failed to load request');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.financeRequests.financeReview(Number(id), notes.trim() || 'Reviewed');
      toast.success('Request recommended for approval');
      setNotes('');
      fetchRequest();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to recommend');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  if (fetchError || !request) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-10 h-10 text-[#F87171] mx-auto mb-3" />
        <p className="font-body text-sm text-[#A89FB8] mb-4">{fetchError ?? 'Request not found.'}</p>
        <Link href="/finance" className="font-body text-sm text-[#D4A843] hover:opacity-80">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const can = request.can;

  return (
    <div className="p-5 sm:p-7 max-w-5xl mx-auto space-y-6">
      {/* Back link */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 font-body text-sm text-[#A89FB8] hover:text-[#A89FB8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </motion.div>

      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="font-display text-2xl text-[#F5E8D3]">{request.title}</h1>
          <p className="font-mono text-xs text-[#D4A843] mt-1">{request.reference}</p>
        </div>
        <StatusBadge status={request.status} />
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Amount card */}
          <div className="rounded-xl p-5 bg-[#1F1450] border border-[#1A0F4D]">
            <p className="font-body text-xs text-[#D4A843] uppercase tracking-wider mb-1">Total Amount</p>
            <NairaAmount amount={request.amount} animated className="text-4xl" />
            <p className="font-body text-xs text-[#A89FB8] mt-2">
              {request.quantity} × <NairaAmount amount={request.unit_cost} className="text-xs inline" /> per unit
            </p>
          </div>

          {/* Details card */}
          <div className="rounded-xl p-5 bg-[#13093B] border border-[#2D1A73] space-y-4">
            <h2 className="font-display text-base text-[#F5E8D3]">Request Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#1A0F4D] flex items-center justify-center shrink-0 text-[#A89FB8]">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-body text-xs text-[#A89FB8]">Type</p>
                  <p className="font-body text-sm text-[#A89FB8] mt-0.5">
                    {request.request_type?.name ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#1A0F4D] flex items-center justify-center shrink-0 text-[#A89FB8]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-body text-xs text-[#A89FB8]">Requester</p>
                  <p className="font-body text-sm text-[#A89FB8] mt-0.5">{request.requester?.name ?? '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#1A0F4D] flex items-center justify-center shrink-0 text-[#A89FB8]">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-body text-xs text-[#A89FB8]">Department · Event</p>
                  <p className="font-body text-sm text-[#A89FB8] mt-0.5">
                    {request.department?.name ?? '—'} · {request.event?.name ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#1A0F4D] flex items-center justify-center shrink-0 text-[#A89FB8]">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-body text-xs text-[#A89FB8]">Submitted</p>
                  <p className="font-body text-sm text-[#A89FB8] mt-0.5">{formatDateTime(request.created_at)}</p>
                </div>
              </div>
            </div>

            {request.description && (
              <div className="pt-4 border-t border-[#1A0F4D]">
                <p className="font-body text-xs text-[#A89FB8] mb-2">Additional details</p>
                <p className="font-body text-sm text-[#A89FB8] leading-relaxed whitespace-pre-line">{request.description}</p>
              </div>
            )}
          </div>

          {/* Documents */}
          {request.documents && request.documents.length > 0 && (
            <div className="rounded-xl p-5 bg-[#13093B] border border-[#2D1A73]">
              <h2 className="font-display text-base text-[#F5E8D3] mb-3">Supporting Documents</h2>
              <div className="space-y-2">
                {request.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#2D1A73] bg-[#13093B] hover:border-[#1A0F4D] hover:bg-[#1F1450] transition-all group"
                  >
                    <FileText className="w-4 h-4 text-[#A89FB8] group-hover:text-[#D4A843] shrink-0 transition-colors" />
                    <span className="font-body text-sm text-[#A89FB8] group-hover:text-[#A89FB8] truncate transition-colors">{doc.file_name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recommend panel */}
          <AnimatePresence>
            {can?.finance_review && request.status === 'submitted' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl p-5 bg-[#13093B] border border-[#2D1A73]"
              >
                <h2 className="font-display text-base text-[#F5E8D3] mb-4">Your Recommendation</h2>
                <form onSubmit={handleRecommend} className="space-y-4">
                  <div>
                    <label className="block font-body text-xs font-medium text-[#A89FB8] mb-1.5">
                      Notes <span className="opacity-60">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add context for the approver…"
                      rows={3}
                      className="input-field resize-none w-full"
                    />
                  </div>
                  <GoldButton type="submit" disabled={isSubmitting} className="w-full gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                    {isSubmitting ? 'Submitting…' : 'Submit Finance Review'}
                  </GoldButton>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Right column ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="space-y-5"
        >
          {/* Status timeline */}
          <div className="rounded-xl p-5 bg-[#13093B] border border-[#2D1A73]">
            <h2 className="font-display text-base text-[#F5E8D3] mb-4">Approval Chain</h2>
            <StatusTimeline request={request} />
          </div>

          {/* Permission notice */}
          {!can?.finance_review && request.status === 'submitted' && (
            <div className="rounded-xl p-4 bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.15)]">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
                <p className="font-body text-xs text-[#A89FB8]">
                  Awaiting team lead recommendation before this request can proceed.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
