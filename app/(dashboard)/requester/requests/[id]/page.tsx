'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Request } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/requests/status-badge';
import { Card } from '@/components/ui/card';

export default function RequesterRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) throw new Error('Request not found');
      const data = await res.json();
      setRequest(data.request);
    } catch {
      toast.error('Failed to load request');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">Request not found.</p>
        <Link href="/requester" className="text-blue-600 text-sm mt-2 inline-block">
          Back to my requests
        </Link>
      </div>
    );
  }

  const statusIcons = {
    pending: <Clock className="w-5 h-5 text-yellow-500" />,
    approved: <CheckCircle className="w-5 h-5 text-blue-500" />,
    rejected: <XCircle className="w-5 h-5 text-red-500" />,
    paid: <DollarSign className="w-5 h-5 text-purple-500" />,
    completed: <CheckCircle className="w-5 h-5 text-green-500" />,
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/requester"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Requests
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{request.purpose}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Request #{request.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <StatusBadge status={request.status} className="text-sm px-3 py-1" />
      </div>

      {/* Amount */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <p className="text-sm font-medium text-blue-600 mb-1">Requested Amount</p>
        <p className="text-4xl font-bold text-gray-900">{formatCurrency(request.amount)}</p>
      </Card>

      {/* Status timeline */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
        <div className="space-y-3">
          {/* Step 1: Submitted */}
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Submitted</p>
              <p className="text-xs text-gray-400">{formatDateTime(request.created_at)}</p>
            </div>
          </div>

          {/* Step 2: Finance review */}
          {request.recommended_at ? (
            <div className="flex items-start gap-3">
              {request.recommendation_status === 'recommended'
                ? <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {request.recommendation_status === 'recommended'
                    ? 'Reviewed by Finance'
                    : 'Reviewed by Finance'}
                </p>
                <p className="text-xs text-gray-400">{formatDateTime(request.recommended_at)}</p>
                {/* Show finance comment only after CEO has acted (approved or rejected) */}
                {['approved', 'rejected', 'paid', 'completed'].includes(request.status) &&
                  request.recommendation_comment && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Finance note: "{request.recommendation_comment}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 opacity-50">
              <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
              <p className="text-sm text-gray-400">Awaiting finance review</p>
            </div>
          )}

          {/* Step 3: CEO decision */}
          {request.reviewed_at && (
            <div className="flex items-center gap-3">
              {statusIcons[request.status] ?? statusIcons['approved']}
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {request.status === 'rejected' ? 'Rejected' : 'Approved'}
                </p>
                <p className="text-xs text-gray-400">{formatDateTime(request.reviewed_at)}</p>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {request.paid_at && (
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Processed</p>
                <p className="text-xs text-gray-400">{formatDateTime(request.paid_at)}</p>
              </div>
            </div>
          )}

          {/* Step 5: Receipt / Completed */}
          {request.receipt && (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Receipt Uploaded — Completed</p>
                <p className="text-xs text-gray-400">{formatDateTime(request.receipt.uploaded_at)}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Details */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Request Details</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Category</p>
              <p className="text-sm font-medium text-gray-700 capitalize">{request.category}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Submitted</p>
              <p className="text-sm font-medium text-gray-700">{formatDateTime(request.created_at)}</p>
            </div>
          </div>
        </div>

        {request.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Additional Details</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{request.description}</p>
          </div>
        )}
      </Card>

      {/* Rejection reason */}
      {request.status === 'rejected' && request.rejection_reason && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 text-sm">Rejection Reason</p>
              <p className="text-sm text-red-700 mt-1">{request.rejection_reason}</p>
            </div>
          </div>
          <p className="text-xs text-red-600 mt-3">
            You may submit a new request after addressing the concerns raised.
          </p>
        </div>
      )}

      {/* Documents */}
      {request.documents && request.documents.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Supporting Documents</h2>
          <div className="space-y-2">
            {request.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-blue-600 hover:text-blue-700 truncate">
                  {doc.file_name}
                </span>
                <span className="ml-auto text-xs text-gray-400 capitalize flex-shrink-0">
                  {doc.type}
                </span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Receipt */}
      {request.receipt && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Payment Receipt</h2>
          <a
            href={request.receipt.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{request.receipt.file_name}</span>
          </a>
        </Card>
      )}
    </div>
  );
}
