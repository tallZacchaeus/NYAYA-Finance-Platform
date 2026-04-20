<?php

namespace App\Modules\FinanceRequest\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;

class FinanceRequest extends Model implements Auditable
{
    use SoftDeletes;
    use \OwenIt\Auditing\Auditable;

    protected $guarded = [];

    // ── Status constants ───────────────────────────────────────────────────────
    public const STATUS_SUBMITTED        = 'submitted';
    public const STATUS_FINANCE_REVIEWED = 'finance_reviewed';
    public const STATUS_FINANCE_REJECTED = 'finance_rejected';
    public const STATUS_SATGO_APPROVED   = 'satgo_approved';
    public const STATUS_SATGO_REJECTED   = 'satgo_rejected';
    public const STATUS_APPROVAL_EXPIRED = 'approval_expired';
    public const STATUS_PARTIAL_PAYMENT  = 'partial_payment';
    public const STATUS_PAID             = 'paid';
    public const STATUS_RECEIPTED        = 'receipted';
    public const STATUS_REFUND_PENDING   = 'refund_pending';
    public const STATUS_REFUND_COMPLETED = 'refund_completed';
    public const STATUS_COMPLETED        = 'completed';

    public const STATUSES = [
        self::STATUS_SUBMITTED,
        self::STATUS_FINANCE_REVIEWED,
        self::STATUS_FINANCE_REJECTED,
        self::STATUS_SATGO_APPROVED,
        self::STATUS_SATGO_REJECTED,
        self::STATUS_APPROVAL_EXPIRED,
        self::STATUS_PARTIAL_PAYMENT,
        self::STATUS_PAID,
        self::STATUS_RECEIPTED,
        self::STATUS_REFUND_PENDING,
        self::STATUS_REFUND_COMPLETED,
        self::STATUS_COMPLETED,
    ];

    // ── Casts ──────────────────────────────────────────────────────────────────
    protected function casts(): array
    {
        return [
            'amount_kobo'           => 'integer',
            'unit_cost_kobo'        => 'integer',
            'total_paid_kobo'       => 'integer',
            'total_receipted_kobo'  => 'integer',
            'variance_kobo'         => 'integer',
            'refund_amount_kobo'    => 'integer',
            'finance_reviewed_at'   => 'datetime',
            'satgo_approved_at'     => 'datetime',
            'approval_expires_at'   => 'datetime',
            'rejected_at'           => 'datetime',
            'fully_paid_at'         => 'datetime',
            'receipted_at'          => 'datetime',
            'refund_completed_at'   => 'datetime',
            'completed_at'          => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────────
    public function requester(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'requester_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Department\Models\Department::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Event\Models\Event::class);
    }

    public function requestType(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\RequestType\Models\RequestType::class);
    }

    public function financeReviewedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'finance_reviewed_by');
    }

    public function satgoApprovedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'satgo_approved_by');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'rejected_by');
    }

    public function paidConfirmedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'paid_confirmed_by');
    }

    public function receiptedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'receipted_by');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'completed_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(RequestDocument::class);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function reviewNotes(): MorphMany
    {
        return $this->morphMany(ReviewNote::class, 'noteable')->orderBy('created_at');
    }

    public function internalRequests(): HasMany
    {
        return $this->hasMany(\App\Modules\InternalRequest\Models\InternalRequest::class);
    }

    // ── Computed helpers ───────────────────────────────────────────────────────

    /** Amount in naira */
    public function getAmountAttribute(): float
    {
        return $this->amount_kobo / 100;
    }

    /** Unit cost in naira */
    public function getUnitCostAttribute(): float
    {
        return $this->unit_cost_kobo / 100;
    }

    /** Total paid in naira */
    public function getTotalPaidAttribute(): float
    {
        return $this->total_paid_kobo / 100;
    }

    /** Total receipted in naira */
    public function getTotalReceiptedAttribute(): float
    {
        return $this->total_receipted_kobo / 100;
    }

    /** Variance in naira */
    public function getVarianceAttribute(): float
    {
        return $this->variance_kobo / 100;
    }

    /** Refund amount in naira */
    public function getRefundAmountAttribute(): float
    {
        return $this->refund_amount_kobo / 100;
    }

    /** Refresh total_paid_kobo from the payments table */
    public function recalculateTotalPaid(): void
    {
        $total = $this->payments()->sum('amount_kobo');
        $this->total_paid_kobo = $total;

        if ($total >= $this->amount_kobo && $this->status === self::STATUS_PARTIAL_PAYMENT) {
            $this->status = self::STATUS_PAID;
            $this->fully_paid_at = now();
        } elseif ($total > 0 && $total < $this->amount_kobo && $this->status === self::STATUS_SATGO_APPROVED) {
            $this->status = self::STATUS_PARTIAL_PAYMENT;
        }

        $this->save();
    }
}
