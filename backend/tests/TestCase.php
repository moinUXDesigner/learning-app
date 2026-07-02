<?php

namespace Tests;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Create (via factory) and authenticate a user with the given role,
     * using the matching factory state, attached to $org if given or a
     * freshly-created organization otherwise.
     *
     * Super admins are intentionally organization-less (see UserFactory::
     * superAdmin()), so $org is ignored for that role.
     */
    protected function actingAsRole(string $role, ?Organization $org = null): User
    {
        $factory = User::factory();

        $user = match ($role) {
            'super_admin' => $factory->superAdmin()->create(),
            'org_admin' => $factory->orgAdmin()->create($org ? ['organization_id' => $org->id] : []),
            'teacher' => $factory->teacher()->create($org ? ['organization_id' => $org->id] : []),
            'student' => $factory->student()->create($org ? ['organization_id' => $org->id] : []),
            default => throw new \InvalidArgumentException("Unknown role: {$role}"),
        };

        $this->actingAs($user);

        return $user;
    }
}
