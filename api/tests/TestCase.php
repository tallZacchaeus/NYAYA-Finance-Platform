<?php

namespace Tests;

use App\Modules\Budget\Models\Budget;
use App\Modules\Department\Models\Department;
use App\Modules\Event\Models\Event;
use App\Modules\FinanceRequest\Models\FinanceRequest;
use App\Modules\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    // -----------------------------------------------------------------------
    // User factory helpers
    // -----------------------------------------------------------------------

    protected function makeUser(string $role, array $attrs = []): User
    {
        $user = User::factory()->create(array_merge(['is_active' => true], $attrs));
        $user->assignRole($role);
        return $user;
    }

    protected function superAdmin(array $attrs = []): User
    {
        return $this->makeUser('super_admin', $attrs);
    }

    protected function financeAdmin(array $attrs = []): User
    {
        return $this->makeUser('finance_admin', $attrs);
    }

    protected function teamLead(Department $dept): User
    {
        return $this->makeUser('team_lead', ['department_id' => $dept->id]);
    }

    protected function requester(?Department $dept = null): User
    {
        return $this->makeUser('requester', $dept ? ['department_id' => $dept->id] : []);
    }

    // -----------------------------------------------------------------------
    // Domain factory helpers
    // -----------------------------------------------------------------------

    protected function makeDepartment(array $attrs = []): Department
    {
        return Department::factory()->create($attrs);
    }

    protected function makeEvent(User $createdBy, array $attrs = []): Event
    {
        return Event::factory()->create(array_merge(['created_by' => $createdBy->id], $attrs));
    }

    protected function makeBudget(Event $event, Department $dept, int $allocatedKobo = 100_000_00): Budget
    {
        return Budget::factory()->create([
            'event_id'             => $event->id,
            'department_id'        => $dept->id,
            'allocated_amount_kobo' => $allocatedKobo,
            'spent_amount_kobo'    => 0,
        ]);
    }

    protected function makeRequest(User $requester, Department $dept, Event $event, array $attrs = []): FinanceRequest
    {
        return FinanceRequest::factory()->create(array_merge([
            'requester_id'  => $requester->id,
            'department_id' => $dept->id,
            'event_id'      => $event->id,
            'status'        => FinanceRequest::STATUS_PENDING,
        ], $attrs));
    }

    // -----------------------------------------------------------------------
    // Auth helper
    // -----------------------------------------------------------------------

    protected function actingAsUser(User $user): static
    {
        return $this->actingAs($user, 'sanctum');
    }
}
