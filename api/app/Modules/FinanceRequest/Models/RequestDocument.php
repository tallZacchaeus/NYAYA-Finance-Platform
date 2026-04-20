<?php

namespace App\Modules\FinanceRequest\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestDocument extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    public function financeRequest(): BelongsTo
    {
        return $this->belongsTo(FinanceRequest::class);
    }

    public function internalRequest(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\InternalRequest\Models\InternalRequest::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }
}
