<?php

namespace App\Modules\Budget\Services;

use App\Modules\Budget\Models\Budget;
use App\Modules\Department\Models\Department;
use App\Modules\Event\Models\Event;
use App\Modules\FinanceRequest\Models\FinanceRequest;
use Illuminate\Support\Collection;

class BudgetService
{
    public function allocate(Event $event, Department $department, int $amountKobo): Budget
    {
        return Budget::updateOrCreate(
            ['event_id' => $event->id, 'department_id' => $department->id],
            ['allocated_amount_kobo' => $amountKobo]
        );
    }

    public function getRemainingBudget(Budget $budget): int
    {
        return $budget->allocated_amount_kobo - $budget->spent_amount_kobo;
    }

    public function canApprove(FinanceRequest $request): bool
    {
        $budget = Budget::where('event_id', $request->event_id)
            ->where('department_id', $request->department_id)
            ->first();

        if (! $budget) {
            return false;
        }

        return $this->getRemainingBudget($budget) >= $request->amount_kobo;
    }

    public function recordSpend(Budget $budget, int $amountKobo): void
    {
        // Atomic increment to prevent race conditions
        Budget::where('id', $budget->id)
            ->increment('spent_amount_kobo', $amountKobo);
    }

    public function getSummary(Event $event): Collection
    {
        return Budget::with('department')
            ->where('event_id', $event->id)
            ->get()
            ->map(function (Budget $budget) {
                $remaining = $budget->allocated_amount_kobo - $budget->spent_amount_kobo;
                return [
                    'department'     => $budget->department,
                    'allocated_kobo' => $budget->allocated_amount_kobo,
                    'spent_kobo'     => $budget->spent_amount_kobo,
                    'remaining_kobo' => $remaining,
                    'percentage_used' => $budget->allocated_amount_kobo > 0
                        ? round(($budget->spent_amount_kobo / $budget->allocated_amount_kobo) * 100, 2)
                        : 0,
                    'status'         => $budget->status,
                ];
            });
    }
}
