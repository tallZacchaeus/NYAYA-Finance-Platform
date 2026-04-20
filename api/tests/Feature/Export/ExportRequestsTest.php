<?php

namespace Tests\Feature\Export;

use Tests\TestCase;

class ExportRequestsTest extends TestCase
{
    public function test_finance_admin_can_export_requests_as_csv(): void
    {
        $admin = $this->superAdmin();
        $dept  = $this->makeDepartment();
        $event = $this->makeEvent($admin);
        $user  = $this->requester($dept);

        $this->makeRequest($user, $dept, $event);
        $this->makeRequest($user, $dept, $event);

        $response = $this->actingAsUser($admin)
                         ->get('/api/export/requests');

        $response->assertOk();

        $contentType = $response->headers->get('Content-Type');
        $this->assertStringContainsString(
            'spreadsheetml',
            $contentType ?? $response->headers->get('content-type') ?? '',
        );
    }

    public function test_requester_cannot_export_requests(): void
    {
        $user = $this->requester();

        $this->actingAsUser($user)
             ->get('/api/export/requests')
             ->assertForbidden();
    }

    public function test_finance_admin_can_export_budget_summary(): void
    {
        $admin  = $this->superAdmin();
        $dept   = $this->makeDepartment();
        $event  = $this->makeEvent($admin);
        $this->makeBudget($event, $dept);

        $response = $this->actingAsUser($admin)
                         ->get('/api/export/budget-summary');

        $response->assertOk();

        $contentType = $response->headers->get('Content-Type');
        $this->assertStringContainsString(
            'spreadsheetml',
            $contentType ?? $response->headers->get('content-type') ?? '',
        );
    }

    public function test_export_can_be_filtered_by_event(): void
    {
        $admin  = $this->superAdmin();
        $dept   = $this->makeDepartment();
        $event  = $this->makeEvent($admin);
        $user   = $this->requester($dept);

        $this->makeRequest($user, $dept, $event);

        // Should not throw — just verifies the query param is accepted
        $this->actingAsUser($admin)
             ->get("/api/export/requests?event_id={$event->id}")
             ->assertOk();
    }

    public function test_unauthenticated_user_cannot_export(): void
    {
        $this->getJson('/api/export/requests')->assertUnauthorized();
    }
}
