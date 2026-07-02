<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserBelongsToOrganization
{
    /**
     * Handle an incoming request.
     *
     * Guards against a data-integrity problem: any authenticated, non
     * super_admin user must have an organization_id. Super admins are
     * intentionally organization-less (they operate across all orgs).
     *
     * The actual per-query org scoping (restricting *which* rows a user can
     * see/touch) is handled separately by the global OrganizationScope
     * applied to org-scoped models (see App\Models\Scopes\OrganizationScope
     * and App\Models\Concerns\BelongsToOrganization). This middleware's job
     * is only the guard described above.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role !== Role::SuperAdmin && $user->organization_id === null) {
            return response()->json([
                'message' => 'Your account is not associated with an organization.',
                'errors' => [],
                'status_code' => 403,
            ], 403);
        }

        return $next($request);
    }
}
