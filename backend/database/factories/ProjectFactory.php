<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'points' => fake()->numberBetween(20, 200),
            'deadline' => fake()->dateTimeBetween('now', '+60 days'),
            'rubric' => [
                'criteria' => [
                    ['name' => 'Functionality', 'weight' => 40],
                    ['name' => 'Code quality', 'weight' => 30],
                    ['name' => 'Documentation', 'weight' => 30],
                ],
            ],
        ];
    }
}
