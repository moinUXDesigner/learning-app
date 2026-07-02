<?php

namespace Database\Factories;

use App\Enums\SubmissionType;
use App\Models\Course;
use App\Models\LearningPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DailyTask>
 */
class DailyTaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'learning_plan_id' => LearningPlan::factory(),
            'course_id' => Course::factory(),
            'module_id' => null,
            'lesson_id' => null,
            'day_number' => fake()->numberBetween(1, 90),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'task_type' => fake()->randomElement(['reading', 'video', 'quiz', 'assignment', 'project']),
            'estimated_minutes' => fake()->numberBetween(10, 120),
            'points' => fake()->numberBetween(5, 50),
            'due_time' => fake()->dateTimeBetween('now', '+30 days'),
            'difficulty' => fake()->randomElement(['easy', 'medium', 'hard']),
            'completion_criteria' => fake()->sentence(),
            'resource_link' => fake()->optional()->url(),
            'video_link' => fake()->optional()->url(),
            'submission_type' => fake()->randomElement(SubmissionType::cases()),
        ];
    }
}
