<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * User is deliberately NOT covered by the global OrganizationScope (see
 * App\Models\Concerns\BelongsToOrganization docblock), so org-scoping for
 * listing/managing users is done explicitly here via `where()` clauses
 * based on the acting user's role.
 */
class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();

        $query = User::query()->with('organization');

        if ($actor->role !== Role::SuperAdmin) {
            $query->where('organization_id', $actor->organization_id);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * org_admin may create teacher/student users in their own org;
     * super_admin may create any role in any org.
     *
     * Password handling: if a password is supplied it is hashed as usual.
     * If omitted, we generate a random temporary password for demo
     * purposes and return it (once) in the response payload so the admin
     * can hand it to the new user out-of-band — there is no mail/queue
     * infrastructure wired up in this phase to email it instead.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $actor = $request->user();
        $validated = $request->validated();

        $targetRole = Role::from($validated['role']);

        if ($actor->role === Role::OrgAdmin) {
            if (! in_array($targetRole, [Role::Teacher, Role::Student], true)) {
                abort(403, 'Org admins may only create teacher or student users.');
            }

            $organizationId = $actor->organization_id;
        } elseif ($actor->role === Role::SuperAdmin) {
            $organizationId = $validated['organization_id'] ?? null;

            if ($targetRole !== Role::SuperAdmin && $organizationId === null) {
                throw ValidationException::withMessages([
                    'organization_id' => ['organization_id is required for non super_admin users.'],
                ]);
            }
        } else {
            abort(403, 'You do not have permission to create users.');
        }

        $generatedPassword = null;

        if (empty($validated['password'])) {
            $generatedPassword = Str::password(12);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($generatedPassword ?? $validated['password']),
            'role' => $targetRole,
            'organization_id' => $organizationId,
        ]);

        $response = ['user' => $user->fresh('organization')];

        if ($generatedPassword !== null) {
            $response['generated_password'] = $generatedPassword;
            $response['message'] = 'No password was supplied, so a temporary password was generated. Share it with the user securely — it will not be shown again.';
        }

        return response()->json($response, 201);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $this->authorizeAccess($request->user(), $user);

        return response()->json($user->load('organization'));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeAccess($actor, $user);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'role' => ['sometimes', 'required', Rule::in(array_map(fn (Role $r) => $r->value, Role::cases()))],
            'organization_id' => ['sometimes', 'nullable', 'integer', 'exists:organizations,id'],
            'status' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        // Only org_admin/super_admin may change role/organization_id; a
        // user editing their own profile cannot self-promote.
        if ((isset($validated['role']) || isset($validated['organization_id']))
            && ! in_array($actor->role, [Role::OrgAdmin, Role::SuperAdmin], true)) {
            abort(403, 'You do not have permission to change role or organization.');
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->fresh('organization'));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();

        if ($actor->id === $user->id) {
            abort(403, 'You cannot delete your own account.');
        }

        if ($actor->role === Role::SuperAdmin) {
            // allowed
        } elseif ($actor->role === Role::OrgAdmin) {
            abort_if($actor->organization_id !== $user->organization_id, 403, 'You cannot manage users outside your organization.');
        } else {
            abort(403, 'You do not have permission to delete users.');
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    /**
     * Shared authorization rule for show/update: a user may always access
     * their own profile; org_admin/super_admin may access users within
     * their remit (own org, or any org for super_admin); anyone else is
     * forbidden.
     */
    private function authorizeAccess(User $actor, User $target): void
    {
        if ($actor->id === $target->id) {
            return;
        }

        if ($actor->role === Role::SuperAdmin) {
            return;
        }

        if ($actor->role === Role::OrgAdmin && $actor->organization_id === $target->organization_id) {
            return;
        }

        abort(403, 'You do not have permission to access this user.');
    }
}
