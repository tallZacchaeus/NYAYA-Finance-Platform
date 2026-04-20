<?php

namespace App\Modules\RequestType\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class RequestType extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (RequestType $type) {
            if (empty($type->slug)) {
                $type->slug = Str::slug($type->name, '_');
            }
        });
    }

    public function financeRequests(): HasMany
    {
        return $this->hasMany(\App\Modules\FinanceRequest\Models\FinanceRequest::class);
    }

    public function internalRequests(): HasMany
    {
        return $this->hasMany(\App\Modules\InternalRequest\Models\InternalRequest::class);
    }
}
