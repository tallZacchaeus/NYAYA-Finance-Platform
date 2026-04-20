<?php

namespace App\Modules\FinanceRequest\Listeners;

use App\Modules\Budget\Models\Budget;
use App\Modules\Budget\Services\BudgetService;
use App\Modules\FinanceRequest\Events\RequestStatusChanged;
use App\Modules\FinanceRequest\Models\FinanceRequest;

class UpdateBudgetSpent
{
    public function __construct(private BudgetService $budgetService) {}

    public function handle(RequestStatusChanged $event): void
    {
        $financeRequest = $event->financeRequest;

        // Record spend when a request is fully paid
        if ($event->newStatus === FinanceRequest::STATUS_PAID) {
            $budget = Budget::where('event_id', $financeRequest->event_id)
                ->where('department_id', $financeRequest->department_id)
                ->first();

            if ($budget) {
                $this->budgetService->recordSpend($budget, $financeRequest->amount_kobo);
            }
        }
    }
}
