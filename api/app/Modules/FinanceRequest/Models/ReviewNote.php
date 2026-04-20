<?php

namespace App\Modules\FinanceRequest\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ReviewNote extends Model
{
    protected $guarded = [];

    public const ACTIONS = [
        'lead_approve',
        'lead_reject',
        'lead_revision_request',
        'finance_review',
        'finance_reject',
        'satgo_approve',
        'satgo_reject',
        'payment_recorded',
        'receipt_uploaded',
        'refund_confirmed',
    ];

    public function noteable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class);
    }
}
