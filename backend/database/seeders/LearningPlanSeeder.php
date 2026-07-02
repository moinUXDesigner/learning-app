<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\LearningPlan;
use Illuminate\Database\Seeder;

class LearningPlanSeeder extends Seeder
{
    public function run(): void
    {
        $course = Course::firstWhere('title', 'Cybersecurity Beginner');

        LearningPlan::create([
            'course_id' => $course->id,
            'title' => '30-Day Cybersecurity Beginner Plan',
            'duration_days' => 30,
            'description' => 'A structured 30-day path through the Cybersecurity Beginner course, mixing lessons, quizzes, and hands-on tasks.',
        ]);
    }
}
