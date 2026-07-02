<?php

namespace App\Http\Resources;

use App\Enums\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Hiding strategy (documented, since the exact approach was left to us):
 * a student must be able to see the question text and the answer options
 * to attempt a quiz, but must NOT be able to see which option is correct
 * ahead of time. So:
 *  - `correct_answer` is hidden entirely for students.
 *  - `options` is passed through as-is for students. The `options` column
 *    is a plain array cast (see Question model), not an array of
 *    {text, is_correct} objects with a per-option correctness flag, so
 *    there is no separate "correct flag" embedded inside each option to
 *    strip out - the only place correctness leaks from is the
 *    `correct_answer` column itself, which is fully hidden below.
 *  - teacher/org_admin/super_admin (anyone who can manage the quiz) see
 *    everything, including `correct_answer`, since they need it to
 *    author/edit questions.
 */
class QuestionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isStudent = $user !== null && $user->role === Role::Student;

        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,
            'question_text' => $this->question_text,
            'question_type' => $this->question_type,
            'options' => $this->options,
            'correct_answer' => $isStudent ? null : $this->correct_answer,
            'marks' => $this->marks,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
