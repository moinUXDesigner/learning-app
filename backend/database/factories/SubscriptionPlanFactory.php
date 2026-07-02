<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SubscriptionPlan>
 */
class SubscriptionPlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Free', 'Starter', 'Pro', 'Enterprise']),
            'price' => fake()->randomFloat(2, 0, 500),
            'max_users' => fake()->randomElement([10, 50, 200, null]),
            'max_courses' => fake()->randomElement([5, 20, 100, null]),
            'features' => [
                'analytics' => fake()->boolean(),
                'certificates' => fake()->boolean(),
                'priority_support' => fake()->boolean(),
            ],
        ];
    }
}
