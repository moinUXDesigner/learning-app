<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Batch;
use App\Models\User;

class BatchPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Org admin/super admin/the assigned teacher can view a batch. A
     * student may view a batch only if they have a CourseAssignment tied
     * to that batch (the only modeled student<->batch relationship);
     * otherwise they have no access.
     */
    public function view(User $user, Batch $batch): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        if ($user->organization_id !== $batch->organization_id) {
            return false;
        }

        if ($user->role === Role::OrgAdmin) {
            return true;
        }

        if ($user->role === Role::Teacher) {
            return $user->id === $batch->teacher_id;
        }

        if ($user->role === Role::Student) {
            return $batch->courseAssignments()->where('student_id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Org admin/super admin may create batches for their org. Teachers may
     * not create batches (batch creation is an administrative action);
     * students never can.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, [Role::OrgAdmin, Role::SuperAdmin], true);
    }

    /**
     * Org admin/super admin can manage any batch in their org. A teacher
     * may manage a batch only if they are the assigned teacher for it.
     */
    public function update(User $user, Batch $batch): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        if ($user->organization_id !== $batch->organization_id) {
            return false;
        }

        if ($user->role === Role::OrgAdmin) {
            return true;
        }

        if ($user->role === Role::Teacher) {
            return $user->id === $batch->teacher_id;
        }

        return false;
    }

    public function delete(User $user, Batch $batch): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        return $user->role === Role::OrgAdmin && $user->organization_id === $batch->organization_id;
    }
}
