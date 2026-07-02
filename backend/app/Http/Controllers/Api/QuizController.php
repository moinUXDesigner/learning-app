<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Quiz;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function index(Course $course): JsonResponse
    {
        return response()->json(
            $course->quizzes()->paginate(15)
        );
    }

    public function store(Request $request, Course $course): JsonResponse
    {
        $this->authorize('create', Quiz::class);

        $validated = $request->validate([
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'title' => ['required', 'string', 'max:255'],
            'total_marks' => ['required', 'integer', 'min:1'],
            'pass_marks' => ['required', 'integer', 'min:0'],
        ]);

        $quiz = $course->quizzes()->create($validated);

        return response()->json($quiz, 201);
    }

    public function show(Quiz $quiz): JsonResponse
    {
        $this->authorize('view', $quiz);

        return response()->json($quiz->load(['course', 'lesson', 'questions']));
    }

    public function update(Request $request, Quiz $quiz): JsonResponse
    {
        $this->authorize('update', $quiz);

        $validated = $request->validate([
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'total_marks' => ['sometimes', 'required', 'integer', 'min:1'],
            'pass_marks' => ['sometimes', 'required', 'integer', 'min:0'],
        ]);

        $quiz->update($validated);

        return response()->json($quiz->fresh());
    }

    public function destroy(Quiz $quiz): JsonResponse
    {
        $this->authorize('delete', $quiz);

        $quiz->delete();

        return response()->json(['message' => 'Quiz deleted.']);
    }
}
