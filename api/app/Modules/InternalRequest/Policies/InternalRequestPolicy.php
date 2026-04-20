<?php

namespace App\Modules\InternalRequest\Policies;

use App\Modules\InternalRequest\Models\InternalRequest;
use App\Modules\User\Models\User;

class InternalRequestPolicy
{
    public function view(User $user, InternalRequest $request): bool
    {
        if ($user->can('internal-requests.view-all')) return true;
        if ($user->can('internal-requests.view-department') && $user->department_id === $request->department_id) return true;
        if ($user->can('internal-requests.view-own') && $user->id === $request->requester_id) return true;
        return false;
    }

    public function update(User $user, InternalRequest $request): bool
    {
        return $user->id === $request->requester_id
            && in_array($request->status, [InternalRequest::STATUS_DRAFT, InternalRequest::STATUS_NEEDS_REVISION]);
    }

    public function submit(User $user, InternalRequest $request): bool
    {
        return $user->id === $request->requester_id
            && in_array($request->status, [InternalRequest::STATUS_DRAFT, InternalRequest::STATUS_NEEDS_REVISION]);
    }

    public function review(User $user, InternalRequest $request): bool
    {
        return $user->can('internal-requests.review')
            && $user->department_id === $request->department_id
            && $request->status === InternalRequest::STATUS_SUBMITTED;
    }

    public function delete(User $user, InternalRequest $request): bool
    {
        return $user->id === $request->requester_id
            && in_array($request->status, [InternalRequest::STATUS_DRAFT, InternalRequest::STATUS_NEEDS_REVISION]);
    }
}
