<?php

namespace Database\Factories;

use App\Enums\CourseStatus;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'created_by' => User::factory()->teacher(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(['Security', 'Networking', 'Cloud', 'Programming']),
            'difficulty_level' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
            'duration_days' => fake()->numberBetween(7, 90),
            'status' => CourseStatus::Draft,
            'approved_by' => null,
            'approved_at' => null,
        ];
    }
}
