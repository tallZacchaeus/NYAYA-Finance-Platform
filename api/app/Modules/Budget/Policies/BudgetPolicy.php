<?php

namespace App\Modules\Budget\Policies;

use App\Modules\Budget\Models\Budget;
use App\Modules\User\Models\User;

class BudgetPolicy
{
    public function create(User $user): bool
    {
        return $user->can('budgets.create');
    }

    public function approve(User $user): bool
    {
        return $user->can('budgets.approve');
    }

    public function import(User $user): bool
    {
        return $user->can('budgets.import');
    }
}
