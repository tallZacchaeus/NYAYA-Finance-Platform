<?php

namespace App\Modules\FinanceRequest\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Receipt extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'amount_kobo' => 'integer',
            'file_size'   => 'integer',
        ];
    }

    public function financeRequest(): BelongsTo
    {
        return $this->belongsTo(FinanceRequest::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'uploaded_by');
    }

    public function getAmountAttribute(): float
    {
        return $this->amount_kobo / 100;
    }
}
