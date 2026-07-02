<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionResource;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Questions are nested under a Quiz. Writes are authorized against the
 * parent Quiz's policy (teacher/org_admin/super_admin only); reads are
 * open to any authenticated user (including students, who attempt the
 * quiz), but correct_answer is stripped for students via QuestionResource.
 */
class QuestionController extends Controller
{
    public function index(Quiz $quiz): AnonymousResourceCollection
    {
        $this->authorize('view', $quiz);

        return QuestionResource::collection(
            $quiz->questions()->paginate(15)
        );
    }

    public function store(Request $request, Quiz $quiz): QuestionResource
    {
        $this->authorize('update', $quiz);

        $validated = $request->validate([
            'question_text' => ['required', 'string'],
            'question_type' => ['required', 'string'],
            'options' => ['nullable', 'array'],
            'correct_answer' => ['required', 'string'],
            'marks' => ['required', 'integer', 'min:1'],
        ]);

        $question = $quiz->questions()->create($validated);

        return new QuestionResource($question);
    }

    public function show(Question $question): QuestionResource
    {
        $this->authorize('view', $question->quiz);

        return new QuestionResource($question);
    }

    public function update(Request $request, Question $question): QuestionResource
    {
        $this->authorize('update', $question->quiz);

        $validated = $request->validate([
            'question_text' => ['sometimes', 'required', 'string'],
            'question_type' => ['sometimes', 'required', 'string'],
            'options' => ['nullable', 'array'],
            'correct_answer' => ['sometimes', 'required', 'string'],
            'marks' => ['sometimes', 'required', 'integer', 'min:1'],
        ]);

        $question->update($validated);

        return new QuestionResource($question->fresh());
    }

    public function destroy(Question $question): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $question->quiz);

        $question->delete();

        return response()->json(['message' => 'Question deleted.']);
    }
}
