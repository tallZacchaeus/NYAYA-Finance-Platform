<?php

namespace App\Modules\FinanceRequest\Listeners;

use App\Modules\FinanceRequest\Events\RequestStatusChanged;
use App\Modules\FinanceRequest\Models\FinanceRequest;
use App\Modules\Notification\Notifications\RequestApprovedNotification;
use App\Modules\Notification\Notifications\RequestCompletedNotification;
use App\Modules\Notification\Notifications\RequestPaidNotification;
use App\Modules\Notification\Notifications\RequestRejectedNotification;
use App\Modules\Notification\Notifications\RequestRecommendedNotification;
use App\Modules\Notification\Notifications\RequestSubmittedNotification;
use App\Modules\User\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendStatusNotification implements ShouldQueue
{
    public function handle(RequestStatusChanged $event): void
    {
        $request = $event->financeRequest->load(['requester', 'department', 'event']);

        match ($event->newStatus) {
            FinanceRequest::STATUS_SUBMITTED        => $this->notifyOnSubmitted($request, $event->actor),
            FinanceRequest::STATUS_FINANCE_REVIEWED => $this->notifyOnFinanceReviewed($request, $event->actor),
            FinanceRequest::STATUS_SATGO_APPROVED   => $request->requester->notify(new RequestApprovedNotification($request, $event->actor)),
            FinanceRequest::STATUS_FINANCE_REJECTED,
            FinanceRequest::STATUS_SATGO_REJECTED   => $request->requester->notify(new RequestRejectedNotification($request, $event->actor)),
            FinanceRequest::STATUS_PAID             => $request->requester->notify(new RequestPaidNotification($request, $event->actor)),
            FinanceRequest::STATUS_COMPLETED        => $request->requester->notify(new RequestCompletedNotification($request, $event->actor)),
            default                                 => null,
        };
    }

    private function notifyOnSubmitted(FinanceRequest $request, User $actor): void
    {
        // Confirm submission to the requester
        $request->requester->notify(new RequestSubmittedNotification($request, $actor));

        // Notify all finance admins — they perform the first-tier review
        User::role('finance_admin')
            ->each(fn (User $admin) => $admin->notify(new RequestSubmittedNotification($request, $actor)));
    }

    private function notifyOnFinanceReviewed(FinanceRequest $request, User $actor): void
    {
        // Notify the requester that their request has been reviewed and is pending SATGO
        $request->requester->notify(new RequestRecommendedNotification($request, $actor));

        // Notify super admins (SATGO) for final approval
        User::role('super_admin')
            ->each(fn (User $admin) => $admin->notify(new RequestRecommendedNotification($request, $actor)));
    }
}
