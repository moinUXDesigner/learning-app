<?php

namespace App\Http\Controllers\Api;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\TaskSubmission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * "Inactive students" window: N = 7 days (documented choice, not specified
 * by the spec) - a student is considered inactive if they have made no
 * TaskSubmission in the last 7 days, scoped to submissions for this
 * teacher's own courses.
 */
class TeacherDashboardController extends Controller
{
    private const INACTIVE_DAYS = 7;

    public function index(Request $request): JsonResponse
    {
        $teacher = $request->user();

        $submissionsQuery = fn () => TaskSubmission::query()
            ->whereHas('dailyTask.course', function ($q) use ($teacher) {
                $q->where('created_by', $teacher->id);
            });

        $pendingReviewsCount = (clone $submissionsQuery())
            ->whereIn('status', [TaskStatus::Submitted->value, TaskStatus::Late->value])
            ->count();

        $averageScore = (clone $submissionsQuery())
            ->whereNotNull('score')
            ->avg('score');

        // Student-wise progress summary: per student, count of completed
        // submissions and average score, across this teacher's courses.
        $studentProgress = (clone $submissionsQuery())
            ->selectRaw('student_id, COUNT(*) as submission_count, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed_count, AVG(score) as average_score', [TaskStatus::Completed->value])
            ->groupBy('student_id')
            ->with('student:id,name,email')
            ->get();

        // Course-wise completion: per course, total tasks submitted vs
        // completed.
        //
        // Bug fix (found while building the teacher-flow frontend that
        // consumes this endpoint): this query joins task_submissions to
        // daily_tasks and groups by the *raw* daily_tasks.course_id column
        // via selectRaw() — the resulting rows are TaskSubmission-shaped
        // aggregate rows, not real TaskSubmission models with an actual
        // course_id foreign key on their own table. Calling ->with('course')
        // on them threw RelationNotFoundException because TaskSubmission
        // has no `course` relationship (only `dailyTask`, which itself
        // belongs to a Course). Fixed by dropping the eager-load and
        // manually attaching each row's Course (id/title only, matching
        // the original with()'s column selection) after the query runs.
        $courseCompletion = (clone $submissionsQuery())
            ->join('daily_tasks', 'task_submissions.daily_task_id', '=', 'daily_tasks.id')
            ->selectRaw('daily_tasks.course_id, COUNT(*) as submission_count, SUM(CASE WHEN task_submissions.status = ? THEN 1 ELSE 0 END) as completed_count', [TaskStatus::Completed->value])
            ->groupBy('daily_tasks.course_id')
            ->get();

        $coursesById = Course::query()
            ->whereIn('id', $courseCompletion->pluck('course_id'))
            ->get(['id', 'title'])
            ->keyBy('id');

        $courseCompletion = $courseCompletion->map(function ($row) use ($coursesById) {
            $row->setRelation('course', $coursesById->get($row->course_id));

            return $row;
        });

        $inactiveSince = now()->subDays(self::INACTIVE_DAYS);

        $activeStudentIds = (clone $submissionsQuery())
            ->where('submitted_at', '>=', $inactiveSince)
            ->distinct()
            ->pluck('student_id');

        $allStudentIds = (clone $submissionsQuery())
            ->distinct()
            ->pluck('student_id');

        $inactiveStudentIds = $allStudentIds->diff($activeStudentIds)->values();

        $inactiveStudents = User::query()
            ->whereIn('id', $inactiveStudentIds)
            ->get(['id', 'name', 'email']);

        return response()->json([
            'pending_reviews_count' => $pendingReviewsCount,
            'average_score' => $averageScore !== null ? round((float) $averageScore, 2) : null,
            'student_progress' => $studentProgress,
            'course_completion' => $courseCompletion,
            'inactive_students' => $inactiveStudents,
            'inactive_days_threshold' => self::INACTIVE_DAYS,
        ]);
    }
}
