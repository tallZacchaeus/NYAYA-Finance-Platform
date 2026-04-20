<?php

namespace Tests\Feature\FinanceRequest;

use App\Modules\FinanceRequest\Models\FinanceRequest;
use Tests\TestCase;

class CreateRequestTest extends TestCase
{
    public function test_requester_can_create_a_finance_request(): void
    {
        $admin  = $this->superAdmin();
        $dept   = $this->makeDepartment();
        $event  = $this->makeEvent($admin);
        $user   = $this->requester($dept);

        $response = $this->actingAsUser($user)
                         ->postJson('/api/requests', [
                             'title'          => 'Sound system rental',
                             'unit_cost_kobo' => 50_000_00,
                             'quantity'       => 2,
                             'request_type'   => 'procurement',
                             'department_id'  => $dept->id,
                             'event_id'       => $event->id,
                         ]);

        $response->assertCreated()
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.status', 'pending')
                 ->assertJsonPath('data.amount', 100_000);

        $this->assertDatabaseHas('finance_requests', [
            'title'          => 'Sound system rental',
            'requester_id'   => $user->id,
            'department_id'  => $dept->id,
            'status'         => 'pending',
            'amount_kobo'    => 100_000_00,
        ]);
    }

    public function test_request_reference_is_auto_generated(): void
    {
        $admin = $this->superAdmin();
        $dept  = $this->makeDepartment();
        $event = $this->makeEvent($admin);
        $user  = $this->requester($dept);

        $response = $this->actingAsUser($user)
                         ->postJson('/api/requests', [
                             'title'          => 'Test request',
                             'unit_cost_kobo' => 10_000_00,
                             'quantity'       => 1,
                             'request_type'   => 'cash_disbursement',
                             'department_id'  => $dept->id,
                             'event_id'       => $event->id,
                         ]);

        $response->assertCreated();
        $this->assertMatchesRegularExpression('/^NYAYA-\d{4}-\d{5}$/', $response->json('data.reference'));
    }

    public function test_creation_validates_required_fields(): void
    {
        $user = $this->requester();

        $this->actingAsUser($user)
             ->postJson('/api/requests', [])
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['title', 'unit_cost_kobo', 'quantity', 'request_type', 'department_id', 'event_id']);
    }

    public function test_unauthenticated_user_cannot_create_request(): void
    {
        $admin = $this->superAdmin();
        $dept  = $this->makeDepartment();
        $event = $this->makeEvent($admin);

        $this->postJson('/api/requests', [
            'title'          => 'Sneaky request',
            'unit_cost_kobo' => 5_000_00,
            'quantity'       => 1,
            'request_type'   => 'procurement',
            'department_id'  => $dept->id,
            'event_id'       => $event->id,
        ])->assertUnauthorized();
    }

    public function test_request_amount_is_unit_cost_times_quantity(): void
    {
        $admin = $this->superAdmin();
        $dept  = $this->makeDepartment();
        $event = $this->makeEvent($admin);
        $user  = $this->requester($dept);

        $this->actingAsUser($user)
             ->postJson('/api/requests', [
                 'title'          => 'Chairs',
                 'unit_cost_kobo' => 20_000_00,
                 'quantity'       => 5,
                 'request_type'   => 'procurement',
                 'department_id'  => $dept->id,
                 'event_id'       => $event->id,
             ])
             ->assertCreated()
             ->assertJsonPath('data.amount', 100_000)
             ->assertJsonPath('data.unit_cost', 20_000)
             ->assertJsonPath('data.quantity', 5);
    }
}
