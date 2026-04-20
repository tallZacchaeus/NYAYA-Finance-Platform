<?php

namespace App\Modules\Department\Policies;

use App\Modules\Department\Models\Department;
use App\Modules\User\Models\User;

class DepartmentPolicy
{
    public function manage(User $user): bool
    {
        return $user->can('departments.manage');
    }
}
