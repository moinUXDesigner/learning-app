<?php

namespace Tests\Feature;

use App\Enums\SubmissionType;
use App\Enums\TaskStatus;
use App\Models\Course;
use App\Models\DailyTask;
use App\Models\LearningPlan;
use App\Models\Organization;
use App\Models\TaskSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TaskSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private function taskWithType(Organization $org, SubmissionType $type, ?string $dueTime = null): DailyTask
    {
        $course = Course::factory()->create(['organization_id' => $org->id]);
        $plan = LearningPlan::factory()->create(['course_id' => $course->id]);

        return DailyTask::factory()->create([
            'learning_plan_id' => $plan->id,
            'course_id' => $course->id,
            'submission_type' => $type,
            'points' => 20,
            'due_time' => $dueTime ?? now()->addDays(3),
        ]);
    }

    public function test_text_submission_type_is_accepted(): void
    {
        $org = Organization::factory()->create();
        $this->actingAsRole('student', $org);
        $task = $this->taskWithType($org, SubmissionType::Text);

        $response = $this->postJson("/api/tasks/{$task->id}/submit", [
            'text_answer' => 'My answer to the task.',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('task_submissions', [
            'daily_task_id' => $task->id,
            'submission_type' => SubmissionType::Text->value,
            'text_answer' => 'My answer to the task.',
        ]);
    }

    public function test_url_submission_type_is_accepted(): void
    {
        $org = Organization::factory()->create();
        $this->actingAsRole('student', $org);
        $task = $this->taskWithType($org, SubmissionType::Url);

        $response = $this->postJson("/api/tasks/{$task->id}/submit", [
            'url' => 'https://example.com/my-work',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('task_submissions', [
            'daily_task_id' => $task->id,
            'submission_type' => SubmissionType::Url->value,
            'url' => 'https://example.com/my-work',
        ]);
    }

    public function test_github_link_submission_type_is_accepted(): void
    {
        $org = Organization::factory()->create();
        $this->actingAsRole('student', $org);
        $task = $this->taskWithType($org, SubmissionType::GithubLink);

        $response = $this->postJson("/api/tasks/{$task->id}/submit", [
            'github_url' => 'https://github.com/example/repo',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('task_submissions', [
            'daily_task_id' => $task->id,
            'submission_type' => SubmissionType::GithubLink->value,
            'github_url' => 'https://github.com/example/repo',
        ]);
    }

    public function test_file_submission_type_is_accepted(): void
    {
        Storage::fake('public');

        $org = Organization::factory()->create();
        $this->actingAsRole('student', $org);
        $task = $this->taskWithType($org, SubmissionType::File);

        $file = UploadedFile::fake()->create('homework.pdf', 100);

        $response = $this->postJson("/api/tasks/{$task->id}/submit", [
            'file' => $file,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('task_submissions', [
            'daily_task_id' => $task->id,
            'submission_type' => SubmissionType::File->value,
        ]);
        Storage::disk('public')->assertExists($response->json('file_path'));
    }

    public function test_screenshot_submission_type_is_accepted(): void
    {
        Storage::fake('public');

        $org = Organization::factory()->create();
        $this->actingAsRole('student', $org);
        $task = $this->taskWithType($org, SubmissionType::Screenshot);

        $file = UploadedFile::fake()->image('screenshot.png');

        $response = $this->postJson("/api/tasks/{$task->id}/submit", [
            'file' => $file,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('task_submissions', [
            'daily_task_id' => $task->id,
            'submission_type' => SubmissionType::Screenshot->value,
        ]);
    }

    public function test_text_submission_missing_required_field_is_rejected(): void
    {
        $org = Organization::factory()->create();
        $this->actingAsRole('student', $org);
        $task = $this->taskWithType($org, SubmissionType::Text);

        $response = $this->postJson("/api/tasks/{$task->id}/submit", []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('text_answer');
    }

    public function test_a_different_orgs_teacher_cannot_review_a_submission(): void
    {
        $org = Organization::factory()->create();
        $course = Course::factory()->create(['organization_id' => $org->id]);
        $plan = LearningPlan::factory()->create(['course_id' => $course->id]);
        $task = DailyTask::factory()->create([
            'learning_plan_id' => $plan->id,
            'course_id' => $course->id,
            'points' => 20,
        ]);
        $student = User::factory()->student()->create(['organization_id' => $org->id]);
        $submission = TaskSubmission::factory()->create([
            'daily_task_id' => $task->id,
            'student_id' => $student->id,
            'status' => TaskStatus::Submitted,
        ]);

        // Different organization entirely.
        $this->actingAsRole('teacher');

        $response = $this->postJson("/api/submissions/{$submission->id}/review", [
            'score' => 10,
        ]);

        $response->assertForbidden();
    }

    public function test_course_owning_teacher_can_review_a_submission(): void
    {
        $org = Organization::factory()->create();
        $teacher = User::factory()->teacher()->create(['organization_id' => $org->id]);
        $course = Course::factory()->create(['organization_id' => $org->id, 'created_by' => $teacher->id]);
        $plan = LearningPlan::factory()->create(['course_id' => $course->id]);
        $task = DailyTask::factory()->create([
            'learning_plan_id' => $plan->id,
            'course_id' => $course->id,
            'points' => 20,
        ]);
        $student = User::factory()->student()->create(['organization_id' => $org->id]);
        $submission = TaskSubmission::factory()->create([
            'daily_task_id' => $task->id,
            'student_id' => $student->id,
            'status' => TaskStatus::Submitted,
        ]);

        $this->actingAs($teacher);

        $response = $this->postJson("/api/submissions/{$submission->id}/review", [
            'score' => 15,
            'feedback' => 'Good work.',
        ]);

        $response->assertOk();
        $response->assertJsonPath('score', 15);
        $response->assertJsonPath('status', TaskStatus::Completed->value);
    }

    public function test_student_cannot_view_another_students_submission(): void
    {
        $org = Organization::factory()->create();
        $course = Course::factory()->create(['organization_id' => $org->id]);
        $plan = LearningPlan::factory()->create(['course_id' => $course->id]);
        $task = DailyTask::factory()->create([
            'learning_plan_id' => $plan->id,
            'course_id' => $course->id,
        ]);
        $owner = User::factory()->student()->create(['organization_id' => $org->id]);
        $submission = TaskSubmission::factory()->create([
            'daily_task_id' => $task->id,
            'student_id' => $owner->id,
        ]);

        $otherStudent = $this->actingAsRole('student', $org);

        $this->assertFalse($otherStudent->can('view', $submission));
    }

    public function test_reviewing_with_score_above_max_points_is_rejected(): void
    {
        $org = Organization::factory()->create();
        $teacher = User::factory()->teacher()->create(['organization_id' => $org->id]);
        $course = Course::factory()->create(['organization_id' => $org->id, 'created_by' => $teacher->id]);
        $plan = LearningPlan::factory()->create(['course_id' => $course->id]);
        $task = DailyTask::factory()->create([
            'learning_plan_id' => $plan->id,
            'course_id' => $course->id,
            'points' => 10,
        ]);
        $student = User::factory()->student()->create(['organization_id' => $org->id]);
        $submission = TaskSubmission::factory()->create([
            'daily_task_id' => $task->id,
            'student_id' => $student->id,
            'status' => TaskStatus::Submitted,
        ]);

        $this->actingAs($teacher);

        $response = $this->postJson("/api/submissions/{$submission->id}/review", [
            'score' => 999,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('score');
    }
}
