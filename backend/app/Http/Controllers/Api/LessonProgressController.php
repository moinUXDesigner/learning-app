<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Services\ScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonProgressController extends Controller
{
    /**
     * Beacon endpoint: upserts watch progress for the authenticated
     * student on the given lesson. `watched_seconds` only ever moves
     * forward (max of existing/new) so out-of-order/duplicate beacons
     * from the player can't regress progress. `completed_at` is set once,
     * the first time `completed=true` is received, and never overwritten
     * afterward - the lesson-watch score award is tied to that first
     * transition so it stays idempotent even though ScoreService's own
     * awardForLessonWatch is also idempotent independently.
     */
    public function track(Request $request, Lesson $lesson): JsonResponse
    {
        $validated = $request->validate([
            'watched_seconds' => ['required', 'integer', 'min:0'],
            'completed' => ['nullable', 'boolean'],
        ]);

        $student = $request->user();

        $progress = LessonProgress::firstOrNew([
            'student_id' => $student->id,
            'lesson_id' => $lesson->id,
        ]);

        $progress->watched_seconds = max((int) ($progress->watched_seconds ?? 0), $validated['watched_seconds']);

        $isNewlyCompleted = false;

        if ($request->boolean('completed') && $progress->completed_at === null) {
            $progress->completed_at = now();
            $isNewlyCompleted = true;
        }

        $progress->save();

        if ($isNewlyCompleted) {
            app(ScoreService::class)->awardForLessonWatch($student, $lesson);
        }

        return response()->json($progress->fresh());
    }
}
