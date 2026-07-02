<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class ReviewSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $submission = $this->route('submission');

        return $this->user() !== null && $submission !== null && $this->user()->can('review', $submission);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'score' => ['required', 'integer', 'min:0'],
            'feedback' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
        ];
    }

    /**
     * Enforce `score <= dailyTask->points` — the route-bound submission
     * (via implicit route model binding on the `{submission}` parameter,
     * i.e. routes registered as `/submissions/{submission}/review`) is
     * used to resolve the related DailyTask's max points.
     */
    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $submission = $this->route('submission');

            if (! $submission || ! $this->filled('score')) {
                return;
            }

            $maxPoints = $submission->dailyTask?->points;

            if ($maxPoints !== null && (int) $this->input('score') > $maxPoints) {
                $validator->errors()->add('score', "The score must not exceed the task's maximum points ({$maxPoints}).");
            }
        });
    }
}
