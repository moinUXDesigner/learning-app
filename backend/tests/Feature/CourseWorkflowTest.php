<?php

namespace Tests\Feature;

use App\Enums\CourseStatus;
use App\Models\Course;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_create_a_course_in_draft(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);

        $response = $this->postJson('/api/courses', [
            'title' => 'Intro to Pentesting',
            'description' => 'A beginner course.',
            'category' => 'Security',
            'difficulty_level' => 'beginner',
            'duration_days' => 30,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('status', CourseStatus::Draft->value);
        $response->assertJsonPath('created_by', $teacher->id);

        $this->assertDatabaseHas('courses', [
            'title' => 'Intro to Pentesting',
            'status' => CourseStatus::Draft->value,
            'organization_id' => $org->id,
        ]);
    }

    public function test_teacher_can_submit_course_for_approval(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);

        $course = Course::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $teacher->id,
            'status' => CourseStatus::Draft,
        ]);

        $response = $this->postJson("/api/courses/{$course->id}/submit-approval");

        $response->assertOk();
        $response->assertJsonPath('status', CourseStatus::SubmittedForApproval->value);

        $this->assertSame(
            CourseStatus::SubmittedForApproval,
            $course->fresh()->status
        );
    }

    public function test_org_admin_can_approve_a_submitted_course(): void
    {
        $org = Organization::factory()->create();
        $admin = $this->actingAsRole('org_admin', $org);

        $course = Course::factory()->create([
            'organization_id' => $org->id,
            'status' => CourseStatus::SubmittedForApproval,
        ]);

        $response = $this->postJson("/api/courses/{$course->id}/approve");

        $response->assertOk();
        $response->assertJsonPath('status', CourseStatus::Approved->value);
        $response->assertJsonPath('approved_by', $admin->id);
        $response->assertJsonPath('approved_at', fn ($value) => $value !== null);

        $fresh = $course->fresh();
        $this->assertSame(CourseStatus::Approved, $fresh->status);
        $this->assertSame($admin->id, $fresh->approved_by);
        $this->assertNotNull($fresh->approved_at);
    }

    public function test_org_admin_can_reject_a_submitted_course_with_reason(): void
    {
        $org = Organization::factory()->create();
        $this->actingAsRole('org_admin', $org);

        $course = Course::factory()->create([
            'organization_id' => $org->id,
            'status' => CourseStatus::SubmittedForApproval,
        ]);

        $response = $this->postJson("/api/courses/{$course->id}/reject", [
            'reason' => 'Not enough content depth.',
        ]);

        $response->assertOk();
        $response->assertJsonPath('status', CourseStatus::Rejected->value);
        $response->assertJsonPath('rejection_reason', 'Not enough content depth.');

        $fresh = $course->fresh();
        $this->assertSame(CourseStatus::Rejected, $fresh->status);
        $this->assertSame('Not enough content depth.', $fresh->rejection_reason);
    }

    public function test_course_cannot_be_assigned_while_not_approved_or_published(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);

        $course = Course::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $teacher->id,
            'status' => CourseStatus::Draft,
        ]);

        $this->assertFalse($teacher->can('assign', $course));

        $student = \App\Models\User::factory()->student()->create(['organization_id' => $org->id]);

        $response = $this->postJson('/api/course-assignments', [
            'course_id' => $course->id,
            'student_id' => $student->id,
            'start_date' => now()->toDateString(),
        ]);

        $response->assertForbidden();
    }

    public function test_teacher_cannot_edit_course_once_approved(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);

        $course = Course::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $teacher->id,
            'status' => CourseStatus::Approved,
        ]);

        $response = $this->putJson("/api/courses/{$course->id}", [
            'title' => 'Changed title',
        ]);

        $response->assertForbidden();

        $this->assertNotSame('Changed title', $course->fresh()->title);
    }

    public function test_illegal_direct_transition_draft_to_published_is_rejected(): void
    {
        $org = Organization::factory()->create();
        $teacher = $this->actingAsRole('teacher', $org);

        $course = Course::factory()->create([
            'organization_id' => $org->id,
            'created_by' => $teacher->id,
            'status' => CourseStatus::Draft,
        ]);

        $response = $this->postJson("/api/courses/{$course->id}/publish");

        $response->assertStatus(422);

        $this->assertSame(CourseStatus::Draft, $course->fresh()->status);
    }
}
