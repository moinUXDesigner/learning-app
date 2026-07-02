<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AppNotification>
 */
class AppNotificationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['task_due', 'course_approved', 'submission_reviewed', 'certificate_issued']),
            'message' => fake()->sentence(),
            'read_at' => null,
        ];
    }
}
