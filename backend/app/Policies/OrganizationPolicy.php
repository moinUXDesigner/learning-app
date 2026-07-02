<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy
{
    /**
     * Super admins can list/see all organizations; everyone else only
     * ever deals with their own (enforced per-record in view()/update()).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Super admin can view any organization; everyone else may only view
     * their own.
     */
    public function view(User $user, Organization $organization): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        return $user->organization_id === $organization->id;
    }

    /**
     * Only super admins create organizations (tenant onboarding).
     */
    public function create(User $user): bool
    {
        return $user->role === Role::SuperAdmin;
    }

    /**
     * Super admin can update any organization. Org admins may update only
     * their own organization. Teachers/students have no write access.
     */
    public function update(User $user, Organization $organization): bool
    {
        if ($user->role === Role::SuperAdmin) {
            return true;
        }

        return $user->role === Role::OrgAdmin && $user->organization_id === $organization->id;
    }

    /**
     * Only super admins may delete an organization.
     */
    public function delete(User $user, Organization $organization): bool
    {
        return $user->role === Role::SuperAdmin;
    }
}
