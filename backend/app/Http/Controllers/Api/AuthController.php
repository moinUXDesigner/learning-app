<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules;

/**
 * Design decision: `register` vs admin-creates-user.
 *
 * `register()` below is ONLY for public self-signup. It always creates a
 * `student` account and requires an `organization_id` referencing an
 * existing organization (the student is joining an org that already
 * exists in the system — self-signup does not create organizations).
 * Any other role (teacher/org_admin) or cross-role user creation is
 * handled by the separate, authenticated Users controller
 * (App\Http\Controllers\Api\UserController::store, using
 * StoreUserRequest), which is restricted to org_admin/super_admin actors.
 * This keeps the public, unauthenticated endpoint minimal and avoids
 * letting anonymous callers choose their own role/organization access
 * level.
 */
class AuthController extends Controller
{
    /**
     * Public self-signup. Always creates a `student` in an existing
     * organization.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'organization_id' => ['required', 'integer', 'exists:organizations,id'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => Role::Student,
            'organization_id' => $validated['organization_id'],
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user->fresh('organization'),
        ], 201);
    }

    /**
     * Sanctum SPA login. Assumes the frontend already hit
     * GET /sanctum/csrf-cookie before calling this endpoint.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
                'errors' => ['email' => ['The provided credentials are incorrect.']],
                'status_code' => 422,
            ], 422);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user->fresh('organization'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('organization'),
        ]);
    }

    /**
     * Send a password-reset link email via Laravel's built-in broker,
     * returning JSON instead of a redirect.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => __($status),
            ]);
        }

        return response()->json([
            'message' => __($status),
            'errors' => ['email' => [__($status)]],
            'status_code' => 422,
        ], 422);
    }

    /**
     * Reset the password via Laravel's built-in broker, returning JSON
     * instead of a redirect.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __($status),
            ]);
        }

        return response()->json([
            'message' => __($status),
            'errors' => ['email' => [__($status)]],
            'status_code' => 422,
        ], 422);
    }
}
