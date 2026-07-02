<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lessons are nested under a Module (which belongs to a Course). Writes
 * are authorized against the grandparent Course's policy, same rule as
 * ModuleController.
 */
class LessonController extends Controller
{
    public function index(Module $module): JsonResponse
    {
        $this->authorize('view', $module->course);

        return response()->json(
            $module->lessons()->orderBy('order')->paginate(15)
        );
    }

    public function store(Request $request, Module $module): JsonResponse
    {
        $this->authorize('update', $module->course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:2048'],
            'video_start_seconds' => ['nullable', 'integer', 'min:0'],
            'video_end_seconds' => ['nullable', 'integer', 'min:0', 'gte:video_start_seconds'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $lesson = $module->lessons()->create($validated);

        return response()->json($lesson, 201);
    }

    public function show(Lesson $lesson): JsonResponse
    {
        $this->authorize('view', $lesson->module->course);

        return response()->json($lesson->load('module'));
    }

    public function update(Request $request, Lesson $lesson): JsonResponse
    {
        $this->authorize('update', $lesson->module->course);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:2048'],
            'video_start_seconds' => ['nullable', 'integer', 'min:0'],
            'video_end_seconds' => ['nullable', 'integer', 'min:0', 'gte:video_start_seconds'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $lesson->update($validated);

        return response()->json($lesson->fresh());
    }

    public function destroy(Lesson $lesson): JsonResponse
    {
        $this->authorize('update', $lesson->module->course);

        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted.']);
    }
}
