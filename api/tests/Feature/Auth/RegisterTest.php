<?php

namespace Tests\Feature\Auth;

use App\Modules\User\Models\User;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    public function test_user_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Jane Doe',
            'email'                 => 'jane@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.email', 'jane@example.com');

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
    }

    public function test_new_user_gets_requester_role(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'New User',
            'email'                 => 'newuser@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'newuser@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole('requester'));
    }

    public function test_registration_requires_name_email_and_password(): void
    {
        $this->postJson('/api/auth/register', [])
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_registration_fails_with_duplicate_email(): void
    {
        $existing = $this->requester();

        $this->postJson('/api/auth/register', [
            'name'                  => 'Duplicate',
            'email'                 => $existing->email,
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_fails_when_passwords_do_not_match(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'different',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_fails_with_short_password(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'abc',
            'password_confirmation' => 'abc',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['password']);
    }
}
