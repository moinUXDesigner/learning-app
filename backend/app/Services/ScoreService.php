<?php

namespace App\Services;

use App\Enums\ActivityType;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Project;
use App\Models\QuizAttempt;
use App\Models\ScoreLog;
use App\Models\TaskSubmission;
use App\Models\User;
use Carbon\Carbon;

/**
 * Single write path for the ScoreLog ledger. Controllers/other services
 * should never insert ScoreLog rows directly - always go through this
 * service so point values and idempotency rules stay centralized.
 *
 * Point values per the product spec:
 *  - watch lesson        = 5
 *  - complete notes      = 10
 *  - quiz pass           = 20
 *  - assignment submit   = 30 (capped at the DailyTask's own `points`)
 *  - project completion  = 100 (capped at the Project's own `points`)
 *  - capstone completion = 500 (capped at the Project's own `points`)
 *  - daily streak bonus  = 15
 *
 * NOT fully specified in the source spec (values chosen here, documented
 * for whoever reviews/tunes game economy later):
 *  - early submission bonus = +5 flat (EARLY_BONUS_POINTS)
 *  - late submission penalty = -10 flat, stored as a negative points value
 *    so SUM(points) naturally nets it out (LATE_PENALTY_POINTS)
 */
class ScoreService
{
    public const POINTS_LESSON_WATCH = 5;

    public const POINTS_NOTES = 10;

    public const POINTS_QUIZ_PASS = 20;

    public const POINTS_ASSIGNMENT = 30;

    public const POINTS_PROJECT = 100;

    public const POINTS_CAPSTONE = 500;

    public const POINTS_STREAK_BONUS = 15;

    /** Not specified in the spec - chosen value, flagged for review. */
    public const EARLY_BONUS_POINTS = 5;

    /** Not specified in the spec - chosen value, flagged for review. Stored as a negative points value. */
    public const LATE_PENALTY_POINTS = -10;

    public function awardForLessonWatch(User $student, Lesson $lesson): ScoreLog
    {
        $existing = $this->findExisting($student, ActivityType::LessonWatch, $lesson->id);
        if ($existing) {
            return $existing;
        }

        return ScoreLog::create([
            'student_id' => $student->id,
            'course_id' => $this->courseIdForLesson($lesson),
            'activity_type' => ActivityType::LessonWatch,
            'activity_id' => $lesson->id,
            'points' => self::POINTS_LESSON_WATCH,
            'remarks' => "Watched lesson: {$lesson->title}",
        ]);
    }

    public function awardForNotes(User $student, Lesson $lesson): ScoreLog
    {
        $existing = $this->findExisting($student, ActivityType::Notes, $lesson->id);
        if ($existing) {
            return $existing;
        }

        return ScoreLog::create([
            'student_id' => $student->id,
            'course_id' => $this->courseIdForLesson($lesson),
            'activity_type' => ActivityType::Notes,
            'activity_id' => $lesson->id,
            'points' => self::POINTS_NOTES,
            'remarks' => "Completed notes for lesson: {$lesson->title}",
        ]);
    }

    public function awardForQuizPass(User $student, QuizAttempt $attempt): ?ScoreLog
    {
        if ($attempt->score < $attempt->quiz->pass_marks) {
            return null;
        }

        $existing = $this->findExisting($student, ActivityType::QuizPass, $attempt->id);
        if ($existing) {
            return $existing;
        }

        return ScoreLog::create([
            'student_id' => $student->id,
            'course_id' => $attempt->quiz->course_id,
            'activity_type' => ActivityType::QuizPass,
            'activity_id' => $attempt->id,
            'points' => self::POINTS_QUIZ_PASS,
            'remarks' => "Passed quiz: {$attempt->quiz->title} (score {$attempt->score}/{$attempt->quiz->total_marks})",
        ]);
    }

    public function awardForAssignment(User $student, TaskSubmission $submission): ScoreLog
    {
        $existing = $this->findExisting($student, ActivityType::Assignment, $submission->id);
        if ($existing) {
            return $existing;
        }

        $task = $submission->dailyTask;
        $points = min((int) $submission->score, (int) $task->points);

        return ScoreLog::create([
            'student_id' => $student->id,
            'course_id' => $task->course_id,
            'activity_type' => ActivityType::Assignment,
            'activity_id' => $submission->id,
            'points' => $points,
            'remarks' => "Assignment submission for task: {$task->title}",
        ]);
    }

    public function awardForProject(User $student, Project $project, int $pointsEarned): ScoreLog
    {
        return $this->awardForProjectLike($student, $project, $pointsEarned, ActivityType::Project);
    }

    public function awardForCapstone(User $student, Project $capstoneProject, int $pointsEarned): ScoreLog
    {
        return $this->awardForProjectLike($student, $capstoneProject, $pointsEarned, ActivityType::Capstone);
    }

    /**
     * Shared capping/logging logic for Project and Capstone awards. Both
     * are backed by the `projects` table and capped at the project's own
     * `points` column; they only differ in the ActivityType recorded so
     * reporting can distinguish capstones from regular projects.
     */
    private function awardForProjectLike(User $student, Project $project, int $pointsEarned, ActivityType $activityType): ScoreLog
    {
        $existing = $this->findExisting($student, $activityType, $project->id);
        if ($existing) {
            return $existing;
        }

        $points = min($pointsEarned, (int) $project->points);
        $label = $activityType === ActivityType::Capstone ? 'capstone' : 'project';

        return ScoreLog::create([
            'student_id' => $student->id,
            'course_id' => $project->course_id,
            'activity_type' => $activityType,
            'activity_id' => $project->id,
            'points' => $points,
            'remarks' => ucfirst($label)." completed: {$project->title}",
        ]);
    }

    public function applyEarlyBonus(User $student, TaskSubmission $submission): ScoreLog
    {
        $existing = $this->findExisting($student, ActivityType::EarlyBonus, $submission->id);
        if ($existing) {
            return $existing;
        }

        $task = $submission->dailyTask;

        return ScoreLog::create([
            'student_id' => $student->id,
            'course_id' => $task->course_id,
            'activity_type' => ActivityType::EarlyBonus,
            'activity_id' => $submission->id,
            'points' => self::EARLY_BONUS_POINTS,
            'remarks' => "Early submission bonus for task: {$task->title}",
        ]);
    }

    public function applyLatePenalty(User $student, TaskSubmission $submission): ScoreLog
    {
        $existing = $this->findExisting($student, ActivityType::LatePenalty, $submission->id);
        if ($existing) {
            return $existing;
        }

        $task = $submission->dailyTask;

        return ScoreLog::create([
            'student_id' => $student->id,
            'course_id' => $task->course_id,
            'activity_type' => ActivityType::LatePenalty,
            'activity_id' => $submission->id,
            'points' => self::LATE_PENALTY_POINTS,
            'remarks' => "Late submission penalty for task: {$task->title}",
        ]);
    }

    /**
     * Awards a flat streak bonus for a given course + calendar day. Callers
     * (StreakService) are responsible for deciding whether `$streakDay` is
     * eligible for a new award; this method itself is not idempotent on
     * its own since it has no natural per-day activity_id to dedupe against
     * a lesson/submission - see StreakService::checkAndAwardStreakIfEligible()
     * for the per-day uniqueness check via `remarks`/date scoping.
     */
    public function awardStreakBonus(User $student, Course $course, int $streakDay): ScoreLog
    {
        return ScoreLog::create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'activity_type' => ActivityType::Streak,
            'activity_id' => null,
            'points' => self::POINTS_STREAK_BONUS,
            'remarks' => "Daily streak bonus - day {$streakDay}",
        ]);
    }

    public function totalPointsForStudent(User $student, ?Course $course = null): int
    {
        return (int) ScoreLog::where('student_id', $student->id)
            ->when($course, fn ($q) => $q->where('course_id', $course->id))
            ->sum('points');
    }

    private function findExisting(User $student, ActivityType $activityType, int $activityId): ?ScoreLog
    {
        return ScoreLog::where('student_id', $student->id)
            ->where('activity_type', $activityType)
            ->where('activity_id', $activityId)
            ->first();
    }

    private function courseIdForLesson(Lesson $lesson): ?int
    {
        return $lesson->module?->course_id;
    }
}
