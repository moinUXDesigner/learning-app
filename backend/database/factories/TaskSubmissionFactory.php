<?php

namespace Database\Factories;

use App\Enums\SubmissionType;
use App\Enums\TaskStatus;
use App\Models\DailyTask;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TaskSubmission>
 */
class TaskSubmissionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'daily_task_id' => DailyTask::factory(),
            'student_id' => User::factory()->student(),
            'submission_type' => fake()->randomElement(SubmissionType::cases()),
            'text_answer' => fake()->optional()->paragraph(),
            'file_path' => fake()->optional()->filePath(),
            'url' => fake()->optional()->url(),
            'github_url' => fake()->optional()->url(),
            'status' => TaskStatus::Submitted,
            'submitted_at' => now(),
            'reviewed_by' => null,
            'reviewed_at' => null,
            'score' => null,
            'feedback' => null,
        ];
    }
}
