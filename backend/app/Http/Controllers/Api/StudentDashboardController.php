<?php

namespace App\Http\Controllers\Api;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\CourseAssignment;
use App\Models\QuizAttempt;
use App\Models\TaskSubmission;
use App\Services\ScoreService;
use App\Services\StreakService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    public function index(Request $request, ScoreService $scoreService, StreakService $streakService): JsonResponse
    {
        $student = $request->user();

        // Courses assigned directly to this student (see
        // CourseAssignmentController docblock re: batch membership not
        // being modeled - same simplification applies here).
        $assignedCourseIds = CourseAssignment::query()
            ->where('student_id', $student->id)
            ->pluck('course_id');

        $totalTasks = \App\Models\DailyTask::query()
            ->whereIn('course_id', $assignedCourseIds)
            ->count();

        $completedTaskCount = TaskSubmission::query()
            ->where('student_id', $student->id)
            ->where('status', TaskStatus::Completed)
            ->count();

        $lateSubmissionCount = TaskSubmission::query()
            ->where('student_id', $student->id)
            ->where('status', TaskStatus::Late)
            ->count();

        $courseCompletionPercent = $totalTasks > 0
            ? round(($completedTaskCount / $totalTasks) * 100, 2)
            : 0.0;

        $quizAttempts = QuizAttempt::query()
            ->where('student_id', $student->id)
            ->get(['id', 'quiz_id', 'score', 'status']);

        $assignmentScores = TaskSubmission::query()
            ->where('student_id', $student->id)
            ->whereNotNull('score')
            ->pluck('score');

        // Streak: current streak per assigned course, keyed by course_id
        // (a student may be assigned multiple courses, each with its own
        // independent streak - there is no single "overall" streak concept
        // in StreakService, which is scoped per Course).
        $streaks = [];
        foreach ($assignedCourseIds as $courseId) {
            $course = \App\Models\Course::find($courseId);
            if ($course !== null) {
                $streaks[$courseId] = $streakService->currentStreak($student, $course);
            }
        }

        return response()->json([
            'course_completion_percent' => $courseCompletionPercent,
            'daily_task_completion_count' => $completedTaskCount,
            'total_daily_tasks' => $totalTasks,
            'quiz_scores' => $quizAttempts,
            'assignment_scores' => $assignmentScores,
            'total_xp' => $scoreService->totalPointsForStudent($student),
            'streaks_by_course' => $streaks,
            'late_submission_count' => $lateSubmissionCount,
        ]);
    }
}
