<?php

namespace App\Modules\Event\Policies;

use App\Modules\Event\Models\Event;
use App\Modules\User\Models\User;

class EventPolicy
{
    public function manage(User $user): bool
    {
        return $user->can('events.manage');
    }
}
