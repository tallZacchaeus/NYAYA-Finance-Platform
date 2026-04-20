<?php

namespace App\Modules\FinanceRequest\Policies;

use App\Modules\FinanceRequest\Models\FinanceRequest;
use App\Modules\User\Models\User;

class FinanceRequestPolicy
{
    public function view(User $user, FinanceRequest $request): bool
    {
        if ($user->can('finance-requests.view-all')) return true;
        if ($user->can('finance-requests.view-department') && $user->department_id === $request->department_id) return true;
        if ($user->can('finance-requests.view-own') && $user->id === $request->requester_id) return true;
        return false;
    }

    public function update(User $user, FinanceRequest $request): bool
    {
        return $user->can('finance-requests.update')
            && $request->status === FinanceRequest::STATUS_SUBMITTED;
    }

    public function delete(User $user, FinanceRequest $request): bool
    {
        return $user->can('finance-requests.delete')
            && $request->status === FinanceRequest::STATUS_SUBMITTED;
    }

    public function financeReview(User $user): bool
    {
        return $user->can('finance-requests.finance-review');
    }

    public function financeReject(User $user): bool
    {
        return $user->can('finance-requests.finance-reject');
    }

    public function satgoApprove(User $user): bool
    {
        return $user->can('finance-requests.satgo-approve');
    }

    public function satgoReject(User $user): bool
    {
        return $user->can('finance-requests.satgo-reject');
    }

    public function recordPayment(User $user): bool
    {
        return $user->can('finance-requests.record-payment');
    }

    public function uploadReceipt(User $user): bool
    {
        return $user->can('finance-requests.upload-receipt');
    }
}
