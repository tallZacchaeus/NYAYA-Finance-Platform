<?php

namespace Tests\Feature\FinanceRequest;

use App\Modules\FinanceRequest\Models\FinanceRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApprovalFlowTest extends TestCase
{
    /**
     * Full happy-path lifecycle:
     * pending → recommended → approved → paid → completed
     */
    public function test_full_approval_lifecycle(): void
    {
        Storage::fake('public');

        $admin    = $this->superAdmin();
        $dept     = $this->makeDepartment();
        $event    = $this->makeEvent($admin);
        $budget   = $this->makeBudget($event, $dept, 500_000_00);
        $lead     = $this->teamLead($dept);
        $user     = $this->requester($dept);
        $request  = $this->makeRequest($user, $dept, $event, ['amount_kobo' => 100_000_00]);

        // 1. Team lead recommends
        $this->actingAsUser($lead)
             ->postJson("/api/requests/{$request->id}/recommend")
             ->assertOk()
             ->assertJsonPath('data.status', 'recommended');

        // 2. Finance admin approves
        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/approve")
             ->assertOk()
             ->assertJsonPath('data.status', 'approved');

        // 3. Finance admin marks paid
        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/mark-paid")
             ->assertOk()
             ->assertJsonPath('data.status', 'paid');

        // 4. Upload receipt → completed
        $file = UploadedFile::fake()->create('receipt.pdf', 100, 'application/pdf');

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/receipt", [
                 'file'              => $file,
                 'amount_paid_kobo'  => 100_000_00,
                 'payment_notes'     => 'Payment confirmed',
             ])
             ->assertOk()
             ->assertJsonPath('data.status', 'completed');

        // Verify timestamps and actors are persisted
        $fresh = $request->fresh();
        $this->assertNotNull($fresh->recommended_at);
        $this->assertNotNull($fresh->approved_at);
        $this->assertNotNull($fresh->paid_at);
        $this->assertNotNull($fresh->completed_at);
        $this->assertEquals($lead->id, $fresh->recommended_by);
        $this->assertEquals($admin->id, $fresh->approved_by);
    }

    public function test_team_lead_can_recommend_pending_request(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $lead    = $this->teamLead($dept);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event);

        $this->actingAsUser($lead)
             ->postJson("/api/requests/{$request->id}/recommend")
             ->assertOk()
             ->assertJsonPath('data.status', 'recommended')
             ->assertJsonPath('data.recommended_by.id', $lead->id);
    }

    public function test_team_lead_from_different_department_cannot_recommend(): void
    {
        $admin    = $this->superAdmin();
        $dept1    = $this->makeDepartment();
        $dept2    = $this->makeDepartment();
        $event    = $this->makeEvent($admin);
        $lead     = $this->teamLead($dept2);  // wrong department
        $user     = $this->requester($dept1);
        $request  = $this->makeRequest($user, $dept1, $event);

        $this->actingAsUser($lead)
             ->postJson("/api/requests/{$request->id}/recommend")
             ->assertUnprocessable();

        $this->assertEquals('pending', $request->fresh()->status);
    }

    public function test_finance_admin_can_approve_recommended_request(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $this->makeBudget($event, $dept, 500_000_00);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event, [
            'status'      => FinanceRequest::STATUS_RECOMMENDED,
            'amount_kobo' => 100_000_00,
        ]);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/approve")
             ->assertOk()
             ->assertJsonPath('data.status', 'approved');
    }

    public function test_cannot_skip_recommendation_step(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $this->makeBudget($event, $dept, 500_000_00);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event); // still pending

        // Try to approve while still pending — should fail
        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/approve")
             ->assertUnprocessable();

        $this->assertEquals('pending', $request->fresh()->status);
    }

    public function test_requester_cannot_approve_their_own_request(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $this->makeBudget($event, $dept, 500_000_00);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event, [
            'status' => FinanceRequest::STATUS_RECOMMENDED,
        ]);

        $this->actingAsUser($user)
             ->postJson("/api/requests/{$request->id}/approve")
             ->assertForbidden();
    }

    public function test_budget_spent_increases_after_payment(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event   = $this->makeEvent($admin);
        $budget  = $this->makeBudget($event, $dept, 500_000_00);
        $user    = $this->requester($dept);
        $request = $this->makeRequest($user, $dept, $event, [
            'status'      => FinanceRequest::STATUS_APPROVED,
            'amount_kobo' => 100_000_00,
        ]);

        $this->actingAsUser($admin)
             ->postJson("/api/requests/{$request->id}/mark-paid")
             ->assertOk();

        $this->assertEquals(100_000_00, $budget->fresh()->spent_amount_kobo);
    }
}
