<?php

namespace Database\Factories;

use App\Enums\ActivityType;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ScoreLog>
 */
class ScoreLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => User::factory()->student(),
            'course_id' => Course::factory(),
            'activity_type' => fake()->randomElement(ActivityType::cases()),
            'activity_id' => fake()->numberBetween(1, 1000),
            'points' => fake()->numberBetween(1, 50),
            'remarks' => fake()->optional()->sentence(),
        ];
    }
}
