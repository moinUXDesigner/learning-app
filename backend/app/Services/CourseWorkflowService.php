<?php

namespace App\Services;

use App\Enums\CourseStatus;
use App\Enums\Role;
use App\Exceptions\InvalidCourseTransitionException;
use App\Models\Course;
use App\Models\User;

/**
 * Owns the Course approval-workflow state machine. Controllers should call
 * transition() rather than mutating $course->status directly, so the legal
 * transition graph and actor authorization stay centralized.
 *
 * Allowed transitions (see ALLOWED_TRANSITIONS below):
 *   Draft                 -> SubmittedForApproval
 *   SubmittedForApproval  -> Approved
 *   SubmittedForApproval  -> Rejected
 *   Approved              -> Published
 *   Approved              -> Draft      (admin revert, to unlock teacher edits)
 *   Published             -> Draft      (admin revert, to unlock teacher edits)
 *   Published             -> Archived
 *   Rejected              -> Draft      (revert so the teacher can rework it)
 *
 * Design decision (Approved -> Published actor rule): the spec left this
 * open ("your call, document it"). We allow either an org_admin/super_admin
 * OR the teacher who owns the course (created_by) to publish an Approved
 * course. Rationale: approval is the actual quality gate (org admin only);
 * once approved, letting the owning teacher flip it live avoids forcing an
 * admin to babysit every publish and matches how the approval step already
 * did the gatekeeping.
 */
class CourseWorkflowService
{
    /**
     * @var array<string, array<string>> map of "from status value" => list of allowed "to status values"
     */
    private const ALLOWED_TRANSITIONS = [
        'draft' => ['submitted_for_approval'],
        'submitted_for_approval' => ['approved', 'rejected'],
        'approved' => ['published', 'draft'],
        'rejected' => ['draft'],
        'published' => ['archived', 'draft'],
        'archived' => [],
    ];

    public function transition(Course $course, CourseStatus $newStatus, User $actor): Course
    {
        $from = $course->status;

        if (! in_array($newStatus->value, self::ALLOWED_TRANSITIONS[$from->value] ?? [], true)) {
            throw InvalidCourseTransitionException::forTransition($from, $newStatus);
        }

        if (! $this->isAuthorized($course, $from, $newStatus, $actor)) {
            throw InvalidCourseTransitionException::unauthorized($from, $newStatus);
        }

        $course->status = $newStatus;

        match (true) {
            $from === CourseStatus::SubmittedForApproval && $newStatus === CourseStatus::Approved => $this->markApproved($course, $actor),
            $newStatus === CourseStatus::Rejected => $this->clearApproval($course),
            $newStatus === CourseStatus::Draft => $this->clearApproval($course),
            default => null,
        };

        $course->save();

        return $course;
    }

    private function isAuthorized(Course $course, CourseStatus $from, CourseStatus $to, User $actor): bool
    {
        $isSuperAdmin = $actor->role === Role::SuperAdmin;
        $isOrgAdmin = $actor->role === Role::OrgAdmin && $actor->organization_id === $course->organization_id;
        $isOwningTeacher = $actor->role === Role::Teacher && $actor->id === $course->created_by;

        return match (true) {
            // Draft -> SubmittedForApproval: creator/teacher-owner, or org_admin/super_admin.
            $from === CourseStatus::Draft && $to === CourseStatus::SubmittedForApproval
                => $isSuperAdmin || $isOrgAdmin || $isOwningTeacher,

            // SubmittedForApproval -> Approved: org_admin/super_admin only.
            $from === CourseStatus::SubmittedForApproval && $to === CourseStatus::Approved
                => $isSuperAdmin || $isOrgAdmin,

            // SubmittedForApproval -> Rejected: org_admin/super_admin only.
            $from === CourseStatus::SubmittedForApproval && $to === CourseStatus::Rejected
                => $isSuperAdmin || $isOrgAdmin,

            // Approved -> Published: org_admin/super_admin, or the owning teacher (see class docblock).
            $from === CourseStatus::Approved && $to === CourseStatus::Published
                => $isSuperAdmin || $isOrgAdmin || $isOwningTeacher,

            // Rejected -> Draft: any authorized org admin or the teacher-owner.
            $from === CourseStatus::Rejected && $to === CourseStatus::Draft
                => $isSuperAdmin || $isOrgAdmin || $isOwningTeacher,

            // Approved/Published -> Draft: admin-only revert.
            in_array($from, [CourseStatus::Approved, CourseStatus::Published], true) && $to === CourseStatus::Draft
                => $isSuperAdmin || $isOrgAdmin,

            // Published -> Archived: org_admin/super_admin only.
            $from === CourseStatus::Published && $to === CourseStatus::Archived
                => $isSuperAdmin || $isOrgAdmin,

            default => false,
        };
    }

    private function markApproved(Course $course, User $actor): void
    {
        $course->approved_by = $actor->id;
        $course->approved_at = now();
    }

    private function clearApproval(Course $course): void
    {
        $course->approved_by = null;
        $course->approved_at = null;
    }
}
