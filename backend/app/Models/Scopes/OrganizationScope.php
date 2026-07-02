<?php

namespace App\Models\Scopes;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class OrganizationScope implements Scope
{
    /**
     * Automatically scope queries on the model to the authenticated user's
     * organization, unless the authenticated user is a super_admin (who can
     * see everything) or there is no authenticated user at all (console
     * commands, tests, unauthenticated contexts) — in which case scoping is
     * skipped rather than raising an error.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (! auth()->check()) {
            return;
        }

        $user = auth()->user();

        if (! $user || $user->role === Role::SuperAdmin) {
            return;
        }

        $builder->where($model->getTable().'.organization_id', $user->organization_id);
    }
}
