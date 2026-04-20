<?php

namespace Tests\Feature\FinanceRequest;

use App\Modules\FinanceRequest\Models\FinanceRequest;
use Tests\TestCase;

class RejectionFlowTest extends TestCase
{
    public function test_finance_admin_can_reject_pending_request(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/reject", [
                 'reason' => 'Duplicate submission.',
             ])
             ->assertOk()
             ->assertJsonPath('data.status', 'rejected')
             ->assertJsonPath('data.rejection_reason', 'Duplicate submission.');

        $fresh = $request->fresh();
        $this->assertEquals('rejected', $fresh->status);
        $this->assertEquals('Duplicate submission.', $fresh->rejection_reason);
        $this->assertNotNull($fresh->rejected_at);
        $this->assertEquals($admin->id, $fresh->rejected_by);
    }

    public function test_finance_admin_can_reject_recommended_request(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event, [
            'status' => FinanceRequest::STATUS_RECOMMENDED,
        ]);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/reject", [
                 'reason' => 'Budget not available this quarter.',
             ])
             ->assertOk()
             ->assertJsonPath('data.status', 'rejected');
    }

    public function test_rejection_requires_a_reason(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/reject", [])
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['reason']);
    }

    public function test_cannot_reject_already_approved_request(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event, [
            'status' => FinanceRequest::STATUS_APPROVED,
        ]);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/reject", [
                 'reason' => 'Changed my mind.',
             ])
             ->assertUnprocessable();

        $this->assertEquals('approved', $request->fresh()->status);
    }

    public function test_requester_cannot_reject_a_request(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event);

        $this->actingAsUser($user)
             ->postJson("/api/requests/{$request->id}/reject", [
                 'reason' => 'I want to cancel.',
             ])
             ->assertForbidden();
    }
}
