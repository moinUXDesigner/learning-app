<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LessonProgress>
 */
class LessonProgressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => User::factory()->student(),
            'lesson_id' => Lesson::factory(),
            'watched_seconds' => fake()->numberBetween(0, 1800),
            'completed_at' => fake()->optional()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
