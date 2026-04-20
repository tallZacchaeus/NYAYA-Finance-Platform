<?php

namespace Tests\Feature\Budget;

use App\Modules\FinanceRequest\Models\FinanceRequest;
use Tests\TestCase;

class BudgetEnforcementTest extends TestCase
{
    public function test_approval_fails_when_request_exceeds_budget(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $user    = $this->requester($dept);

        // Budget: ₦50,000 only
        $this->makeBudget($event, $dept, 50_000_00);

        // Request: ₦100,000 — exceeds budget
        $request = $this->makeRequest($user, $dept, $event, [
            'status'      => FinanceRequest::STATUS_RECOMMENDED,
            'amount_kobo' => 100_000_00,
        ]);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/approve")
             ->assertUnprocessable()
             ->assertJsonPath('success', false);

        $this->assertEquals(FinanceRequest::STATUS_RECOMMENDED, $request->fresh()->status);
    }

    public function test_approval_succeeds_when_within_budget(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $user    = $this->requester($dept);

        // Budget: ₦500,000
        $this->makeBudget($event, $dept, 500_000_00);

        // Request: ₦100,000 — well within budget
        $request = $this->makeRequest($user, $dept, $event, [
            'status'      => FinanceRequest::STATUS_RECOMMENDED,
            'amount_kobo' => 100_000_00,
        ]);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/approve")
             ->assertOk()
             ->assertJsonPath('data.status', 'approved');
    }

    public function test_approval_fails_when_no_budget_exists_for_department(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $user    = $this->requester($dept);

        // No budget allocated
        $request = $this->makeRequest($user, $dept, $event, [
            'status'      => FinanceRequest::STATUS_RECOMMENDED,
            'amount_kobo' => 10_000_00,
        ]);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/approve")
             ->assertUnprocessable();
    }

    public function test_cumulative_spending_respected_across_multiple_approvals(): void
    {
        $admin  = $this->superAdmin();
        $dept   = $this->makeDepartment();
        $event  = $this->makeEvent($admin);
        $budget = $this->makeBudget($event, $dept, 200_000_00); // ₦200,000 total
        $user   = $this->requester($dept);

        // First request: ₦150,000 — approve and pay
        $r1 = $this->makeRequest($user, $dept, $event, [
            'status'      => FinanceRequest::STATUS_APPROVED,
            'amount_kobo' => 150_000_00,
        ]);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$r1->id}/mark-paid")
             ->assertOk();

        // Confirm spend recorded
        $this->assertEquals(150_000_00, $budget->fresh()->spent_amount_kobo);

        // Second request: ₦100,000 — should fail (only ₦50,000 remaining)
        $r2 = $this->makeRequest($user, $dept, $event, [
            'status'      => FinanceRequest::STATUS_RECOMMENDED,
            'amount_kobo' => 100_000_00,
        ]);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$r2->id}/approve")
             ->assertUnprocessable();
    }
}
