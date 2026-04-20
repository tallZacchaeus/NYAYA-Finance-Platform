<?php

namespace Tests\Feature\FinanceRequest;

use Tests\TestCase;

class RequestFilteringTest extends TestCase
{
    public function test_requester_sees_only_own_requests(): void
    {
        $admin    = $this->superAdmin();
        $dept     = $this->makeDepartment();
        $event    = $this->makeEvent($admin);
        $userA    = $this->requester($dept);
        $userB    = $this->requester($dept);

        $mine  = $this->makeRequest($userA, $dept, $event);
        $other = $this->makeRequest($userB, $dept, $event);

        $ids = $this->actingAsUser($userA)
                    ->getJson('/api/requests')
                    ->assertOk()
                    ->json('data.*.id');

        $this->assertContains($mine->id, $ids);
        $this->assertNotContains($other->id, $ids);
    }

    public function test_team_lead_sees_all_department_requests(): void
    {
        $admin    = $this->superAdmin();
        $dept1    = $this->makeDepartment();
        $dept2    = $this->makeDepartment();
        $event    = $this->makeEvent($admin);
        $lead     = $this->teamLead($dept1);

        $inDept    = $this->makeRequest($this->requester($dept1), $dept1, $event);
        $outOfDept = $this->makeRequest($this->requester($dept2), $dept2, $event);

        $ids = $this->actingAsUser($lead)
                    ->getJson('/api/requests')
                    ->assertOk()
                    ->json('data.*.id');

        $this->assertContains($inDept->id, $ids);
        $this->assertNotContains($outOfDept->id, $ids);
    }

    public function test_finance_admin_sees_all_requests(): void
    {
        $admin  = $this->superAdmin();
        $dept1  = $this->makeDepartment();
        $dept2  = $this->makeDepartment();
        $event  = $this->makeEvent($admin);
        $fa     = $this->financeAdmin();

        $r1 = $this->makeRequest($this->requester($dept1), $dept1, $event);
        $r2 = $this->makeRequest($this->requester($dept2), $dept2, $event);

        $ids = $this->actingAsUser($fa)
                    ->getJson('/api/requests')
                    ->assertOk()
                    ->json('data.*.id');

        $this->assertContains($r1->id, $ids);
        $this->assertContains($r2->id, $ids);
    }

    public function test_can_filter_requests_by_status(): void
    {
        $admin    = $this->superAdmin();
        $dept     = $this->makeDepartment();
        $event    = $this->makeEvent($admin);

        $pending  = $this->makeRequest($this->requester($dept), $dept, $event, ['status' => 'pending']);
        $approved = $this->makeRequest($this->requester($dept), $dept, $event, ['status' => 'approved']);

        $ids = $this->actingAsUser($admin)
                    ->getJson('/api/requests?status=pending')
                    ->assertOk()
                    ->json('data.*.id');

        $this->assertContains($pending->id, $ids);
        $this->assertNotContains($approved->id, $ids);
    }

    public function test_can_filter_requests_by_event(): void
    {
        $admin   = $this->superAdmin();
        $dept    = $this->makeDepartment();
        $event1  = $this->makeEvent($admin);
        $event2  = $this->makeEvent($admin);
        $user    = $this->requester($dept);

        $r1 = $this->makeRequest($user, $dept, $event1);
        $r2 = $this->makeRequest($user, $dept, $event2);

        $ids = $this->actingAsUser($admin)
                    ->getJson("/api/requests?event_id={$event1->id}")
                    ->assertOk()
                    ->json('data.*.id');

        $this->assertContains($r1->id, $ids);
        $this->assertNotContains($r2->id, $ids);
    }

    public function test_can_filter_requests_by_request_type(): void
    {
        $admin  = $this->superAdmin();
        $dept   = $this->makeDepartment();
        $event  = $this->makeEvent($admin);
        $user   = $this->requester($dept);

        $cash  = $this->makeRequest($user, $dept, $event, ['request_type' => 'cash_disbursement']);
        $proc  = $this->makeRequest($user, $dept, $event, ['request_type' => 'procurement']);

        $ids = $this->actingAsUser($admin)
                    ->getJson('/api/requests?request_type=cash_disbursement')
                    ->assertOk()
                    ->json('data.*.id');

        $this->assertContains($cash->id, $ids);
        $this->assertNotContains($proc->id, $ids);
    }

    public function test_list_is_paginated(): void
    {
        $admin = $this->superAdmin();
        $dept  = $this->makeDepartment();
        $event = $this->makeEvent($admin);
        $user  = $this->requester($dept);

        for ($i = 0; $i < 5; $i++) {
            $this->makeRequest($user, $dept, $event);
        }

        $response = $this->actingAsUser($admin)
                         ->getJson('/api/requests?per_page=2&page=1')
                         ->assertOk();

        $this->assertCount(2, $response->json('data'));
        $this->assertEquals(2, $response->json('meta.per_page'));
        $this->assertGreaterThanOrEqual(3, $response->json('meta.last_page'));
    }
}
