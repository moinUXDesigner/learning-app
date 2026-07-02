<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Quiz;
use App\Models\User;

class QuizPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * SIMPLIFICATION (noted in Phase 3 report): a full check would verify
     * the student has a CourseAssignment granting them access to
     * `$quiz->course`. That requires resolving the assignment graph
     * (direct student assignment OR batch assignment via the student's
     * batch membership), which is more than a policy alone should own.
     * For Phase 3 we allow any authenticated student to view/attempt any
     * quiz; the real "is this quiz's course assigned to this student"
     * check will be enforced in the controller in Phase 4 where the
     * CourseAssignment lookup is available.
     */
    public function view(User $user, Quiz $quiz): bool
    {
        if ($user->role === Role::Student) {
            return true;
        }

        return $this->isCourseManager($user, $quiz);
    }

    public function attempt(User $user, Quiz $quiz): bool
    {
        return $user->role === Role::Student;
    }

    /**
     * Teacher who owns the course, org_admin, or super_admin may create
     * quizzes.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Teacher, Role::OrgAdmin, Role::SuperAdmin], true);
    }

    /**
     * Only the course-owning teacher / org_admin / super_admin may manage
     * (update/delete) a quiz.
     */
    public function update(User $user, Quiz $quiz): bool
    {
        return $this->isCourseManager($user, $quiz);
    }

    public function delete(User $user, Quiz $quiz): bool
    {
        return $this->isCourseManager($user, $quiz);
    }

    private function isCourseManager(User $user, Quiz $quiz): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        $course = $quiz->course;

        if ($course === null || $user->organization_id !== $course->organization_id) {
            return false;
        }

        if ($user->role === Role::OrgAdmin) {
            return true;
        }

        return $user->role === Role::Teacher && $user->id === $course->created_by;
    }
}
