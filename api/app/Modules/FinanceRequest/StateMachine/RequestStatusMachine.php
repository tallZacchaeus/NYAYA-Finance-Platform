<?php

namespace App\Modules\FinanceRequest\StateMachine;

use App\Modules\FinanceRequest\Events\RequestStatusChanged;
use App\Modules\FinanceRequest\Models\FinanceRequest;
use App\Modules\User\Models\User;
use Illuminate\Validation\ValidationException;

class RequestStatusMachine
{
    /**
     * Valid transitions: current_status => [allowed_next_statuses]
     */
    const ALLOWED_TRANSITIONS = [
        FinanceRequest::STATUS_SUBMITTED        => [FinanceRequest::STATUS_FINANCE_REVIEWED, FinanceRequest::STATUS_FINANCE_REJECTED],
        FinanceRequest::STATUS_FINANCE_REVIEWED => [FinanceRequest::STATUS_SATGO_APPROVED,   FinanceRequest::STATUS_SATGO_REJECTED],
        FinanceRequest::STATUS_SATGO_APPROVED   => [FinanceRequest::STATUS_PARTIAL_PAYMENT,  FinanceRequest::STATUS_PAID],
        FinanceRequest::STATUS_PARTIAL_PAYMENT  => [FinanceRequest::STATUS_PAID],
        FinanceRequest::STATUS_PAID             => [FinanceRequest::STATUS_RECEIPTED],
        FinanceRequest::STATUS_RECEIPTED        => [FinanceRequest::STATUS_REFUND_PENDING,   FinanceRequest::STATUS_COMPLETED],
        FinanceRequest::STATUS_REFUND_PENDING   => [FinanceRequest::STATUS_REFUND_COMPLETED],
        FinanceRequest::STATUS_REFUND_COMPLETED => [FinanceRequest::STATUS_COMPLETED],
    ];

    /**
     * Permission required for each destination status.
     */
    const TRANSITION_PERMISSIONS = [
        FinanceRequest::STATUS_FINANCE_REVIEWED => 'finance-requests.finance-review',
        FinanceRequest::STATUS_FINANCE_REJECTED => 'finance-requests.finance-reject',
        FinanceRequest::STATUS_SATGO_APPROVED   => 'finance-requests.satgo-approve',
        FinanceRequest::STATUS_SATGO_REJECTED   => 'finance-requests.satgo-reject',
        FinanceRequest::STATUS_PARTIAL_PAYMENT  => 'finance-requests.record-payment',
        FinanceRequest::STATUS_PAID             => 'finance-requests.record-payment',
        FinanceRequest::STATUS_RECEIPTED        => 'finance-requests.upload-receipt',
        FinanceRequest::STATUS_REFUND_PENDING   => 'finance-requests.upload-receipt',
        FinanceRequest::STATUS_REFUND_COMPLETED => 'finance-requests.upload-receipt',
        FinanceRequest::STATUS_COMPLETED        => 'finance-requests.upload-receipt',
    ];

    public function transition(FinanceRequest $request, string $newStatus, User $actor, array $extra = []): FinanceRequest
    {
        $currentStatus = $request->status;

        $allowed = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];
        if (! in_array($newStatus, $allowed)) {
            throw ValidationException::withMessages([
                'status' => "Cannot transition from '{$currentStatus}' to '{$newStatus}'.",
            ]);
        }

        $requiredPermission = self::TRANSITION_PERMISSIONS[$newStatus] ?? null;
        if ($requiredPermission && ! $actor->can($requiredPermission)) {
            abort(403, 'You do not have permission to perform this action.');
        }

        $updates = ['status' => $newStatus];

        match ($newStatus) {
            FinanceRequest::STATUS_FINANCE_REVIEWED => $updates += ['finance_reviewed_by' => $actor->id, 'finance_reviewed_at' => now()],
            FinanceRequest::STATUS_SATGO_APPROVED   => $updates += ['satgo_approved_by' => $actor->id, 'satgo_approved_at' => now()],
            FinanceRequest::STATUS_SATGO_REJECTED,
            FinanceRequest::STATUS_FINANCE_REJECTED => $updates += ['rejected_by' => $actor->id, 'rejected_at' => now()],
            FinanceRequest::STATUS_RECEIPTED        => $updates += ['receipted_by' => $actor->id, 'receipted_at' => now()],
            FinanceRequest::STATUS_COMPLETED        => $updates += ['completed_by' => $actor->id, 'completed_at' => now()],
            default                                 => null,
        };

        $request->update(array_merge($updates, $extra));

        RequestStatusChanged::dispatch($request, $currentStatus, $newStatus, $actor);

        return $request->fresh();
    }
}
