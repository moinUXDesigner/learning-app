<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * super_admin sees all organizations; everyone else only ever sees
     * their own (still returned as a paginated list for frontend
     * consistency, even though it's effectively a single item).
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Organization::class);

        $user = $request->user();

        $query = Organization::query()->with('subscriptionPlan');

        if ($user->role !== Role::SuperAdmin) {
            $query->where('id', $user->organization_id);
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Organization::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'logo' => ['nullable', 'string', 'max:2048'],
            'domain' => ['nullable', 'string', 'max:255'],
            'subscription_plan_id' => ['nullable', 'integer', 'exists:subscription_plans,id'],
            'status' => ['nullable', 'string', 'max:255'],
        ]);

        $organization = Organization::create($validated);

        return response()->json($organization, 201);
    }

    public function show(Organization $organization): JsonResponse
    {
        $this->authorize('view', $organization);

        return response()->json($organization->load('subscriptionPlan'));
    }

    public function update(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'logo' => ['nullable', 'string', 'max:2048'],
            'domain' => ['nullable', 'string', 'max:255'],
            'subscription_plan_id' => ['nullable', 'integer', 'exists:subscription_plans,id'],
            'status' => ['nullable', 'string', 'max:255'],
        ]);

        $organization->update($validated);

        return response()->json($organization);
    }

    public function destroy(Organization $organization): JsonResponse
    {
        $this->authorize('delete', $organization);

        $organization->delete();

        return response()->json(['message' => 'Organization deleted.']);
    }
}
