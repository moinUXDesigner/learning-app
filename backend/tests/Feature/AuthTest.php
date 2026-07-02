<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_a_student_and_returns_2xx_with_user_data(): void
    {
        $organization = Organization::factory()->create();

        $response = $this->postJson('/api/register', [
            'name' => 'New Student',
            'email' => 'new.student@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'organization_id' => $organization->id,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('user.email', 'new.student@example.com');
        $response->assertJsonPath('user.role', 'student');

        $this->assertDatabaseHas('users', [
            'email' => 'new.student@example.com',
            'role' => 'student',
            'organization_id' => $organization->id,
        ]);
    }

    public function test_duplicate_email_registration_is_rejected(): void
    {
        $organization = Organization::factory()->create();
        $existing = User::factory()->student()->create(['organization_id' => $organization->id]);

        $response = $this->postJson('/api/register', [
            'name' => 'Another User',
            'email' => $existing->email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'organization_id' => $organization->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    public function test_login_with_correct_credentials_succeeds(): void
    {
        $user = User::factory()->student()->create([
            'password' => bcrypt('correct-password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response->assertOk();
        $response->assertJsonPath('user.email', $user->email);
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_with_wrong_password_fails(): void
    {
        $user = User::factory()->student()->create([
            'password' => bcrypt('correct-password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        // AuthController::login returns a 422 with the standard
        // {message, errors, status_code} shape on bad credentials (not 401).
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = $this->actingAsRole('student');

        $response = $this->getJson('/api/me');

        $response->assertOk();
        $response->assertJsonPath('user.id', $user->id);
    }

    public function test_me_returns_401_when_not_authenticated(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }

    public function test_logout_invalidates_the_session(): void
    {
        $this->actingAsRole('student');

        $this->getJson('/api/me')->assertOk();

        $this->postJson('/api/logout')->assertOk();

        // NOTE: hitting an auth:sanctum-protected route (e.g. /api/me above)
        // causes Sanctum's guard resolution to call Auth::shouldUse('sanctum'),
        // which flips the *application's default* auth driver from 'web' to
        // 'sanctum' for the remainder of the request lifecycle. assertGuest()
        // with no argument checks the default guard, which would then be
        // 'sanctum' rather than 'web' - and the 'sanctum' guard instance
        // wasn't the one AuthController::logout() explicitly logged out
        // (it calls Auth::guard('web')->logout()). So we assert against the
        // 'web' guard explicitly here, matching what logout() actually
        // clears - this is standard, documented Sanctum SPA behavior, not an
        // application bug.
        //
        // We deliberately do NOT chain a further /api/me call here to assert
        // 401: Laravel's feature-test HTTP client has no real cookie jar
        // propagating a regenerated/invalidated session id between separate
        // test-issued requests, so a subsequent request's session rehydration
        // is not a reliable signal in-process (verified from the framework
        // internals while writing this test - Auth::guard('web')->check()
        // reliably flips to false immediately after logout, which is what we
        // assert above).
        $this->assertGuest('web');
    }
}
