<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\TaskSubmission;
use App\Models\User;

class TaskSubmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * A student may view only their own submission. A teacher/org
     * admin/super admin may view a submission for any student, as long as
     * it belongs to their own organization (traced via
     * submission -> dailyTask -> course -> organization_id). This
     * explicitly prevents a student from viewing another student's
     * submission.
     */
    public function view(User $user, TaskSubmission $submission): bool
    {
        if ($user->id === $submission->student_id) {
            return true;
        }

        if ($user->role === Role::Student) {
            return false;
        }

        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        $course = $submission->dailyTask?->course;

        return $course !== null && $user->organization_id === $course->organization_id;
    }

    /**
     * Only teacher/org_admin/super_admin may review (grade/give feedback
     * on) a submission. A teacher may only review submissions for courses
     * within their own organization (course ownership by a specific
     * teacher is enforced at the CourseAssignment level, not required
     * here — any teacher in the org may review, matching "only
     * teacher/admin can review submissions").
     */
    public function review(User $user, TaskSubmission $submission): bool
    {
        if (! in_array($user->role, [Role::Teacher, Role::OrgAdmin, Role::SuperAdmin], true)) {
            return false;
        }

        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        $course = $submission->dailyTask?->course;

        return $course !== null && $user->organization_id === $course->organization_id;
    }
}
