<?php

namespace Tests\Feature;

use App\Enums\CourseStatus;
use App\Models\Course;
use App\Models\LearningPlan;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DailyTaskTest extends TestCase
{
    use RefreshDatabase;

    private function planFor(Organization $org, User $teacher, int $durationDays = 30): LearningPlan
    {
        $course = Course::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $teacher->id,
            'status' => CourseStatus::Draft,
        ]);

        return LearningPlan::factory()->create([
            'course_id' => $course->id,
            'duration_days' => $durationDays,
        ]);
    }

    public function test_course_owning_teacher_can_create_a_daily_task(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);
        $plan = $this->planFor($org, $teacher);

        $response = $this->postJson("/api/learning-plans/{$plan->id}/daily-tasks", [
            'learning_plan_id' => $plan->id,
            'course_id' => $plan->course_id,
            'day_number' => 2,
            'title' => 'Read chapter 2',
            'due_time' => $plan->created_at->copy()->addDays(2)->toDateTimeString(),
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('daily_tasks', [
            'learning_plan_id' => $plan->id,
            'title' => 'Read chapter 2',
        ]);
    }

    public function test_org_admin_can_create_a_daily_task_under_the_course(): void
    {
        $org = Organization::factory()->create();
        $teacher = User::factory()->teacher()->create(['organization_id' => $org->id]);
        $plan = $this->planFor($org, $teacher);

        $this->actingAsRole('org_admin', $org);

        $response = $this->postJson("/api/learning-plans/{$plan->id}/daily-tasks", [
            'learning_plan_id' => $plan->id,
            'course_id' => $plan->course_id,
            'day_number' => 1,
            'title' => 'Org admin created task',
            'due_time' => $plan->created_at->copy()->addDay()->toDateTimeString(),
        ]);

        $response->assertCreated();
    }

    public function test_a_different_organizations_teacher_cannot_create_a_daily_task(): void
    {
        $org = Organization::factory()->create();
        $owningTeacher = User::factory()->teacher()->create(['organization_id' => $org->id]);
        $plan = $this->planFor($org, $owningTeacher);

        // A different teacher, different org entirely.
        $this->actingAsRole('teacher');

        $response = $this->postJson("/api/learning-plans/{$plan->id}/daily-tasks", [
            'learning_plan_id' => $plan->id,
            'course_id' => $plan->course_id,
            'day_number' => 1,
            'title' => 'Should not be allowed',
            'due_time' => $plan->created_at->copy()->addDay()->toDateTimeString(),
        ]);

        $response->assertForbidden();
    }

    public function test_a_non_owning_teacher_in_same_org_cannot_create_a_daily_task(): void
    {
        $org = Organization::factory()->create();
        $owningTeacher = User::factory()->teacher()->create(['organization_id' => $org->id]);
        $plan = $this->planFor($org, $owningTeacher);

        // Same org, but not the course's creator.
        $this->actingAsRole('teacher', $org);

        $response = $this->postJson("/api/learning-plans/{$plan->id}/daily-tasks", [
            'learning_plan_id' => $plan->id,
            'course_id' => $plan->course_id,
            'day_number' => 1,
            'title' => 'Should not be allowed either',
            'due_time' => $plan->created_at->copy()->addDay()->toDateTimeString(),
        ]);

        $response->assertForbidden();
    }

    /**
     * DailyTaskController::validateAgainstPlan treats learning_plan->created_at
     * as day 1, and requires due_time >= created_at + (day_number - 1) days
     * and <= created_at + duration_days days. day_number itself must also be
     * <= duration_days. Test the actual implemented floor/ceiling rule.
     */
    public function test_due_time_before_the_days_lower_bound_is_rejected(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);
        $plan = $this->planFor($org, $teacher, 30);

        // day_number 5 requires due_time >= created_at + 4 days. Sending a
        // due_time far in the past should violate the lower bound.
        $response = $this->postJson("/api/learning-plans/{$plan->id}/daily-tasks", [
            'learning_plan_id' => $plan->id,
            'course_id' => $plan->course_id,
            'day_number' => 5,
            'title' => 'Too early',
            'due_time' => $plan->created_at->copy()->subDays(10)->toDateTimeString(),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('due_time');
    }

    public function test_due_time_after_the_plans_duration_window_is_rejected(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);
        $plan = $this->planFor($org, $teacher, 10);

        $response = $this->postJson("/api/learning-plans/{$plan->id}/daily-tasks", [
            'learning_plan_id' => $plan->id,
            'course_id' => $plan->course_id,
            'day_number' => 3,
            'title' => 'Too late',
            'due_time' => $plan->created_at->copy()->addDays(60)->toDateTimeString(),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('due_time');
    }

    public function test_day_number_exceeding_duration_days_is_rejected(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);
        $plan = $this->planFor($org, $teacher, 10);

        $response = $this->postJson("/api/learning-plans/{$plan->id}/daily-tasks", [
            'learning_plan_id' => $plan->id,
            'course_id' => $plan->course_id,
            'day_number' => 50,
            'title' => 'Day number too large',
            'due_time' => $plan->created_at->copy()->addDays(5)->toDateTimeString(),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('day_number');
    }

    public function test_due_time_within_bounds_is_accepted(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);
        $plan = $this->planFor($org, $teacher, 30);

        $response = $this->postJson("/api/learning-plans/{$plan->id}/daily-tasks", [
            'learning_plan_id' => $plan->id,
            'course_id' => $plan->course_id,
            'day_number' => 5,
            'title' => 'Within bounds',
            'due_time' => $plan->created_at->copy()->addDays(5)->toDateTimeString(),
        ]);

        $response->assertCreated();
    }
}
