<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDailyTaskRequest;
use App\Http\Requests\UpdateDailyTaskRequest;
use App\Models\DailyTask;
use App\Models\LearningPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

/**
 * DailyTasks are nested under a LearningPlan. The FormRequests
 * (StoreDailyTaskRequest/UpdateDailyTaskRequest) deliberately defer the
 * "due_time vs. LearningPlan" cross-model check to this controller,
 * where the parent LearningPlan is available to compare against.
 *
 * Cross-validation rule (documented, since the spec left exact judgment
 * to us): a LearningPlan has no explicit `start_date` column — only
 * `duration_days` and a `created_at` timestamp — so we treat
 * `learning_plan->created_at` as day 1 of the plan (its effective start).
 * For a given `day_number`:
 *   - lower bound: due_time must be >= created_at + (day_number - 1) days
 *     (a day-N task cannot be due before day N of the plan has begun).
 *   - upper bound: due_time must be <= created_at + duration_days days
 *     (a task cannot be due after the plan's overall duration window ends).
 *   - day_number itself must be <= duration_days (validated here too,
 *     since StoreDailyTaskRequest only checks day_number >= 1 without
 *     plan context).
 * These are floor/ceiling checks rather than an exact-day match, to allow
 * reasonable scheduling flexibility (e.g. a day-3 task due slightly later
 * in the day-3..day-5 range is fine; what we guard against is due dates
 * that are nonsensical relative to the plan's timeline).
 */
class DailyTaskController extends Controller
{
    public function index(LearningPlan $learningPlan): JsonResponse
    {
        $this->authorize('view', $learningPlan->course);

        return response()->json(
            $learningPlan->dailyTasks()->orderBy('day_number')->paginate(15)
        );
    }

    public function store(StoreDailyTaskRequest $request, LearningPlan $learningPlan): JsonResponse
    {
        $this->authorize('update', $learningPlan->course);

        $validated = $request->validated();
        $this->validateAgainstPlan($learningPlan, $validated['day_number'], $validated['due_time']);

        $dailyTask = $learningPlan->dailyTasks()->create($validated + [
            'course_id' => $learningPlan->course_id,
        ]);

        return response()->json($dailyTask, 201);
    }

    public function show(DailyTask $dailyTask): JsonResponse
    {
        $this->authorize('view', $dailyTask->course);

        return response()->json($dailyTask->load(['learningPlan', 'course', 'module', 'lesson']));
    }

    public function update(UpdateDailyTaskRequest $request, DailyTask $dailyTask): JsonResponse
    {
        $this->authorize('update', $dailyTask->course);

        $validated = $request->validated();

        $learningPlan = isset($validated['learning_plan_id'])
            ? LearningPlan::findOrFail($validated['learning_plan_id'])
            : $dailyTask->learningPlan;

        $dayNumber = $validated['day_number'] ?? $dailyTask->day_number;
        $dueTime = $validated['due_time'] ?? $dailyTask->due_time;

        if ($dueTime !== null) {
            $this->validateAgainstPlan($learningPlan, $dayNumber, $dueTime);
        }

        $dailyTask->update($validated);

        return response()->json($dailyTask->fresh(['learningPlan', 'course', 'module', 'lesson']));
    }

    public function destroy(DailyTask $dailyTask): JsonResponse
    {
        $this->authorize('update', $dailyTask->course);

        $dailyTask->delete();

        return response()->json(['message' => 'Daily task deleted.']);
    }

    private function validateAgainstPlan(LearningPlan $learningPlan, int $dayNumber, string $dueTime): void
    {
        if ($dayNumber > $learningPlan->duration_days) {
            throw ValidationException::withMessages([
                'day_number' => ["day_number ({$dayNumber}) cannot exceed the learning plan's duration_days ({$learningPlan->duration_days})."],
            ]);
        }

        $planStart = $learningPlan->created_at->copy()->startOfDay();
        $lowerBound = $planStart->copy()->addDays($dayNumber - 1);
        $upperBound = $planStart->copy()->addDays($learningPlan->duration_days);

        $due = \Illuminate\Support\Carbon::parse($dueTime);

        if ($due->lt($lowerBound)) {
            throw ValidationException::withMessages([
                'due_time' => ["due_time cannot be before day {$dayNumber} of the learning plan ({$lowerBound->toDateString()})."],
            ]);
        }

        if ($due->gt($upperBound)) {
            throw ValidationException::withMessages([
                'due_time' => ["due_time cannot be after the learning plan's duration window ends ({$upperBound->toDateString()})."],
            ]);
        }
    }
}
