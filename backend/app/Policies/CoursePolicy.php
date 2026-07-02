<?php

namespace App\Policies;

use App\Enums\CourseStatus;
use App\Enums\Role;
use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    /**
     * Org-scoped defense-in-depth check for listing courses. Actual query
     * filtering happens via the OrganizationScope global scope; this only
     * guards the ability to hit the endpoint at all.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Org-scoped single-record check (defense in depth on top of the
     * global scope): a user may view a course only if it belongs to their
     * own organization, or they are a super_admin.
     */
    public function view(User $user, Course $course): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        return $user->organization_id === $course->organization_id;
    }

    /**
     * Teachers, org admins and super admins may propose/create courses.
     * Students cannot.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Teacher, Role::OrgAdmin, Role::SuperAdmin], true);
    }

    /**
     * Org admins/super admins may always update a course in their org.
     * Teachers may only update courses they created themselves, and only
     * while the course is still in Draft or Rejected status — once it has
     * been Submitted/Approved/Published/Archived, teacher edits are locked
     * out (org admins can revert status back to Draft via a separate
     * workflow action, not via this policy).
     */
    public function update(User $user, Course $course): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        if ($user->role === Role::OrgAdmin) {
            return $user->organization_id === $course->organization_id;
        }

        if ($user->role === Role::Teacher) {
            return $user->id === $course->created_by
                && in_array($course->status, [CourseStatus::Draft, CourseStatus::Rejected], true);
        }

        return false;
    }

    /**
     * Only org admins/super admins may delete courses.
     */
    public function delete(User $user, Course $course): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        return $user->role === Role::OrgAdmin && $user->organization_id === $course->organization_id;
    }

    /**
     * Custom ability: `$user->can('assign', $course)`.
     *
     * A course can only be assigned to students/batches once it has passed
     * the approval workflow (Approved or Published).
     */
    public function assign(User $user, Course $course): bool
    {
        if (! in_array($user->role, [Role::Teacher, Role::OrgAdmin, Role::SuperAdmin], true)) {
            return false;
        }

        if ($user->role !== Role::SuperAdmin && $user->organization_id !== $course->organization_id) {
            return false;
        }

        return in_array($course->status, [CourseStatus::Approved, CourseStatus::Published], true);
    }
}
