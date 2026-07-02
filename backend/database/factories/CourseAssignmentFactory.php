<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseAssignment>
 */
class CourseAssignmentFactory extends Factory
{
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('-1 month', 'now');

        return [
            'course_id' => Course::factory(),
            'teacher_id' => User::factory()->teacher(),
            // Default state assigns an individual student; use the batch()
            // state for a batch-based assignment (exactly one of the two
            // should be set - see App\Models\CourseAssignment docblock).
            'student_id' => User::factory()->student(),
            'batch_id' => null,
            'start_date' => $startDate,
            'end_date' => fake()->dateTimeBetween($startDate, '+3 months'),
            'status' => 'active',
        ];
    }

    /**
     * Assign to a whole batch instead of an individual student.
     */
    public function toBatch(): static
    {
        return $this->state(fn (array $attributes) => [
            'student_id' => null,
            'batch_id' => \App\Models\Batch::factory(),
        ]);
    }
}
