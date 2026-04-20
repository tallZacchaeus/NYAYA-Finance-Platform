<?php

namespace App\Modules\FinanceRequest\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FinanceRequestDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id'              => $this->id,
            'reference'       => $this->reference,
            'title'           => $this->title,
            'description'     => $this->description,
            'amount'          => $this->amount_kobo / 100,
            'amount_kobo'     => $this->amount_kobo,
            'unit_cost'       => $this->unit_cost_kobo / 100,
            'unit_cost_kobo'  => $this->unit_cost_kobo,
            'quantity'        => $this->quantity,
            'status'          => $this->status,

            'total_paid'      => ($this->total_paid_kobo ?? 0) / 100,
            'total_paid_kobo' => $this->total_paid_kobo ?? 0,
            'fully_paid_at'   => $this->fully_paid_at?->toIso8601String(),

            'total_receipted'      => ($this->total_receipted_kobo ?? 0) / 100,
            'total_receipted_kobo' => $this->total_receipted_kobo ?? 0,
            'variance'             => ($this->variance_kobo ?? 0) / 100,
            'variance_kobo'        => $this->variance_kobo ?? 0,

            'refund_amount'        => ($this->refund_amount_kobo ?? 0) / 100,
            'refund_amount_kobo'   => $this->refund_amount_kobo ?? 0,
            'refund_completed_at'  => $this->refund_completed_at?->toIso8601String(),

            'approval_expires_at'  => $this->approval_expires_at?->toIso8601String(),

            'request_type'    => $this->whenLoaded('requestType', fn () => $this->requestType ? [
                'id'   => $this->requestType->id,
                'name' => $this->requestType->name,
                'slug' => $this->requestType->slug,
            ] : null),
            'department'      => $this->whenLoaded('department', fn () => [
                'id'   => $this->department->id,
                'name' => $this->department->name,
            ]),
            'event'           => $this->whenLoaded('event', fn () => [
                'id'   => $this->event->id,
                'name' => $this->event->name,
            ]),
            'requester'       => $this->whenLoaded('requester', fn () => [
                'id'    => $this->requester->id,
                'name'  => $this->requester->name,
                'email' => $this->requester->email,
            ]),

            // Finance review
            'finance_reviewed_by' => $this->whenLoaded('financeReviewedBy', fn () => $this->financeReviewedBy
                ? ['id' => $this->financeReviewedBy->id, 'name' => $this->financeReviewedBy->name]
                : null),
            'finance_reviewed_at' => $this->finance_reviewed_at?->toIso8601String(),

            // SATGO approval
            'satgo_approved_by'   => $this->whenLoaded('satgoApprovedBy', fn () => $this->satgoApprovedBy
                ? ['id' => $this->satgoApprovedBy->id, 'name' => $this->satgoApprovedBy->name]
                : null),
            'satgo_approved_at'   => $this->satgo_approved_at?->toIso8601String(),

            // Rejection
            'rejected_by'         => $this->whenLoaded('rejectedBy', fn () => $this->rejectedBy
                ? ['id' => $this->rejectedBy->id, 'name' => $this->rejectedBy->name]
                : null),
            'rejected_at'         => $this->rejected_at?->toIso8601String(),
            'rejection_reason'    => $this->rejection_reason,
            'rejection_category'  => $this->rejection_category,

            // Payment confirmed by
            'paid_confirmed_by'   => $this->whenLoaded('paidConfirmedBy', fn () => $this->paidConfirmedBy
                ? ['id' => $this->paidConfirmedBy->id, 'name' => $this->paidConfirmedBy->name]
                : null),

            // Receipted by
            'receipted_by'        => $this->whenLoaded('receiptedBy', fn () => $this->receiptedBy
                ? ['id' => $this->receiptedBy->id, 'name' => $this->receiptedBy->name]
                : null),
            'receipted_at'        => $this->receipted_at?->toIso8601String(),

            // Completed by
            'completed_by'        => $this->whenLoaded('completedBy', fn () => $this->completedBy
                ? ['id' => $this->completedBy->id, 'name' => $this->completedBy->name]
                : null),
            'completed_at'        => $this->completed_at?->toIso8601String(),

            'documents'   => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($doc) => [
                'id'          => $doc->id,
                'file_name'   => $doc->file_name,
                'file_type'   => $doc->file_type,
                'file_size'   => $doc->file_size,
                'url'         => asset('storage/' . $doc->file_path),
                'uploaded_at' => $doc->created_at?->toIso8601String(),
            ])),

            'receipts'    => $this->whenLoaded('receipts', fn () => $this->receipts->map(fn ($rec) => [
                'id'          => $rec->id,
                'file_name'   => $rec->file_name,
                'file_type'   => $rec->file_type,
                'amount'      => $rec->amount_kobo / 100,
                'amount_kobo' => $rec->amount_kobo,
                'notes'       => $rec->notes,
                'url'         => asset('storage/' . $rec->file_path),
                'uploaded_at' => $rec->created_at?->toIso8601String(),
            ])),

            'payments'    => $this->whenLoaded('payments', fn () => $this->payments->map(fn ($pay) => [
                'id'                => $pay->id,
                'amount'            => $pay->amount_kobo / 100,
                'amount_kobo'       => $pay->amount_kobo,
                'payment_method'    => $pay->payment_method,
                'payment_reference' => $pay->payment_reference,
                'payment_date'      => $pay->payment_date?->toIso8601String(),
                'notes'             => $pay->notes,
            ])),

            'review_notes' => $this->whenLoaded('reviewNotes', fn () => $this->reviewNotes->map(fn ($note) => [
                'id'         => $note->id,
                'action'     => $note->action,
                'notes'      => $note->notes,
                'created_by' => $note->user ? ['id' => $note->user->id, 'name' => $note->user->name] : null,
                'created_at' => $note->created_at?->toIso8601String(),
            ])),

            // What the authenticated user can do on this request
            'can'         => [
                'finance_review'  => $user?->can('financeReview', $this->resource),
                'finance_reject'  => $user?->can('financeReject', $this->resource),
                'satgo_approve'   => $user?->can('satgoApprove', $this->resource),
                'satgo_reject'    => $user?->can('satgoReject', $this->resource),
                'record_payment'  => $user?->can('recordPayment', $this->resource),
                'upload_receipt'  => $user?->can('uploadReceipt', $this->resource),
                'update'          => $user?->can('update', $this->resource),
                'delete'          => $user?->can('delete', $this->resource),
            ],

            'created_at'  => $this->created_at?->toIso8601String(),
            'updated_at'  => $this->updated_at?->toIso8601String(),
        ];
    }
}
