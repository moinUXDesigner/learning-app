<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Subscription plans are a super_admin-only concept (they represent the
 * SaaS's own billing tiers, not something an org_admin manages). Per the
 * "keep RBAC simple" precedent from Phase 3, write operations here use a
 * plain role check rather than a dedicated policy class — there's only
 * one rule ("must be super_admin") and it doesn't vary per-record.
 */
class SubscriptionPlanController extends Controller
{
    /**
     * Read access is open to any authenticated user (e.g. an org_admin
     * needs to see available plans when choosing/upgrading one for their
     * organization). Only mutations are super_admin-gated.
     */
    public function index(): JsonResponse
    {
        return response()->json(SubscriptionPlan::query()->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'max_users' => ['nullable', 'integer', 'min:0'],
            'max_courses' => ['nullable', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
        ]);

        $plan = SubscriptionPlan::create($validated);

        return response()->json($plan, 201);
    }

    public function show(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        return response()->json($subscriptionPlan);
    }

    public function update(Request $request, SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'max_users' => ['nullable', 'integer', 'min:0'],
            'max_courses' => ['nullable', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
        ]);

        $subscriptionPlan->update($validated);

        return response()->json($subscriptionPlan);
    }

    public function destroy(Request $request, SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $subscriptionPlan->delete();

        return response()->json(['message' => 'Subscription plan deleted.']);
    }

    private function ensureSuperAdmin(Request $request): void
    {
        abort_if($request->user()?->role !== Role::SuperAdmin, 403, 'Only super admins may manage subscription plans.');
    }
}
