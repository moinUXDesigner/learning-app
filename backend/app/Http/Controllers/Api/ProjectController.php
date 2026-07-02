<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Projects are nested under a Course. Writes are authorized against the
 * parent Course's policy, same pattern as Modules/Lessons/LearningPlans.
 */
class ProjectController extends Controller
{
    public function index(Course $course): JsonResponse
    {
        $this->authorize('view', $course);

        return response()->json(
            $course->projects()->paginate(15)
        );
    }

    public function store(Request $request, Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'points' => ['nullable', 'integer', 'min:0'],
            'deadline' => ['nullable', 'date'],
            'rubric' => ['nullable', 'array'],
        ]);

        $project = $course->projects()->create($validated);

        return response()->json($project, 201);
    }

    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project->course);

        return response()->json($project->load('course'));
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project->course);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'points' => ['nullable', 'integer', 'min:0'],
            'deadline' => ['nullable', 'date'],
            'rubric' => ['nullable', 'array'],
        ]);

        $project->update($validated);

        return response()->json($project->fresh());
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->authorize('update', $project->course);

        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }
}
