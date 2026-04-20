<?php

namespace App\Modules\FinanceRequest\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'amount_kobo'  => 'integer',
            'payment_date' => 'date',
        ];
    }

    public function financeRequest(): BelongsTo
    {
        return $this->belongsTo(FinanceRequest::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'recorded_by');
    }

    public function getAmountAttribute(): float
    {
        return $this->amount_kobo / 100;
    }
}
