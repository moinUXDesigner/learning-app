<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * Usage: ->middleware('role:org_admin,super_admin')
     *
     * Middleware parameters are always passed as strings, so we compare
     * against the enum's ->value rather than the enum instance itself.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->role || ! in_array($user->role->value, $roles, true)) {
            return response()->json([
                'message' => 'You do not have permission to perform this action.',
                'errors' => [],
                'status_code' => 403,
            ], 403);
        }

        return $next($request);
    }
}
