<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LearningPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Learning plans are nested under a Course. Writes are authorized against
 * the parent Course's policy.
 */
class LearningPlanController extends Controller
{
    public function index(Course $course): JsonResponse
    {
        $this->authorize('view', $course);

        return response()->json(
            $course->learningPlans()->paginate(15)
        );
    }

    public function store(Request $request, Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
        ]);

        $learningPlan = $course->learningPlans()->create($validated);

        return response()->json($learningPlan, 201);
    }

    public function show(LearningPlan $learningPlan): JsonResponse
    {
        $this->authorize('view', $learningPlan->course);

        return response()->json($learningPlan->load('course'));
    }

    public function update(Request $request, LearningPlan $learningPlan): JsonResponse
    {
        $this->authorize('update', $learningPlan->course);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'duration_days' => ['sometimes', 'required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
        ]);

        $learningPlan->update($validated);

        return response()->json($learningPlan->fresh());
    }

    public function destroy(LearningPlan $learningPlan): JsonResponse
    {
        $this->authorize('update', $learningPlan->course);

        $learningPlan->delete();

        return response()->json(['message' => 'Learning plan deleted.']);
    }
}
