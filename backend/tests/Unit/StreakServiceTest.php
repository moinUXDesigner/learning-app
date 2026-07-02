<?php

namespace Tests\Unit;

use App\Enums\ActivityType;
use App\Enums\TaskStatus;
use App\Models\Course;
use App\Models\DailyTask;
use App\Models\ScoreLog;
use App\Models\TaskSubmission;
use App\Models\User;
use App\Services\ScoreService;
use App\Services\StreakService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StreakServiceTest extends TestCase
{
    use RefreshDatabase;

    private StreakService $streakService;

    private ScoreService $scoreService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->streakService = new StreakService;
        $this->scoreService = new ScoreService;
    }

    private function completedSubmissionOn(User $student, Course $course, \DateTimeInterface|string $submittedAt): TaskSubmission
    {
        $task = DailyTask::factory()->create(['course_id' => $course->id]);

        return TaskSubmission::factory()->create([
            'daily_task_id' => $task->id,
            'student_id' => $student->id,
            'status' => TaskStatus::Completed,
            'submitted_at' => $submittedAt,
        ]);
    }

    public function test_consecutive_day_streak_counts_correctly(): void
    {
        $student = User::factory()->student()->create();
        $course = Course::factory()->create();

        $this->completedSubmissionOn($student, $course, now());
        $this->completedSubmissionOn($student, $course, now()->subDay());
        $this->completedSubmissionOn($student, $course, now()->subDays(2));

        $this->assertSame(3, $this->streakService->currentStreak($student, $course));
    }

    public function test_a_gap_day_resets_the_streak_count(): void
    {
        $student = User::factory()->student()->create();
        $course = Course::factory()->create();

        $this->completedSubmissionOn($student, $course, now());
        // Gap: nothing "yesterday".
        $this->completedSubmissionOn($student, $course, now()->subDays(2));
        $this->completedSubmissionOn($student, $course, now()->subDays(3));

        // Only today counts, since yesterday has no completed submission.
        $this->assertSame(1, $this->streakService->currentStreak($student, $course));
    }

    public function test_streak_is_zero_when_today_has_no_completed_submission(): void
    {
        $student = User::factory()->student()->create();
        $course = Course::factory()->create();

        $this->completedSubmissionOn($student, $course, now()->subDay());

        $this->assertSame(0, $this->streakService->currentStreak($student, $course));
    }

    public function test_same_day_double_award_is_prevented(): void
    {
        $student = User::factory()->student()->create();
        $course = Course::factory()->create();

        $this->completedSubmissionOn($student, $course, now());

        $first = $this->streakService->checkAndAwardStreakIfEligible($student, $course, $this->scoreService);
        $this->assertNotNull($first);

        $second = $this->streakService->checkAndAwardStreakIfEligible($student, $course, $this->scoreService);
        $this->assertNull($second);

        $this->assertSame(
            1,
            ScoreLog::where('student_id', $student->id)
                ->where('course_id', $course->id)
                ->where('activity_type', ActivityType::Streak)
                ->count()
        );
    }
}
