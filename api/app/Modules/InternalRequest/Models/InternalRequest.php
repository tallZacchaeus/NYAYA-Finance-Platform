<?php

namespace App\Modules\InternalRequest\Models;

use App\Modules\FinanceRequest\Models\ReviewNote;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InternalRequest extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    public const STATUS_DRAFT          = 'draft';
    public const STATUS_SUBMITTED      = 'submitted';
    public const STATUS_APPROVED       = 'approved';
    public const STATUS_NEEDS_REVISION = 'needs_revision';
    public const STATUS_REJECTED       = 'rejected';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_SUBMITTED,
        self::STATUS_APPROVED,
        self::STATUS_NEEDS_REVISION,
        self::STATUS_REJECTED,
    ];

    protected function casts(): array
    {
        return [
            'amount_kobo'      => 'integer',
            'unit_cost_kobo'   => 'integer',
            'reviewed_at'      => 'datetime',
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

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'reviewed_by');
    }

    public function financeRequest(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\FinanceRequest\Models\FinanceRequest::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(\App\Modules\FinanceRequest\Models\RequestDocument::class);
    }

    public function reviewNotes(): MorphMany
    {
        return $this->morphMany(ReviewNote::class, 'noteable')->orderBy('created_at');
    }

    // ── Computed helpers ───────────────────────────────────────────────────────

    public function getAmountAttribute(): float
    {
        return $this->amount_kobo / 100;
    }

    public function getUnitCostAttribute(): float
    {
        return $this->unit_cost_kobo / 100;
    }
}
