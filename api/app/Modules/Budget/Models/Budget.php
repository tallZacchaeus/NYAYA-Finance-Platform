<?php

namespace App\Modules\Budget\Models;

use Database\Factories\BudgetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Contracts\Auditable;

class Budget extends Model implements Auditable
{
    /** @use HasFactory<BudgetFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $guarded = [];

    protected static function newFactory(): BudgetFactory
    {
        return BudgetFactory::new();
    }

    protected function casts(): array
    {
        return [
            'allocated_amount_kobo' => 'integer',
            'spent_amount_kobo' => 'integer',
            'approved_at' => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Event\Models\Event::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Department\Models\Department::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'approved_by');
    }
}
