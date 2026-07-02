<?php

namespace Database\Seeders;

use App\Enums\CourseStatus;
use App\Models\Course;
use App\Models\Organization;
use App\Models\User;
use App\Services\CourseWorkflowService;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $organization = Organization::firstWhere('name', 'Cyber Academy');
        $teacher1 = User::where('email', 'teacher1@learntrack.test')->firstOrFail();
        $orgAdmin = User::where('email', 'orgadmin@learntrack.test')->firstOrFail();

        $course = Course::create([
            'organization_id' => $organization->id,
            'created_by' => $teacher1->id,
            'title' => 'Cybersecurity Beginner',
            'description' => 'An introductory course covering the fundamentals of cybersecurity: threats, defenses, networking basics, and safe practices.',
            'category' => 'Security',
            'difficulty_level' => 'beginner',
            'duration_days' => 30,
            'status' => CourseStatus::Draft,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        $workflow = app(CourseWorkflowService::class);

        // Draft -> SubmittedForApproval, by the owning teacher.
        $workflow->transition($course, CourseStatus::SubmittedForApproval, $teacher1);

        // SubmittedForApproval -> Approved, by the org admin.
        $workflow->transition($course, CourseStatus::Approved, $orgAdmin);

        // Approved -> Published, by the owning teacher (allowed per
        // CourseWorkflowService's documented design decision).
        $workflow->transition($course, CourseStatus::Published, $teacher1);
    }
}
