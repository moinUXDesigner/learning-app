<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Order matters: each seeder depends on rows created by the ones before
     * it (organization -> users -> course -> workflow transitions -> plan
     * structure -> tasks/quizzes -> assignments -> submissions/attempts,
     * where ScoreService is invoked to produce real ScoreLog rows).
     */
    public function run(): void
    {
        $this->call([
            SubscriptionPlanSeeder::class,
            OrganizationSeeder::class,
            UserSeeder::class,
            CourseSeeder::class,
            LearningPlanSeeder::class,
            ModuleLessonSeeder::class,
            DailyTaskSeeder::class,
            QuizSeeder::class,
            CourseAssignmentSeeder::class,
            TaskSubmissionSeeder::class,
            QuizAttemptSeeder::class,
        ]);
    }
}
