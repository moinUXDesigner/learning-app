<?php

namespace Database\Factories;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Organization>
 */
class OrganizationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company(),
            'logo' => fake()->optional()->imageUrl(),
            'domain' => fake()->unique()->domainName(),
            'subscription_plan_id' => SubscriptionPlan::factory(),
            'status' => 'active',
        ];
    }
}
