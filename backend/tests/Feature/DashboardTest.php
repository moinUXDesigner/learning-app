<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_dashboard_returns_200_with_expected_keys(): void
    {
        $this->actingAsRole('student');

        $response = $this->getJson('/api/student/dashboard');

        $response->assertOk();
        $response->assertJsonStructure([
            'course_completion_percent',
            'daily_task_completion_count',
            'total_daily_tasks',
            'quiz_scores',
            'assignment_scores',
            'total_xp',
            'streaks_by_course',
            'late_submission_count',
        ]);
    }

    public function test_teacher_dashboard_returns_200_with_expected_keys(): void
    {
        $this->actingAsRole('teacher');

        $response = $this->getJson('/api/teacher/dashboard');

        $response->assertOk();
        $response->assertJsonStructure([
            'pending_reviews_count',
            'average_score',
            'student_progress',
            'course_completion',
            'inactive_students',
            'inactive_days_threshold',
        ]);
    }

    public function test_admin_dashboard_returns_200_for_org_admin_with_expected_keys(): void
    {
        $this->actingAsRole('org_admin');

        $response = $this->getJson('/api/admin/dashboard');

        $response->assertOk();
        $response->assertJsonStructure([
            'total_users',
            'total_teachers',
            'total_students',
            'total_courses',
            'course_status_breakdown',
            'active_students_count',
            'completion_rate',
        ]);
    }

    public function test_admin_dashboard_returns_200_for_super_admin(): void
    {
        $this->actingAsRole('super_admin');

        $response = $this->getJson('/api/admin/dashboard');

        $response->assertOk();
        $response->assertJsonStructure([
            'total_users',
            'total_teachers',
            'total_students',
            'total_courses',
            'course_status_breakdown',
            'active_students_count',
            'completion_rate',
        ]);
    }

    public function test_student_hitting_teacher_dashboard_gets_403(): void
    {
        $this->actingAsRole('student');

        $this->getJson('/api/teacher/dashboard')->assertForbidden();
    }

    public function test_student_hitting_admin_dashboard_gets_403(): void
    {
        $this->actingAsRole('student');

        $this->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_student_hitting_student_dashboard_own_role_succeeds_but_teacher_role_gated(): void
    {
        $this->actingAsRole('teacher');

        $this->getJson('/api/student/dashboard')->assertForbidden();
    }
}
