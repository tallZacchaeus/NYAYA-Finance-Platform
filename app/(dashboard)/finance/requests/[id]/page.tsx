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
  AlertCircle,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { Request } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/requests/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function FinanceRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recommendation form state
  const [action, setAction] = useState<'recommended' | 'not_recommended' | null>(null);
  const [comment, setComment] = useState('');

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) throw new Error('Failed to load');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) { toast.error('Please select an action'); return; }
    if (comment.trim().length < 10) { toast.error('Comment must be at least 10 characters'); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${id}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: comment.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to submit recommendation');
      }
      toast.success(action === 'recommended' ? 'Recommended for approval' : 'Marked as not recommended');
      fetchRequest();
      setAction(null);
      setComment('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit recommendation');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Link href="/finance" className="text-blue-600 text-sm mt-2 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  const alreadyReviewed = request.status !== 'pending';

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <Link
        href="/finance"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{request.purpose}</h1>
          <p className="text-gray-400 text-sm mt-0.5">Request #{request.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <StatusBadge status={request.status} className="self-start sm:self-auto" />
      </div>

      {/* Amount */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <p className="text-sm font-medium text-blue-600 mb-1">Requested Amount</p>
        <p className="text-4xl font-bold text-gray-900">{formatCurrency(request.amount)}</p>
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
          {request.user && (
            <div className="flex items-start gap-3">
              <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Requester</p>
                <p className="text-sm font-medium text-gray-700">{request.user.name}</p>
                {request.user.department && (
                  <p className="text-xs text-gray-400">{request.user.department}</p>
                )}
              </div>
            </div>
          )}
        </div>
        {request.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Additional Details</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{request.description}</p>
          </div>
        )}
      </Card>

      {/* Supporting documents */}
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
                <span className="text-sm text-blue-600 truncate">{doc.file_name}</span>
                <span className="ml-auto text-xs text-gray-400 capitalize flex-shrink-0">{doc.type}</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendation action or already-reviewed state */}
      {alreadyReviewed ? (
        <Card>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${request.recommendation_status === 'recommended' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {request.recommendation_status === 'recommended'
                ? <CheckCircle className="w-5 h-5" />
                : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {request.recommendation_status === 'recommended' ? 'You recommended this for approval' : 'You did not recommend this request'}
              </p>
              {request.recommendation_comment && (
                <p className="text-sm text-gray-600 mt-1 italic">"{request.recommendation_comment}"</p>
              )}
              {request.recommended_at && (
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(request.recommended_at)}</p>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            Your Recommendation
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Action choice */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction('recommended')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  action === 'recommended'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Recommend
              </button>
              <button
                type="button"
                onClick={() => setAction('not_recommended')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  action === 'not_recommended'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Not Recommend
              </button>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment <span className="text-gray-400 font-normal">(required)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Provide your reasoning for this recommendation..."
                rows={4}
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{comment.length}/1000</p>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!action || comment.trim().length < 10}
              className="w-full"
            >
              Submit Recommendation
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
