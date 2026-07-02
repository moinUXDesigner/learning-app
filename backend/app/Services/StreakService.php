<?php

namespace App\Services;

use App\Enums\ActivityType;
use App\Enums\TaskStatus;
use App\Models\Course;
use App\Models\ScoreLog;
use App\Models\TaskSubmission;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * On-demand (synchronous) streak computation. Per the MVP plan there is no
 * cron job walking every student every night - streaks are (re)computed
 * whenever something calls into this service, typically right after a
 * task is marked complete.
 */
class StreakService
{
    /**
     * Consecutive-day streak of at least one completed TaskSubmission (for
     * daily_tasks belonging to $course) per calendar day, walked backward
     * from today. Stops counting at the first day with no completed
     * submission ("gap day"). Returns 0 if today itself has no completed
     * submission.
     */
    public function currentStreak(User $student, Course $course): int
    {
        $completedDates = TaskSubmission::query()
            ->where('student_id', $student->id)
            ->where('status', TaskStatus::Completed)
            ->whereHas('dailyTask', fn ($q) => $q->where('course_id', $course->id))
            ->pluck('submitted_at')
            ->filter()
            ->map(fn ($date) => CarbonImmutable::parse($date)->toDateString())
            ->unique()
            ->flip(); // O(1) lookup by date string

        $streak = 0;
        $cursor = CarbonImmutable::today();

        while ($completedDates->has($cursor->toDateString())) {
            $streak++;
            $cursor = $cursor->subDay();
        }

        return $streak;
    }

    /**
     * Computes the current streak and, if eligible, awards a streak bonus
     * for today via ScoreService.
     *
     * Idempotency approach: a streak bonus is awarded at most once per
     * student+course+calendar day. Since ScoreLog::activity_id is null for
     * streak entries (there's no single natural record to dedupe against,
     * per ScoreService::awardStreakBonus's docblock), we instead check for
     * an existing Streak-type ScoreLog for this student/course whose
     * created_at falls on today's date. If one exists, we return null
     * (already awarded today). If the streak is 0 (no completed submission
     * today), we also return null - there is nothing to reward.
     */
    public function checkAndAwardStreakIfEligible(User $student, Course $course, ScoreService $scoreService): ?ScoreLog
    {
        $streak = $this->currentStreak($student, $course);

        if ($streak === 0) {
            return null;
        }

        $alreadyAwardedToday = ScoreLog::where('student_id', $student->id)
            ->where('course_id', $course->id)
            ->where('activity_type', ActivityType::Streak)
            ->whereDate('created_at', CarbonImmutable::today())
            ->exists();

        if ($alreadyAwardedToday) {
            return null;
        }

        return $scoreService->awardStreakBonus($student, $course, $streak);
    }
}
