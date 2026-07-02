<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Services\ScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * `quiz_attempts.status` is a plain string column (not enum-cast on the
 * model - see App\Models\QuizAttempt), defaulting to "in_progress" per the
 * migration. Since grading happens synchronously and atomically in
 * `attempt()` below, we go straight from creation to a final "pass"/"fail"
 * status - "in_progress" is never actually used by this controller (there
 * is no partial/resume-later attempt flow in this phase).
 */
class QuizAttemptController extends Controller
{
    public function attempt(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('attempt', $quiz);

        $validated = $request->validate([
            'answers' => ['required', 'array', 'min:1'],
            'answers.*.question_id' => ['required', 'integer', 'exists:questions,id'],
            'answers.*.submitted_answer' => ['nullable', 'string'],
        ]);

        $student = $request->user();
        $questions = $quiz->questions()->get()->keyBy('id');

        $attempt = DB::transaction(function () use ($validated, $quiz, $student, $questions) {
            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'student_id' => $student->id,
                'score' => 0,
                'status' => 'in_progress',
                'attempted_at' => now(),
            ]);

            $totalScore = 0;

            foreach ($validated['answers'] as $answer) {
                $question = $questions->get($answer['question_id']);

                if ($question === null) {
                    continue;
                }

                $submitted = $answer['submitted_answer'] ?? null;
                $isCorrect = $submitted !== null && $submitted === $question->correct_answer;

                if ($isCorrect) {
                    $totalScore += (int) $question->marks;
                }

                $attempt->answers()->create([
                    'question_id' => $question->id,
                    'submitted_answer' => $submitted,
                    'is_correct' => $isCorrect,
                ]);
            }

            $status = $totalScore >= $quiz->pass_marks ? 'pass' : 'fail';

            $attempt->update([
                'score' => $totalScore,
                'status' => $status,
            ]);

            return $attempt;
        });

        $scoreService = app(ScoreService::class);
        $scoreService->awardForQuizPass($student, $attempt->fresh('quiz'));

        return response()->json($attempt->fresh(['quiz', 'answers', 'student']), 201);
    }
}
