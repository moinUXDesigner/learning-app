<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => Role::Student,
            'organization_id' => Organization::factory(),
            'status' => 'active',
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Super admin: platform-level user, not tied to any organization.
     */
    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => Role::SuperAdmin,
            'organization_id' => null,
        ]);
    }

    /**
     * Org admin: requires an organization.
     */
    public function orgAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => Role::OrgAdmin,
            'organization_id' => $attributes['organization_id'] ?? Organization::factory(),
        ]);
    }

    /**
     * Teacher: requires an organization.
     */
    public function teacher(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => Role::Teacher,
            'organization_id' => $attributes['organization_id'] ?? Organization::factory(),
        ]);
    }

    /**
     * Student: requires an organization.
     */
    public function student(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => Role::Student,
            'organization_id' => $attributes['organization_id'] ?? Organization::factory(),
        ]);
    }
}
