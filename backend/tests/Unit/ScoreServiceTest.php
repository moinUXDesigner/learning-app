<?php

namespace Tests\Unit;

use App\Models\Course;
use App\Models\DailyTask;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\TaskSubmission;
use App\Models\User;
use App\Services\ScoreService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScoreServiceTest extends TestCase
{
    use RefreshDatabase;

    private ScoreService $scoreService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->scoreService = new ScoreService;
    }

    public function test_award_for_lesson_watch_is_idempotent(): void
    {
        $student = User::factory()->student()->create();
        $module = Module::factory()->create();
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);

        $first = $this->scoreService->awardForLessonWatch($student, $lesson);
        $second = $this->scoreService->awardForLessonWatch($student, $lesson);

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, \App\Models\ScoreLog::where('student_id', $student->id)->count());
        $this->assertSame(ScoreService::POINTS_LESSON_WATCH, $first->points);
    }

    public function test_award_for_assignment_caps_points_at_tasks_max(): void
    {
        $student = User::factory()->student()->create();
        $course = Course::factory()->create();
        $task = DailyTask::factory()->create([
            'course_id' => $course->id,
            'points' => 10,
        ]);
        $submission = TaskSubmission::factory()->create([
            'daily_task_id' => $task->id,
            'student_id' => $student->id,
            'score' => 999, // way above the task's max
        ]);

        $log = $this->scoreService->awardForAssignment($student, $submission);

        $this->assertSame(10, $log->points);
    }

    public function test_award_for_assignment_uses_submission_score_when_below_max(): void
    {
        $student = User::factory()->student()->create();
        $course = Course::factory()->create();
        $task = DailyTask::factory()->create([
            'course_id' => $course->id,
            'points' => 30,
        ]);
        $submission = TaskSubmission::factory()->create([
            'daily_task_id' => $task->id,
            'student_id' => $student->id,
            'score' => 12,
        ]);

        $log = $this->scoreService->awardForAssignment($student, $submission);

        $this->assertSame(12, $log->points);
    }

    public function test_apply_late_penalty_results_in_negative_points(): void
    {
        $student = User::factory()->student()->create();
        $task = DailyTask::factory()->create();
        $submission = TaskSubmission::factory()->create([
            'daily_task_id' => $task->id,
            'student_id' => $student->id,
        ]);

        $log = $this->scoreService->applyLatePenalty($student, $submission);

        $this->assertLessThan(0, $log->points);
        $this->assertSame(ScoreService::LATE_PENALTY_POINTS, $log->points);
    }

    public function test_apply_early_bonus_results_in_positive_points(): void
    {
        $student = User::factory()->student()->create();
        $task = DailyTask::factory()->create();
        $submission = TaskSubmission::factory()->create([
            'daily_task_id' => $task->id,
            'student_id' => $student->id,
        ]);

        $log = $this->scoreService->applyEarlyBonus($student, $submission);

        $this->assertGreaterThan(0, $log->points);
        $this->assertSame(ScoreService::EARLY_BONUS_POINTS, $log->points);
    }

    public function test_total_points_for_student_sums_correctly(): void
    {
        $student = User::factory()->student()->create();
        $courseA = Course::factory()->create();
        $courseB = Course::factory()->create();

        \App\Models\ScoreLog::factory()->create([
            'student_id' => $student->id,
            'course_id' => $courseA->id,
            'points' => 10,
        ]);
        \App\Models\ScoreLog::factory()->create([
            'student_id' => $student->id,
            'course_id' => $courseA->id,
            'points' => 20,
        ]);
        \App\Models\ScoreLog::factory()->create([
            'student_id' => $student->id,
            'course_id' => $courseB->id,
            'points' => 100,
        ]);

        $this->assertSame(130, $this->scoreService->totalPointsForStudent($student));
        $this->assertSame(30, $this->scoreService->totalPointsForStudent($student, $courseA));
        $this->assertSame(100, $this->scoreService->totalPointsForStudent($student, $courseB));
    }
}
