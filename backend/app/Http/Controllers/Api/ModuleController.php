<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Modules are nested under a Course. Writes are authorized against the
 * parent Course's policy ('update' ability — the same rule that governs
 * whether the course itself may be edited). Reads are lenient: any org
 * member who can view the course can view its modules.
 */
class ModuleController extends Controller
{
    public function index(Course $course): JsonResponse
    {
        $this->authorize('view', $course);

        return response()->json(
            $course->modules()->orderBy('order')->paginate(15)
        );
    }

    public function store(Request $request, Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $module = $course->modules()->create($validated);

        return response()->json($module, 201);
    }

    public function show(Module $module): JsonResponse
    {
        $this->authorize('view', $module->course);

        return response()->json($module->load('course'));
    }

    public function update(Request $request, Module $module): JsonResponse
    {
        $this->authorize('update', $module->course);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $module->update($validated);

        return response()->json($module->fresh());
    }

    public function destroy(Module $module): JsonResponse
    {
        $this->authorize('update', $module->course);

        $module->delete();

        return response()->json(['message' => 'Module deleted.']);
    }
}
