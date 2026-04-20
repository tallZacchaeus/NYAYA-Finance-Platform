<?php

namespace App\Modules\Event\Models;

use Database\Factories\EventFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    /** @use HasFactory<EventFactory> */
    use HasFactory, SoftDeletes;

    protected $guarded = [];

    protected static function newFactory(): EventFactory
    {
        return EventFactory::new();
    }

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'total_budget_kobo' => 'integer',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'created_by');
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(\App\Modules\Budget\Models\Budget::class);
    }

    public function financeRequests(): HasMany
    {
        return $this->hasMany(\App\Modules\FinanceRequest\Models\FinanceRequest::class);
    }
}
