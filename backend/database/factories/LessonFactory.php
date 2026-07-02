<?php

namespace Database\Factories;

use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Lesson>
 */
class LessonFactory extends Factory
{
    public function definition(): array
    {
        return [
            'module_id' => Module::factory(),
            'title' => fake()->sentence(4),
            'content' => fake()->paragraphs(3, true),
            'video_url' => fake()->url(),
            'video_start_seconds' => 0,
            'video_end_seconds' => fake()->numberBetween(300, 1800),
            'estimated_minutes' => fake()->numberBetween(5, 60),
            'order' => fake()->numberBetween(0, 10),
        ];
    }
}
