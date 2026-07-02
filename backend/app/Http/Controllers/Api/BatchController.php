<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BatchController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Batch::class);

        return response()->json(
            Batch::query()->with(['organization', 'teacher'])->paginate(15)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Batch::class);

        $validated = $request->validate([
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $batch = Batch::create($validated + [
            'organization_id' => $request->user()->organization_id,
        ]);

        return response()->json($batch, 201);
    }

    public function show(Batch $batch): JsonResponse
    {
        $this->authorize('view', $batch);

        return response()->json($batch->load(['organization', 'teacher']));
    }

    public function update(Request $request, Batch $batch): JsonResponse
    {
        $this->authorize('update', $batch);

        $validated = $request->validate([
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $batch->update($validated);

        return response()->json($batch->fresh(['organization', 'teacher']));
    }

    public function destroy(Batch $batch): JsonResponse
    {
        $this->authorize('delete', $batch);

        $batch->delete();

        return response()->json(['message' => 'Batch deleted.']);
    }
}
