<?php

namespace Tests\Feature\Auth;

use App\Modules\User\Models\User;
use Tests\TestCase;

class LoginTest extends TestCase
{
    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = $this->requester();

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.email', $user->email);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = $this->requester();

        $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_login_fails_with_unknown_email(): void
    {
        $this->postJson('/api/auth/login', [
            'email'    => 'nobody@example.com',
            'password' => 'password',
        ])->assertUnauthorized();
    }

    public function test_login_validates_required_fields(): void
    {
        $this->postJson('/api/auth/login', [])
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'password'  => bcrypt('password'),
            'is_active' => false,
        ]);
        $user->assignRole('requester');

        $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'password',
        ])->assertForbidden();
    }

    public function test_authenticated_user_can_get_their_profile(): void
    {
        $user = $this->financeAdmin();

        $this->actingAsUser($user)
             ->getJson('/api/auth/me')
             ->assertOk()
             ->assertJsonPath('data.id', $user->id)
             ->assertJsonPath('data.role', 'finance_admin');
    }

    public function test_unauthenticated_request_to_me_returns_401(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_user_can_logout(): void
    {
        $user = $this->requester();

        $this->actingAsUser($user)
             ->postJson('/api/auth/logout')
             ->assertOk();
    }
}
