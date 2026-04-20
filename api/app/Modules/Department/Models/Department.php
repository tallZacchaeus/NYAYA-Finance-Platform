<?php

namespace App\Modules\Department\Models;

use Database\Factories\DepartmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    /** @use HasFactory<DepartmentFactory> */
    use HasFactory, SoftDeletes;

    protected $guarded = [];

    protected static function newFactory(): DepartmentFactory
    {
        return DepartmentFactory::new();
    }

    public function users(): HasMany
    {
        return $this->hasMany(\App\Modules\User\Models\User::class);
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
