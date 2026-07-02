<?php

namespace App\Models\Concerns;

use App\Models\Scopes\OrganizationScope;

/**
 * Apply this trait to any model that has a direct `organization_id` column
 * and should be automatically scoped to the authenticated user's
 * organization on every query (super_admin bypasses the scope).
 *
 * Deliberately NOT applied to the User model — scoping User queries
 * globally would silently affect authentication/login lookups (e.g.
 * `User::where('email', ...)->first()` during login, before a user is
 * "authenticated" for the purposes of this scope, or password resets,
 * admin user-management screens, etc.) in ways that would be confusing to
 * debug. User org-scoping is instead applied explicitly via `where()`
 * clauses in the relevant controllers.
 */
trait BelongsToOrganization
{
    public static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope(new OrganizationScope);
    }
}
