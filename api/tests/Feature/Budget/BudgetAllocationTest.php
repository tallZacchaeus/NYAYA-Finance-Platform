<?php

namespace Tests\Feature\Budget;

use Tests\TestCase;

class BudgetAllocationTest extends TestCase
{
    public function test_finance_admin_can_allocate_budget_to_department(): void
    {
        $admin = $this->superAdmin();
        $dept  = $this->makeDepartment();
        $event = $this->makeEvent($admin);

        $this->actingAsUser($admin)
             ->postJson("/api/events/{$event->id}/budgets", [
                 'department_id'          => $dept->id,
                 'allocated_amount_kobo'  => 5_000_000_00,
                 'notes'                  => 'Initial allocation',
             ])
             ->assertCreated()
             ->assertJsonPath('success', true)
             ->assertJsonPath('data.department.id', $dept->id)
             ->assertJsonPath('data.allocated', 5_000_000);

        $this->assertDatabaseHas('budgets', [
            'event_id'             => $event->id,
            'department_id'        => $dept->id,
            'allocated_amount_kobo' => 5_000_000_00,
        ]);
    }

    public function test_requester_cannot_allocate_budget(): void
    {
        $admin = $this->superAdmin();
        $dept  = $this->makeDepartment();
        $event = $this->makeEvent($admin);
        $user  = $this->requester($dept);

        $this->actingAsUser($user)
             ->postJson("/api/events/{$event->id}/budgets", [
                 'department_id'         => $dept->id,
                 'allocated_amount_kobo' => 1_000_000_00,
             ])
             ->assertForbidden();
    }

    public function test_budget_can_be_updated(): void
    {
        $admin  = $this->superAdmin();
        $dept   = $this->makeDepartment();
        $event  = $this->makeEvent($admin);
        $budget = $this->makeBudget($event, $dept, 1_000_000_00);

        $this->actingAsUser($admin)
             ->putJson("/api/budgets/{$budget->id}", [
                 'allocated_amount_kobo' => 2_000_000_00,
             ])
             ->assertOk()
             ->assertJsonPath('data.allocated', 2_000_000);
    }

    public function test_budget_can_be_approved(): void
    {
        $admin  = $this->superAdmin();
        $dept   = $this->makeDepartment();
        $event  = $this->makeEvent($admin);
        $budget = $this->makeBudget($event, $dept);

        $this->actingAsUser($admin)
             ->postJson("/api/budgets/{$budget->id}/approve")
             ->assertOk()
             ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('budgets', [
            'id'     => $budget->id,
            'status' => 'approved',
        ]);
    }

    public function test_budgets_are_listed_per_event(): void
    {
        $admin  = $this->superAdmin();
        $dept1  = $this->makeDepartment();
        $dept2  = $this->makeDepartment();
        $event  = $this->makeEvent($admin);
        $other  = $this->makeEvent($admin);

        $b1 = $this->makeBudget($event, $dept1);
        $b2 = $this->makeBudget($event, $dept2);
        $b3 = $this->makeBudget($other, $dept1);  // different event

        $ids = $this->actingAsUser($admin)
                    ->getJson("/api/events/{$event->id}/budgets")
                    ->assertOk()
                    ->json('data.*.id');

        $this->assertContains($b1->id, $ids);
        $this->assertContains($b2->id, $ids);
        $this->assertNotContains($b3->id, $ids);
    }

    public function test_allocating_same_department_twice_updates_instead_of_duplicating(): void
    {
        $admin = $this->superAdmin();
        $dept  = $this->makeDepartment();
        $event = $this->makeEvent($admin);

        $this->actingAsUser($admin)
             ->postJson("/api/events/{$event->id}/budgets", [
                 'department_id'         => $dept->id,
                 'allocated_amount_kobo' => 1_000_000_00,
             ])
             ->assertCreated();

        $this->actingAsUser($admin)
             ->postJson("/api/events/{$event->id}/budgets", [
                 'department_id'         => $dept->id,
                 'allocated_amount_kobo' => 3_000_000_00,
             ])
             ->assertCreated();

        $this->assertDatabaseCount('budgets', 1);
        $this->assertDatabaseHas('budgets', [
            'event_id'             => $event->id,
            'department_id'        => $dept->id,
            'allocated_amount_kobo' => 3_000_000_00,
        ]);
    }
}
