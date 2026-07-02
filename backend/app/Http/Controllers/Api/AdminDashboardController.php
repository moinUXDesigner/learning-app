<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Enums\TaskStatus;
use App\Models\Course;
use App\Models\TaskSubmission;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Org-scoped for org_admin (their own organization_id only), global for
 * super_admin. Course::status counts use the model's global
 * OrganizationScope (via BelongsToOrganization) which already restricts
 * org_admin to their own org automatically and is bypassed for
 * super_admin - see App\Models\Scopes\OrganizationScope /
 * App\Models\Concerns\BelongsToOrganization. User counts are done
 * explicitly since User is deliberately NOT globally org-scoped (same
 * pattern already used in UserController).
 */
class AdminDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        $isGlobal = $actor->role === Role::SuperAdmin;

        $userQuery = fn () => User::query()->when(! $isGlobal, fn ($q) => $q->where('organization_id', $actor->organization_id));

        $totalUsers = (clone $userQuery())->count();
        $totalTeachers = (clone $userQuery())->where('role', Role::Teacher)->count();
        $totalStudents = (clone $userQuery())->where('role', Role::Student)->count();

        // Course::query() is automatically org-scoped by OrganizationScope
        // for org_admin, and unrestricted for super_admin.
        $totalCourses = Course::query()->count();

        $courseStatusBreakdown = Course::query()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Active students: students who have submitted at least one task,
        // scoped to courses within this org (or globally for super_admin).
        //
        // BUGFIX: this must be a closure (not an eagerly-built Builder) so
        // `(clone $submissionQuery())` below can call it - a plain Builder
        // instance is not callable and throws "Object of type
        // Illuminate\Database\Eloquent\Builder is not callable" (see the
        // same pattern correctly used as a closure in
        // TeacherDashboardController::index()).
        $submissionQuery = fn () => TaskSubmission::query()
            ->whereHas('dailyTask.course', function ($q) use ($isGlobal, $actor) {
                if (! $isGlobal) {
                    $q->where('organization_id', $actor->organization_id);
                }
            });

        $activeStudentsCount = (clone $submissionQuery())->distinct('student_id')->count('student_id');

        $totalSubmissions = (clone $submissionQuery())->count();
        $completedSubmissions = (clone $submissionQuery())->where('status', TaskStatus::Completed->value)->count();

        $completionRate = $totalSubmissions > 0
            ? round(($completedSubmissions / $totalSubmissions) * 100, 2)
            : 0.0;

        return response()->json([
            'total_users' => $totalUsers,
            'total_teachers' => $totalTeachers,
            'total_students' => $totalStudents,
            'total_courses' => $totalCourses,
            'course_status_breakdown' => $courseStatusBreakdown,
            'active_students_count' => $activeStudentsCount,
            'completion_rate' => $completionRate,
        ]);
    }
}
