<?php

namespace App\Policies;

use App\Enums\CourseStatus;
use App\Enums\Role;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\User;

class CourseAssignmentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, CourseAssignment $assignment): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        if ($user->id === $assignment->student_id || $user->id === $assignment->teacher_id) {
            return true;
        }

        $course = $assignment->course;

        return $course !== null && $user->organization_id === $course->organization_id
            && in_array($user->role, [Role::OrgAdmin, Role::Teacher], true);
    }

    /**
     * A course assignment may only be created for a course that has
     * passed the approval workflow (Approved or Published) — the same
     * rule as CoursePolicy::assign — and only by a teacher/org_admin/
     * super_admin belonging to that course's organization.
     *
     * Note: this ability takes no model argument since the target course
     * isn't known ahead of time from route binding alone; callers should
     * invoke it as `$user->can('create', [CourseAssignment::class, $course])`.
     */
    public function create(User $user, Course $course): bool
    {
        if (! in_array($user->role, [Role::Teacher, Role::OrgAdmin, Role::SuperAdmin], true)) {
            return false;
        }

        if ($user->role !== Role::SuperAdmin && $user->organization_id !== $course->organization_id) {
            return false;
        }

        return in_array($course->status, [CourseStatus::Approved, CourseStatus::Published], true);
    }

    public function update(User $user, CourseAssignment $assignment): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        $course = $assignment->course;

        if ($course === null || $user->organization_id !== $course->organization_id) {
            return false;
        }

        if ($user->role === Role::OrgAdmin) {
            return true;
        }

        return $user->role === Role::Teacher && $user->id === $assignment->teacher_id;
    }

    public function delete(User $user, CourseAssignment $assignment): bool
    {
        return $this->update($user, $assignment);
    }
}
