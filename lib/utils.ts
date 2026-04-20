import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import type { FinanceRequestStatus, InternalRequestStatus } from './api-client';

export type RequestStatus = FinanceRequestStatus;

/** Combined set of all status strings used across both tiers */
type AnyStatus = FinanceRequestStatus | InternalRequestStatus;

const REQUEST_STATUS_META: Record<AnyStatus, { color: string; label: string }> = {
  // Finance Request statuses (Tier 2)
  submitted:          { color: 'bg-yellow-100 text-yellow-800',  label: 'Submitted' },
  finance_reviewed:   { color: 'bg-blue-100 text-blue-800',     label: 'Finance Reviewed' },
  finance_rejected:   { color: 'bg-red-100 text-red-800',       label: 'Finance Rejected' },
  satgo_approved:     { color: 'bg-green-100 text-green-800',   label: 'SATGO Approved' },
  satgo_rejected:     { color: 'bg-red-100 text-red-800',       label: 'SATGO Rejected' },
  approval_expired:   { color: 'bg-orange-100 text-orange-800', label: 'Approval Expired' },
  partial_payment:    { color: 'bg-indigo-100 text-indigo-800', label: 'Partial Payment' },
  paid:               { color: 'bg-purple-100 text-purple-800', label: 'Paid' },
  receipted:          { color: 'bg-teal-100 text-teal-800',     label: 'Receipted' },
  refund_pending:     { color: 'bg-orange-100 text-orange-800', label: 'Refund Pending' },
  refund_completed:   { color: 'bg-teal-100 text-teal-800',     label: 'Refund Completed' },
  completed:          { color: 'bg-green-100 text-green-800',   label: 'Completed' },

  // Internal Request statuses (Tier 1)
  draft:              { color: 'bg-gray-100 text-gray-700',     label: 'Draft' },
  // 'submitted' already defined above
  approved:           { color: 'bg-green-100 text-green-800',   label: 'Approved' },
  needs_revision:     { color: 'bg-amber-100 text-amber-800',   label: 'Needs Revision' },
  rejected:           { color: 'bg-red-100 text-red-800',       label: 'Rejected' },
};

function getValidDate(date: string | Date | null | undefined): Date | null {
  if (!date) {
    return null;
  }

  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(safeAmount);
}

export function formatDate(date: string | Date | null | undefined): string {
  const parsed = getValidDate(date);
  return parsed ? format(parsed, 'MMM dd, yyyy') : 'Unknown date';
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const parsed = getValidDate(date);
  return parsed ? format(parsed, 'MMM dd, yyyy HH:mm') : 'Unknown date';
}

export function normalizeRequestStatus(status: unknown): AnyStatus {
  return typeof status === 'string' && status in REQUEST_STATUS_META
    ? (status as AnyStatus)
    : 'submitted';
}

export function getStatusColor(status: AnyStatus | string): string {
  return REQUEST_STATUS_META[normalizeRequestStatus(status)].color;
}

export function getStatusLabel(status: AnyStatus | string): string {
  return REQUEST_STATUS_META[normalizeRequestStatus(status)].label;
}
